// geminiHelper.js
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const runGeminiVisionOCR = async (filePath, mimeType, prompt = 'Extract only the handwritten text from the image.Do not include any introductory phrases.') => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType,
                                data: base64Image,
                            },
                        },
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        const response = await result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'No text found';

        return {
            text
        };
    } catch (error) {
        console.error('Gemini OCR Helper Error:', error);
        throw new Error('Gemini Vision OCR failed');
    }
};

module.exports = { runGeminiVisionOCR };