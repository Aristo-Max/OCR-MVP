// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { runGemini } = require('./geminiHelper');
const { Poppler } = require('node-poppler');

dotenv.config();
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use(require('cors')());

const upload = multer({ dest: 'uploads/' });
const poppler = new Poppler(); // Optionally pass binary path: new Poppler('/usr/bin')

// OCR Batch Endpoint
app.post('/ocr-batch', upload.array('files'), async (req, res) => {
    const tempDir = path.join(__dirname, 'uploads');
    const result = [];

    try {
        const allImages = [];

        for (const file of req.files) {
            const filePath = path.join(tempDir, file.filename);

            if (file.mimetype === 'application/pdf') {
                const outputDir = path.join(tempDir, `${file.filename}_pages`);
                fs.mkdirSync(outputDir, { recursive: true });

                await poppler.pdfToCairo(
                    filePath,
                    path.join(outputDir, 'page.png'),
                    { pngFile: true }
                );

                const imageFiles = fs.readdirSync(outputDir)
                    .filter(f => f.endsWith('.png'))
                    .map((f, idx) => ({
                        path: path.join(outputDir, f),
                        sourceName: `${file.originalname} - page ${idx + 1}`
                    }));

                allImages.push(...imageFiles);
                fs.unlinkSync(filePath);

            } else if (file.mimetype.startsWith('image/')) {
                allImages.push({ path: filePath, sourceName: file.originalname });
            } else {
                console.warn(`Unsupported file type: ${file.originalname}`);
            }
        }

        for (const img of allImages) {
            try {
                const { text } = await runGemini({
                    modelName: "gemini-2.5-flash",
                    imagePath: img.path,
                    mimeType: 'image/png',
                    prompt: 'Extract both normal (printed) text and handwritten text from the image, if available. Do not include any introductory or explanatory phrases in the output.'
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

// Semantic Search Endpoint
app.post('/semantic-search', async (req, res) => {
    try {
        const { query, text } = req.body;
        if (!query || !text) {
            return res.status(400).json({ error: "Query and text are required." });
        }

        const prompt = `
Given the following paragraph and a user query, find and return the most semantically similar sentence, phrase, or word from the paragraph that closely matches the meaning of the query.

Query: "${query}"
Text: """${text}"""

Return only the exact matching substring from the text (as it appears). If nothing matches, return "null". Do not explain your answer.
`;

        const { text: geminiResult } = await runGemini({
            modelName: "gemini-2.0-flash-exp",
            prompt
        });

        
        console.log("Gemini Result:", geminiResult);
        if (!geminiResult) {
            return res.status(500).json({ error: "No response from Gemini API." });
        }
        let substring = geminiResult && geminiResult.trim().replace(/^["']|["']$/g, '');
        if (!substring || substring.toLowerCase() === 'null') substring = null;

        res.json({ substring });

    } catch (err) {
        console.error("Semantic Search Error:", err);
        res.status(500).json({ error: "Semantic search failed." });
    }
});

app.get('/', (req, res) => res.send('Hello from AristoMax OCR server!'));

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});