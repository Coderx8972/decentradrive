// client/src/components/FolderTree.js
import React, { useState, useEffect } from 'react';
import './FolderTree.css';

const FolderTree = ({ currentFolder, onFolderSelect, account, contract, onCreateFolder }) => {
    const [folders, setFolders] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        // Always show root folder
        const rootFolder = { id: 0, name: 'Root', icon: '📁', isRoot: true };
        setFolders([rootFolder]);
    }, [account]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            alert('Please enter a folder name');
            return;
        }

        if (!contract) {
            alert('Contract not loaded');
            return;
        }

        setIsCreating(true);
        try {
            // Create folder on blockchain
            const tx = await contract.createFolder(
                currentFolder, // parent folder ID
                newFolderName.trim(),
                false // isShared
            );

            await tx.wait();

            // Close modal and reset
            setShowCreateModal(false);
            setNewFolderName('');

            // Notify parent to refresh
            if (onCreateFolder) {
                onCreateFolder();
            }

            // Reload page to show new folder
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Failed to create folder: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="folder-tree">
            <h3 className="tree-title">📂 Folders</h3>
            <div className="folder-list">
                {folders.map((folder) => (
                    <div
                        key={folder.id}
                        className={`folder-item ${currentFolder === folder.id ? 'active' : ''}`}
                        onClick={() => onFolderSelect(folder.id)}
                    >
                        <span className="folder-icon">{folder.icon}</span>
                        <span className="folder-name">{folder.name}</span>
                    </div>
                ))}
            </div>
            <button
                className="create-folder-btn"
                onClick={() => setShowCreateModal(true)}
                disabled={!contract}
            >
                ➕ New Folder
            </button>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="folder-modal glassmorphism" onClick={(e) => e.stopPropagation()}>
                        <h3>Create New Folder</h3>
                        <input
                            type="text"
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowCreateModal(false)} disabled={isCreating}>
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={isCreating || !newFolderName.trim()}
                                className="primary"
                            >
                                {isCreating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FolderTree;
