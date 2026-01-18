// client/src/components/UploadZone.js
import React, { useState, useRef } from 'react';
import './UploadZone.css';

const UploadZone = ({ onFileUpload, disabled }) => {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileSelect = async (file) => {
        if (!file || disabled || uploading) return;

        setUploading(true);
        try {
            await onFileUpload(file, isPrivate);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleClick = () => {
        if (!disabled && !uploading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="upload-zone-container">
            <div
                className={`upload-zone ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                {uploading ? (
                    <div className="upload-status">
                        <div className="spinner-small"></div>
                        <p>Uploading...</p>
                    </div>
                ) : (
                    <>
                        <span className="upload-icon">📤</span>
                        <p className="upload-text">
                            {dragging ? 'Drop file here' : 'Click or drag to upload'}
                        </p>
                    </>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    disabled={disabled || uploading}
                />
            </div>
            <label className="privacy-toggle">
                <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    disabled={disabled || uploading}
                />
                <span>🔒 Private (encrypted)</span>
            </label>
        </div>
    );
};

export default UploadZone;
