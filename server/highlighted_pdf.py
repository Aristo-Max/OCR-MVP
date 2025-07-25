# highlighted_pdf.py

import sys, os, json
import fitz                           # PyMuPDF
import pytesseract                    # for OCR bounding boxes
from pdf2image import convert_from_path
from sentence_transformers import SentenceTransformer
import numpy as np

# (Optional) silence tokenizers warnings before any imports that fork
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Path to your Tesseract binary
pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"

# Semantic model for per‑word embeddings
st_model     = SentenceTransformer("all-MiniLM-L6-v2")
SIM_THRESHOLD = 0.6

def extract_words_and_boxes(image):
    """Tesseract→(word, box) for a PIL image."""
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    words, boxes = [], []
    for i, w in enumerate(data["text"]):
        w = w.strip()
        if not w:
            continue
        x, y, w_, h_ = (data[k][i] for k in ("left","top","width","height"))
        words.append(w)
        boxes.append((x, y, x + w_, y + h_))
    return words, boxes

def highlight_semantically(pdf_path, query, output_path):
    doc       = fitz.open(pdf_path)
    query_emb = st_model.encode(query, convert_to_numpy=True)

    # Pre‑render every page as a PIL image
    pages_img = convert_from_path(pdf_path, poppler_path="/opt/homebrew/bin")

    # We'll collect all matched words via embedding
    for page_num, page in enumerate(doc):
        page_w, page_h = page.rect.width, page.rect.height

        # 1) Native text layer search
        matched_words = []  # words we’ll also try to highlight via search_for
        text_layer    = page.get_text("text")
        if text_layer:
            # find any occurrences of the query itself
            for hit in page.search_for(query):
                page.add_highlight_annot(hit).update()
            # note: you could also search synonyms here if you have them
            # but we fallback below to word‑level OCR for semantic matches
        # 2) OCR + semantic embedding fallback
        #    (only run if no or partial hits above)
        image = pages_img[page_num]
        words, boxes = extract_words_and_boxes(image)
        if not words:
            continue

        # embed all words
        word_embs = st_model.encode(words, convert_to_numpy=True)
        sims      = (word_embs @ query_emb) / (
                       np.linalg.norm(word_embs, axis=1) * 
                       np.linalg.norm(query_emb)
                    )

        # for each semantically close word, either highlight via search_for
        # or via scaled OCR coords
        for idx, sim in enumerate(sims):
            if sim < SIM_THRESHOLD:
                continue
            w = words[idx]

            # try native text‐layer search first
            rects = page.search_for(w)
            if rects:
                for r in rects:
                    page.add_highlight_annot(r).update()
                continue

            # fallback: scale OCR pixel→PDF coords
            x0, y0, x1, y1 = boxes[idx]
            img_w, img_h   = image.size
            sx, sy = page_w / img_w, page_h / img_h

            # convert pixel coords to PDF points, flipping Y axis
            px0 = x0 * sx
            py1 = page_h - y0 * sy
            px1 = x1 * sx
            py0 = page_h - y1 * sy

            r = fitz.Rect(px0, py0, px1, py1)
            page.add_highlight_annot(r).update()

    # write out the new PDF
    doc.save(output_path)
    print(json.dumps({
        "highlighted_pdf": output_path,
        "threshold": SIM_THRESHOLD
    }))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python highlighted_pdf.py <input.pdf> <query>")
        sys.exit(1)

    inp = sys.argv[1]
    qry = sys.argv[2]
    out = inp.replace(".pdf", "_highlighted_all.pdf")
    highlight_semantically(inp, qry, out)
