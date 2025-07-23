import sys
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import os
import json
from google.generativeai import GenerativeModel, configure

# Load API key
configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_semantic_match(text, query):
    model = GenerativeModel("gemini-2.0-flash-exp")
    prompt = f"""
    From the following text, return the exact substring that best matches this query semantically.
    Query: "{query}"
    Text: \"\"\"{text}\"\"\"
    Return just the substring or "null".
    """
    result = model.generate_content(prompt)
    return result.text.strip().strip('"').strip()

def highlight_in_pdf(pdf_path, query, output_path):
    doc = fitz.open(pdf_path)

    # Convert PDF to images and run OCR
    text_blocks = []
    pages = convert_from_path(pdf_path)
    for i, image in enumerate(pages):
        ocr_text = pytesseract.image_to_string(image)
        text_blocks.append((i, ocr_text))

    # Aggregate text and run semantic search
    full_text = "\n".join([block[1] for block in text_blocks])
    matched = get_semantic_match(full_text, query)

    if matched == "null" or not matched:
        print(json.dumps({ "highlighted_pdf": None, "matched_phrase": None }))
        return

    # Re-run OCR with boxes to find match coordinates
    for i, image in enumerate(pages):
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        page = doc[i]
        for j, word in enumerate(data['text']):
            if matched.lower() in word.lower():
                x, y, w, h = data['left'][j], data['top'][j], data['width'][j], data['height'][j]
                rect = fitz.Rect(x, y, x + w, y + h)
                highlight = page.add_highlight_annot(rect)
                highlight.update()
                break

    doc.save(output_path)
    print(json.dumps({ "highlighted_pdf": output_path, "matched_phrase": matched }))

if __name__ == "__main__":
    pdf_input = sys.argv[1]
    query = sys.argv[2]
    output_file = pdf_input.replace(".pdf", "_highlighted.pdf")
    highlight_in_pdf(pdf_input, query, output_file)
