// client/src/components/ShareModal.jsx
import React, { useState } from 'react';
import { generateRandomPassword, hashPassword } from '../utils/encryption';
import './ShareModal.css';

const ShareModal = ({ file, onClose, onShare }) => {
    const [shareType, setShareType] = useState('address');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [password, setPassword] = useState('');
    const [maxDownloads, setMaxDownloads] = useState(0);
    const [expiresIn, setExpiresIn] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGeneratePassword = () => {
        const newPassword = generateRandomPassword();
        setPassword(newPassword);
    };

    const handleShare = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let shareParams = { type: shareType };

            if (shareType === 'address') {
                if (!recipientAddress) throw new Error('Please enter a recipient address');
                shareParams.address = recipientAddress;
            } else if (shareType === 'password') {
                if (!password) throw new Error('Please enter or generate a password');
                const passwordHash = await hashPassword(password);
                shareParams.password = password;
                shareParams.passwordHash = passwordHash;
            }

            if (maxDownloads > 0) shareParams.maxDownloads = maxDownloads;
            if (expiresIn > 0) {
                shareParams.expiresAt = Math.floor(Date.now() / 1000) + (expiresIn * 24 * 60 * 60);
            }

            await onShare(file.fileId, shareParams);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to share file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal glassmorphism" onClick={e => e.stopPropagation()}>
                <h2>Share: {file.fileName}</h2>

                <div className="share-type-tabs">
                    <button
                        className={shareType === 'address' ? 'active' : ''}
                        onClick={() => setShareType('address')}
                    >
                        👤 Address
                    </button>
                    <button
                        className={shareType === 'link' ? 'active' : ''}
                        onClick={() => setShareType('link')}
                    >
                        🔗 Public Link
                    </button>
                    <button
                        className={shareType === 'password' ? 'active' : ''}
                        onClick={() => setShareType('password')}
                    >
                        🔒 Password
                    </button>
                </div>

                <div className="share-form">
                    {shareType === 'address' && (
                        <div className="form-group">
                            <label>Recipient Wallet Address:</label>
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                placeholder="0x..."
                            />
                        </div>
                    )}

                    {shareType === 'password' && (
                        <div className="form-group">
                            <label>Password:</label>
                            <div className="password-input-group">
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                                <button type="button" onClick={handleGeneratePassword}>
                                    Generate
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Max Downloads:</label>
                            <input
                                type="number"
                                min="0"
                                value={maxDownloads}
                                onChange={(e) => setMaxDownloads(parseInt(e.target.value) || 0)}
                                placeholder="Unlimited"
                            />
                        </div>

                        <div className="form-group">
                            <label>Expires in (days):</label>
                            <input
                                type="number"
                                min="0"
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(parseInt(e.target.value) || 0)}
                                placeholder="Never"
                            />
                        </div>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                    <button onClick={onClose} disabled={isLoading}>Cancel</button>
                    <button onClick={handleShare} disabled={isLoading} className="primary">
                        {isLoading ? 'Sharing...' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
