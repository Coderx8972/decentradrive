// client/src/components/FileCard.jsx
import React from 'react';
import { formatFileSize, getFileTypeIcon, getFileType, formatDate } from '../utils/formatting';
import './FileCard.css';

const FileCard = ({ file, viewMode = 'grid', isSelected, onSelect, onAction }) => {
    const fileType = getFileType(file.fileName, file.mimeType);
    const icon = getFileTypeIcon(fileType);

    const handleClick = (e) => {
        if (e.ctrlKey || e.metaKey) {
            onSelect(file.fileId);
        } else {
            onAction(file, 'preview');
        }
    };

    const handleAction = (e, action) => {
        e.stopPropagation();
        onAction(file, action);
    };

    return (
        <div
            className={`file-card ${viewMode} ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
        >
            {viewMode === 'grid' ? (
                <>
                    <input
                        type="checkbox"
                        className="file-checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(file.fileId)}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="file-thumbnail">
                        {file.thumbnailHash ? (
                            <img src={`/api/file/${file.thumbnailHash}`} alt={file.fileName} />
                        ) : (
                            <div className="file-icon-large">{icon}</div>
                        )}
                    </div>

                    <div className="file-info">
                        <div className="file-name" title={file.fileName}>{file.fileName}</div>
                        <div className="file-meta">
                            <span>{formatFileSize(Number(file.fileSize))}</span>
                            <span>{formatDate(Number(file.timestamp))}</span>
                        </div>
                        {file.isPrivate && <span className="private-badge">🔒</span>}
                    </div>

                    <div className="file-actions">
                        <button
                            onClick={(e) => handleAction(e, 'download')}
                            title="Download"
                        >
                            ⬇️
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'share')}
                            title="Share"
                        >
                            🔗
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'delete')}
                            title="Delete"
                            className="delete-btn"
                        >
                            🗑️
                        </button>
                    </div>
                </>
            ) : (
                <div className="file-list-content">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(file.fileId)}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <span className="file-icon">{icon}</span>
                    <span className="file-name">{file.fileName}</span>
                    <span className="file-size">{formatFileSize(Number(file.fileSize))}</span>
                    <span className="file-date">{formatDate(Number(file.timestamp))}</span>
                    {file.isPrivate && <span className="private-badge">🔒</span>}
                    <div className="file-actions">
                        <button
                            onClick={(e) => handleAction(e, 'download')}
                            title="Download"
                        >
                            ⬇️
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'share')}
                            title="Share"
                        >
                            🔗
                        </button>
                        <button
                            onClick={(e) => handleAction(e, 'delete')}
                            title="Delete"
                            className="delete-btn"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileCard;
