// geminiHelper.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function runGemini({ modelName, imagePath, prompt, mimeType }) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in your .env file.');
    }
    if (!modelName) {
        throw new Error('modelName must be provided (e.g., "gemini-pro", "gemini-1.5-flash").');
    }
    if (!prompt && !imagePath) {
        throw new Error('Either prompt or imagePath must be provided.');
    }
    if (imagePath && !mimeType) {
        throw new Error('mimeType is required when imagePath is provided (e.g., "image/jpeg").');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    let parts = [];

    if (imagePath) {
        function fileToGenerativePart(path, mimeType) {
            return {
                inlineData: {
                    data: Buffer.from(fs.readFileSync(path)).toString('base64'),
                    mimeType
                },
            };
        }
        parts.push(fileToGenerativePart(imagePath, mimeType));
    }

    if (prompt) {
        parts.push({ text: prompt });
    }

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: parts
            }]
        });

        const response = await result.response;
        const text = response.text();
        return { text: text };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

module.exports = { runGemini };