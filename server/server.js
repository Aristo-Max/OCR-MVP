// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { runGeminiVisionOCR } = require('./geminiHelper');

dotenv.config();

const app = express();
const PORT = 3001;
app.use(express.json());

// Enable CORS for all routes
const cors = require('cors');
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// Use helper function
app.post('/ocr', upload.single('image'), async (req, res) => {
    const imagePath = path.join(__dirname, req.file.path);
    const mimeType = req.file.mimetype;

    try {
        const { text } = await runGeminiVisionOCR(imagePath, mimeType);

        // Delete uploaded image
        fs.unlinkSync(imagePath);

        res.json({
            message: text
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Hello from AristoMax OCR server!');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});