// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const pdfPoppler = require('pdf-poppler');
const { runGemini, runGeminiVisionOCR } = require('./geminiHelper');

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
                // Convert PDF to images
                const outputDir = path.join(tempDir, `${file.filename}_pages`);
                fs.mkdirSync(outputDir, { recursive: true });

                const options = {
                    format: 'jpeg',
                    out_dir: outputDir,
                    out_prefix: 'page',
                    page: null,
                    dpi: 150,
                };

                await pdfPoppler.convert(filePath, options);

                // Sort images by page number
                const images = fs.readdirSync(outputDir)
                    .filter(name => name.endsWith('.jpg'))
                    .sort((a, b) => {
                        // Extract page numbers from filenames like page-1.jpg
                        const getPageNum = n => parseInt(n.match(/page-(\d+)\.jpg/)?.[1] || "0", 10);
                        return getPageNum(a) - getPageNum(b);
                    })
                    .map((name, idx) => ({
                        path: path.join(outputDir, name),
                        sourceName: `${file.originalname} - page ${idx + 1}`
                    }));

                allImages.push(...images);

                fs.unlinkSync(filePath); // Delete original PDF
            } else if (mimeType.startsWith('image/')) {
                allImages.push({
                    path: filePath,
                    sourceName: file.originalname
                });
            } else {
                console.warn(`Unsupported file type: ${file.originalname}`);
            }
        }

        // OCR all images
        for (const img of allImages) {
            try {
                const { text } = await runGemini({ modelName: "gemini-2.0-flash-exp", imagePath: img.path, mimeType: 'image/jpeg', prompt: 'Extract only the handwritten text from the image.Do not include any introductory phrases.' });
                result.push({
                    fileName: img.sourceName,
                    text,
                });
                fs.unlinkSync(img.path); // cleanup
            } catch (err) {
                console.error(`Failed OCR on ${img.path}:`, err.message);
                result.push({
                    fileName: img.sourceName,
                    text: '',
                    error: err.message
                });
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
    console.log(`Server is running at http://localhost:${PORT}`);
});