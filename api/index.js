const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for memory storage (Vercel serverless)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'DecentraDrive API is running' });
});

// Upload file to IPFS via Pinata
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const pinataMetadata = JSON.stringify({
            name: req.file.originalname
        });
        formData.append('pinataMetadata', pinataMetadata);

        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
                }
            }
        );

        res.json({
            ipfsHash: response.data.IpfsHash,
            pinSize: response.data.PinSize,
            timestamp: response.data.Timestamp
        });
    } catch (error) {
        console.error('Upload error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to upload to IPFS',
            details: error.response?.data || error.message
        });
    }
});

// Get file from IPFS
app.get('/api/file/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`, {
            responseType: 'arraybuffer'
        });

        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error('Retrieval error:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve from IPFS',
            details: error.message
        });
    }
});

// Export for Vercel serverless
module.exports = app;
