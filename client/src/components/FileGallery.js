// client/src/components/FileGallery.js
import React, { useState, useEffect, useMemo } from 'react';
import FileCard from './FileCard';
import { getFileType } from '../utils/formatting';
import './FileGallery.css';

const FileGallery = ({
    tab,
    account,
    contract,
    currentFolder,
    searchQuery,
    filters,
    onFileAction,
    onFolderSelect
}) => {
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        const fetchFiles = async () => {
            if (!contract || !account) return;

            setLoading(true);
            setError(null);

            try {
                let fetchedFiles = [];

                if (tab === 'my-files') {
                    const userFiles = await contract.getMyFiles();
                    fetchedFiles = userFiles.filter(file => !file.isDeleted);
                } else if (tab === 'shared') {
                    const sharedFiles = await contract.getSharedWithMe();
                    fetchedFiles = sharedFiles.filter(file => !file.isDeleted);
                } else if (tab === 'public') {
                    const publicFiles = await contract.getPublicFiles();
                    fetchedFiles = publicFiles.filter(file => !file.isDeleted);
                }

                setFiles(fetchedFiles);
                setFolders([]);
                setSelectedFiles([]);
            } catch (err) {
                console.error('Error fetching files:', err);
                setError('Failed to load files');
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [tab, account, contract, currentFolder]);

    const filteredFiles = useMemo(() => {
        let result = [...files];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(file =>
                file.fileName.toLowerCase().includes(query) ||
                file.ipfsHash.toLowerCase().includes(query)
            );
        }

        if (filters.fileType !== 'all') {
            result = result.filter(file => {
                const fileType = getFileType(file.fileName, file.mimeType);
                return fileType === filters.fileType;
            });
        }

        if (filters.privacy !== 'all') {
            if (filters.privacy === 'private') {
                result = result.filter(file => file.isPrivate);
            } else if (filters.privacy === 'public') {
                result = result.filter(file => !file.isPrivate);
            }
        }

        result.sort((a, b) => {
            switch (filters.sortBy) {
                case 'name-asc':
                    return a.fileName.localeCompare(b.fileName);
                case 'name-desc':
                    return b.fileName.localeCompare(a.fileName);
                case 'date-desc':
                    return Number(b.timestamp) - Number(a.timestamp);
                case 'date-asc':
                    return Number(a.timestamp) - Number(b.timestamp);
                case 'size-desc':
                    return Number(b.fileSize) - Number(a.fileSize);
                case 'size-asc':
                    return Number(a.fileSize) - Number(b.fileSize);
                default:
                    return Number(b.timestamp) - Number(a.timestamp);
            }
        });

        return result;
    }, [files, searchQuery, filters]);

    const handleFileSelect = (fileId) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    if (loading) {
        return <div className="loading">Loading files...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="file-gallery">
            {selectedFiles.length > 0 && (
                <div className="batch-actions-bar glassmorphism">
                    <span>{selectedFiles.length} selected</span>
                    <div className="batch-actions">
                        <button onClick={() => setSelectedFiles([])}>Cancel</button>
                    </div>
                </div>
            )}

            {filteredFiles.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <h3>No files found</h3>
                    <p>{searchQuery ? 'Try adjusting your search terms' : 'Upload your first file to get started'}</p>
                </div>
            ) : (
                <>
                    <div className={`files-container ${viewMode}`}>
                        {filteredFiles.map(file => (
                            <FileCard
                                key={file.fileId.toString()}
                                file={file}
                                isSelected={selectedFiles.includes(file.fileId.toString())}
                                onSelect={handleFileSelect}
                                onAction={onFileAction}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>

                    <div className="view-mode-toggle">
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            Grid View
                        </button>
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            List View
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FileGallery;
