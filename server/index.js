// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { runGemini } = require('./geminiHelper');
const { fromPath } = require("pdf2pic");
const Poppler = require('pdf-poppler');

dotenv.config();

const app = express();
const PORT = 3001;
app.use(express.json());

// Enable CORS for all routes
const cors = require('cors');
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// Use helper function
app.post('/ocr-batch', upload.array('files'), async (req, res) => {
    const tempDir = path.join(__dirname, 'uploads');
    const result = [];

    try {
        const allImages = [];

        for (const file of req.files) {
            const mimeType = file.mimetype;
            const filePath = path.join(tempDir, file.filename);

            if (mimeType === 'application/pdf') {
                const outputDir = path.join(tempDir, `${file.filename}_pages`);
                fs.mkdirSync(outputDir, { recursive: true });

                const opts = {
                    format: 'png',
                    out_dir: outputDir,
                    out_prefix: 'page',
                    page: null // all pages
                };

                // Convert PDF to images
                await Poppler.convert(filePath, opts);

                // Collect all generated images
                const imageFiles = fs.readdirSync(outputDir)
                    .filter(f => f.endsWith('.png'))
                    .map((f, idx) => ({
                        path: path.join(outputDir, f),
                        sourceName: `${file.originalname} - page ${idx + 1}`
                    }));

                allImages.push(...imageFiles);

                fs.unlinkSync(filePath);
            }
            else if (mimeType.startsWith('image/')) {
                allImages.push({ path: filePath, sourceName: file.originalname });
            }
            else {
                console.warn(`Unsupported file type: ${file.originalname}`);
            }
        }

        for (const img of allImages) {
            try {
                const { text } = await runGemini({
                    modelName: "gemini-2.0-flash-exp",
                    imagePath: img.path,
                    mimeType: 'image/png',
                    prompt: 'Extract only the handwritten text from the image. Do not include any introductory phrases.'
                });
                result.push({ fileName: img.sourceName, text });
            } catch (err) {
                console.error(`Failed OCR on ${img.path}:`, err.message);
                result.push({ fileName: img.sourceName, text: '', error: err.message });
            } finally {
                fs.unlinkSync(img.path);
            }
        }

        res.json({ results: result });
    } catch (err) {
        console.error('OCR Batch Error:', err);
        res.status(500).json({ error: 'OCR batch processing failed.' });
    }
});

// Semantic Search API using Gemini
app.post('/semantic-search', async (req, res) => {
    try {
        const { query, text } = req.body;
        if (!query || !text) {
            return res.status(400).json({ error: "Query and text are required." });
        }
        const prompt = `
Given the following text, find and return the most relevant substring (exact phrase) that matches the semantic meaning of the query. 
If nothing matches, return null.
Query: "${query}"
Text: """${text}"""
Return only the matching substring or null.
`;

        // Use the dynamic Gemini helper for text prompt
        const { text: geminiResult } = await runGemini({ modelName: "gemini-2.0-flash-exp", prompt });

        let substring = geminiResult && geminiResult.trim();
        if (substring === "null" || !substring) substring = null;

        res.json({ substring });
    } catch (err) {
        console.error("Semantic Search Error:", err);
        res.status(500).json({ error: "Semantic search failed." });
    }
});

app.get('/', (req, res) => {
    res.send('Hello from AristoMax OCR server!');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://13.204.91.67:${PORT}`);
});