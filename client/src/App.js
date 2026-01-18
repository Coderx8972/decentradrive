// client/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContract } from './hooks/useContract';
import FileGallery from './components/FileGallery';
import UploadZone from './components/UploadZone';
import FolderTree from './components/FolderTree';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import Notifications from './components/Notifications';
import PreviewModal from './components/PreviewModal';
import ShareModal from './components/ShareModal';
import { signMessageForEncryption, generateEncryptionKey, exportKey } from './utils/encryption';
import './App.css';

function App() {
    const [provider, setProvider] = useState(null);
    const [activeTab, setActiveTab] = useState('my-files');
    const [currentFolder, setCurrentFolder] = useState(0); // 0 = root
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        fileType: 'all',
        privacy: 'all',
        dateRange: 'all',
        sortBy: 'date-desc'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [shareFile, setShareFile] = useState(null);
    const [userSignature, setUserSignature] = useState(null);

    // Backend URL - uses environment variable in production, empty in development (uses proxy)
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

    // Initialize Web3 provider
    useEffect(() => {
        const initProvider = async () => {
            if (window.ethereum) {
                try {
                    const web3Provider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(web3Provider);

                    // Listen for account changes
                    window.ethereum.on('accountsChanged', () => {
                        window.location.reload();
                    });

                    // Listen for chain changes
                    window.ethereum.on('chainChanged', () => {
                        window.location.reload();
                    });
                } catch (error) {
                    console.error('Error initializing provider:', error);
                    setError('Failed to connect to wallet');
                }
            } else {
                setError('Please install MetaMask or another Ethereum wallet');
            }
        };

        initProvider();
    }, []);

    const { contract, signer, account } = useContract(provider);

    // Get user signature for encryption
    useEffect(() => {
        const getSignature = async () => {
            if (signer && account && !userSignature) {
                try {
                    const { signature } = await signMessageForEncryption(signer, 'Sign to derive encryption key');
                    setUserSignature(signature);
                } catch (error) {
                    console.log('User declined signature');
                }
            }
        };
        getSignature();
    }, [signer, account, userSignature]);

    // Handle wallet connection
    const connectWallet = async () => {
        if (!provider) {
            setError('No wallet provider found');
            return;
        }

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            window.location.reload();
        } catch (error) {
            console.error('Error connecting wallet:', error);
            setError('Failed to connect wallet');
        }
    };

    // Handle file upload
    const handleFileUpload = async (file, isPrivate, folderId = currentFolder) => {
        if (!contract || !signer) {
            setError('Please connect your wallet first');
            return;
        }

        setIsLoading(true);
        try {
            // Upload to backend (IPFS)
            const formData = new FormData();
            formData.append('file', file);

            const ipfsResponse = await fetch(`${BACKEND_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const ipfsData = await ipfsResponse.json();

            if (!ipfsData.success) {
                throw new Error('Failed to upload to IPFS');
            }

            let encryptedKey = '';

            // Handle private file encryption
            if (isPrivate && userSignature) {
                const encKey = await generateEncryptionKey();
                encryptedKey = await exportKey(encKey);
            }

            // Upload metadata to blockchain with enhanced fields
            const tx = await contract.uploadFile(
                folderId,
                file.name,
                ipfsData.ipfsHash,
                file.size,
                isPrivate,
                encryptedKey,
                ipfsData.mimeType || file.type || '',
                ipfsData.thumbnailHash || ''
            );

            await tx.wait();
            setError(null);

            // Refresh page to show new file
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload file: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file actions (preview, download, share, delete)
    const handleFileAction = useCallback(async (file, action, params) => {
        if (!contract || !signer) {
            setError('Please connect your wallet');
            return;
        }

        try {
            switch (action) {
                case 'preview':
                    setPreviewFile(file);
                    break;

                case 'download':
                    setIsLoading(true);
                    try {
                        // Try backend first, fallback to direct Pinata gateway
                        let downloadUrl = `/api/file/${file.ipfsHash}`;

                        try {
                            const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
                            if (!testResponse.ok) {
                                downloadUrl = `https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`;
                            }
                        } catch (err) {
                            downloadUrl = `https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`;
                        }

                        // Fetch the file as a blob to avoid CORS issues with download attribute
                        const response = await fetch(downloadUrl);
                        if (!response.ok) throw new Error('Failed to fetch file');

                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        // Create download link with blob URL
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = file.fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // Clean up blob URL
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                    } catch (err) {
                        console.error('Download error:', err);
                        setError('Failed to download file. Opening in new tab instead...');
                        // Fallback: open in new tab
                        window.open(`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`, '_blank');
                    } finally {
                        setIsLoading(false);
                    }
                    break;

                case 'share':
                    setShareFile(file);
                    break;

                case 'delete':
                    if (window.confirm(`Delete ${file.fileName}?`)) {
                        setIsLoading(true);
                        const tx = await contract.deleteFile(file.fileId);
                        await tx.wait();
                        window.location.reload();
                    }
                    break;

                default:
                    console.warn('Unknown action:', action);
            }
        } catch (error) {
            console.error('File action error:', error);
            setError('Failed to perform action: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [contract, signer]);

    // Handle sharing file
    const handleShareFile = async (fileId, shareParams) => {
        if (!contract) throw new Error('Contract not ready');

        setIsLoading(true);
        try {
            if (shareParams.type === 'address') {
                // Simple sharing without re-encryption for now
                const tx = await contract.grantAccess(
                    fileId,
                    shareParams.address,
                    'shared-key',
                    shareParams.expiresAt || 0
                );
                await tx.wait();
            } else if (shareParams.type === 'password') {
                const tx = await contract.createPasswordLink(
                    fileId,
                    shareParams.passwordHash,
                    shareParams.maxDownloads || 0,
                    shareParams.expiresAt || 0
                );
                await tx.wait();
                alert(`Password: ${shareParams.password}\nShare this with the recipient.`);
            }
            setError(null);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Share error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    if (!window.ethereum) {
        return (
            <div className="app">
                <div className="connect-wallet">
                    <h1>🚀 DecentraDrive</h1>
                    <p>❌ MetaMask not detected</p>
                    <p className="error-text">Please install MetaMask to use this application</p>
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="connect-button"
                    >
                        Install MetaMask
                    </a>
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="app">
                <div className="connect-wallet">
                    <h1>🚀 DecentraDrive</h1>
                    <p>Decentralized file storage with encryption and blockchain permanence</p>
                    <button onClick={connectWallet} className="connect-button">
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header glassmorphism">
                <div className="logo">📁 DecentraDrive</div>
                <div className="wallet-info">
                    <span className="account-address">
                        {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </span>
                </div>
            </header>

            <div className="app-content">
                <aside className="sidebar glassmorphism">
                    <FolderTree
                        currentFolder={currentFolder}
                        onFolderSelect={setCurrentFolder}
                        account={account}
                        contract={contract}
                    />
                </aside>

                <main className="main-content">
                    <div className="toolbar glassmorphism">
                        <div className="tabs">
                            <button
                                className={activeTab === 'my-files' ? 'active' : ''}
                                onClick={() => setActiveTab('my-files')}
                            >
                                My Files
                            </button>
                            <button
                                className={activeTab === 'shared' ? 'active' : ''}
                                onClick={() => setActiveTab('shared')}
                            >
                                Shared with Me
                            </button>
                            <button
                                className={activeTab === 'public' ? 'active' : ''}
                                onClick={() => setActiveTab('public')}
                            >
                                Public Files
                            </button>
                        </div>

                        <UploadZone onFileUpload={handleFileUpload} disabled={!account || isLoading} />
                    </div>

                    <div className="search-filter-section">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                        <FilterPanel
                            filters={filters}
                            onFilterChange={setFilters}
                        />
                    </div>

                    <FileGallery
                        tab={activeTab}
                        account={account}
                        contract={contract}
                        currentFolder={currentFolder}
                        searchQuery={searchQuery}
                        filters={filters}
                        onFileAction={handleFileAction}
                        onFolderSelect={setCurrentFolder}
                    />
                </main>
            </div>

            <Notifications />

            {previewFile && (
                <PreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                    onDownload={() => handleFileAction(previewFile, 'download')}
                />
            )}

            {shareFile && (
                <ShareModal
                    file={shareFile}
                    onClose={() => setShareFile(null)}
                    onShare={handleShareFile}
                />
            )}

            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Processing transaction...</p>
                </div>
            )}

            {error && (
                <div className="error-toast">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}
        </div>
    );
}

export default App;
