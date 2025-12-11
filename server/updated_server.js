// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { runGemini } = require('./geminiHelper');
const { Poppler } = require('node-poppler');

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
                    modelName: "gemini-2.0-flash-exp",
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
Given the following text, find and return the most relevant substring (exact phrase) that matches the semantic meaning of the query. 
If nothing matches, return null.
Query: "${query}"
Text: """${text}"""
Return only the matching substring or null.
`;

        const { text: geminiResult } = await runGemini({
            modelName: "gemini-2.0-flash-exp",
            prompt
        });

        let substring = geminiResult && geminiResult.trim();
        if (substring === "null" || !substring) substring = null;

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


const { spawn } = require('child_process');

// Highlight PDF Endpoint
app.post('/highlight-pdf', upload.single('pdf'), (req, res) => {
    const query = req.body.query;
    const pdfPath = req.file.path;

    const python = spawn('python3', ['highlight_pdf.py', pdfPath, query]);

    let result = "";
    python.stdout.on('data', data => result += data.toString());
    python.stderr.on('data', err => console.error("Highlight Error:", err.toString()));

    python.on('close', () => {
        try {
            const output = JSON.parse(result);
            if (output.highlighted_pdf) {
                res.download(output.highlighted_pdf);
            } else {
                res.status(200).json({ message: "No match found", phrase: output.matched_phrase });
            }
        } catch (e) {
            console.error("Failed to parse highlight script output", e);
            res.status(500).json({ error: "PDF highlight failed" });
        }
    });
});
