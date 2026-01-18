// client/src/components/PreviewModal.jsx
import React, { useState, useEffect } from 'react';
import { getFileType, formatFileSize, formatDate } from '../utils/formatting';
import './PreviewModal.css';

const PreviewModal = ({ file, onClose, onDownload }) => {
    const [previewContent, setPreviewContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        const loadPreview = async () => {
            try {
                setLoading(true);
                const fileType = getFileType(file.fileName, file.mimeType);

                // Try backend first, fallback to direct Pinata gateway
                let fileUrl = `${BACKEND_URL}/api/file/${file.ipfsHash}`;

                try {
                    const testResponse = await fetch(fileUrl, { method: 'HEAD' });
                    if (!testResponse.ok) {
                        fileUrl = `https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`;
                    }
                } catch (err) {
                    fileUrl = `https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`;
                }

                switch (fileType) {
                    case 'image':
                        setPreviewContent(
                            <img src={fileUrl} alt={file.fileName} className="preview-image" />
                        );
                        break;

                    case 'pdf':
                        setPreviewContent(
                            <iframe src={fileUrl} title={file.fileName} className="preview-pdf" />
                        );
                        break;

                    case 'video':
                        setPreviewContent(
                            <video src={fileUrl} controls className="preview-video" />
                        );
                        break;

                    case 'audio':
                        setPreviewContent(
                            <audio src={fileUrl} controls className="preview-audio" />
                        );
                        break;

                    case 'text':
                    case 'code':
                        const response = await fetch(fileUrl);
                        const text = await response.text();
                        setPreviewContent(
                            <pre className="preview-text">{text}</pre>
                        );
                        break;

                    default:
                        setPreviewContent(
                            <div className="preview-unsupported">
                                <p>📁</p>
                                <p>Preview not available for this file type</p>
                                <p>{file.fileName}</p>
                            </div>
                        );
                }
                setLoading(false);
            } catch (err) {
                console.error('Preview error:', err);
                setError('Failed to load preview');
                setLoading(false);
            }
        };

        if (file) loadPreview();
    }, [file]);

    if (!file) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="preview-modal glassmorphism" onClick={e => e.stopPropagation()}>
                <div className="preview-header">
                    <h2>{file.fileName}</h2>
                    <div className="preview-actions">
                        <button onClick={onDownload} className="download-btn">⬇️ Download</button>
                        <button onClick={onClose} className="close-btn">×</button>
                    </div>
                </div>

                <div className="preview-content">
                    {loading && <div className="preview-loading">Loading preview...</div>}
                    {error && <div className="preview-error">{error}</div>}
                    {previewContent}
                </div>

                <div className="preview-footer">
                    <span>{formatFileSize(Number(file.fileSize))}</span>
                    <span>{file.isPrivate ? '🔒 Private' : '🌐 Public'}</span>
                    <span>{formatDate(Number(file.timestamp))}</span>
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
