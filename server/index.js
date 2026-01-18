const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const { createHash } = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Enhanced CORS configuration for production
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(require('cors')(corsOptions));

// Note: Frontend is deployed separately on Vercel
// This backend only serves API endpoints

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Pinata configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

// Helper function to upload file to Pinata
async function uploadToPinata(filePath, fileName) {
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, fileName);

    try {
        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            maxBodyLength: Infinity,
            headers: {
                ...formData.getHeaders(),
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY
            }
        });

        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to Pinata:', error.response?.data || error.message);
        throw new Error('Failed to upload file to IPFS');
    }
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Upload file to IPFS
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = req.file.originalname;
        const fileSize = req.file.size;
        const tempPath = req.file.path;

        // Calculate file hash for deduplication (optional)
        const fileBuffer = fs.readFileSync(tempPath);
        const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

        // Upload to Pinata
        const ipfsHash = await uploadToPinata(tempPath, fileName);

        // Clean up temporary file
        fs.unlinkSync(tempPath);

        res.json({
            success: true,
            ipfsHash,
            fileName,
            fileSize,
            fileHash,
            mimeType: req.file.mimetype,
            thumbnailHash: '' // Can be implemented later with sharp
        });
    } catch (error) {
        console.error('Upload error:', error);

        // Clean up temp file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
});

// Get file from IPFS
app.get('/api/file/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const response = await axios({
            method: 'GET',
            url: `${PINATA_GATEWAY}/ipfs/${hash}`,
            responseType: 'stream'
        });

        response.data.pipe(res);
    } catch (error) {
        console.error('File retrieval error:', error);
        res.status(404).json({ error: 'File not found' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 IPFS Gateway: ${PINATA_GATEWAY}`);
});
