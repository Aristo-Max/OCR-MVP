# highlight_sentences.py

import sys
import re
import json
import fitz                         # PyMuPDF
import numpy as np
from sentence_transformers import SentenceTransformer

# 1) Load the same embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

def split_into_sentences(text: str):
    """ Naïve splitter on . ? ! followed by whitespace """
    parts = re.split(r'(?<=[\.\?\!])\s+', text)
    return [s.strip() for s in parts if s.strip()]

def semantic_sentence_search(text: str, query: str, threshold: float = 0.5, top_k: int = None):
    """
    Embeds each sentence + the query, returns list of (sentence, score)
    above threshold, or top_k if you prefer fixed number.
    """
    sentences = split_into_sentences(text)
    if not sentences:
        return []

    # 2) Compute embeddings
    sent_embs = model.encode(sentences, convert_to_numpy=True)
    query_emb = model.encode([query],   convert_to_numpy=True)[0]

    # 3) Cosine similarity
    sims = (sent_embs @ query_emb) / (
           np.linalg.norm(sent_embs, axis=1) * np.linalg.norm(query_emb)
    )

    # 4) Pair & sort
    pairs = list(zip(sentences, sims))
    pairs.sort(key=lambda x: x[1], reverse=True)

    # 5) Filter by threshold or take top_k
    if top_k:
        return pairs[:top_k]
    return [(s, float(score)) for s, score in pairs if score >= threshold]

def highlight_sentences(pdf_path: str, query: str, output_path: str,
                        threshold: float = 0.5, top_k: int = None):
    doc = fitz.open(pdf_path)

    # 6) Extract full document text
    all_text = [page.get_text("text") for page in doc]
    full_text = "\n".join(all_text)

    # 7) Find matching sentences
    matches = semantic_sentence_search(full_text, query, threshold, top_k)
    matched_sents = [s for s, _ in matches]

    # 8) Highlight each sentence on every page
    for page in doc:
        for sent in matched_sents:
            rects = page.search_for(sent)
            for r in rects:
                page.add_highlight_annot(r).update()

    # 9) Save new PDF
    doc.save(output_path)

    # 10) Print summary
    print(json.dumps({
        "highlighted_pdf": output_path,
        "matches": len(matched_sents),
        "threshold": threshold
    }))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python highlight_sentences.py <query> <input.pdf>")
        sys.exit(1)

    query      = sys.argv[1]
    input_pdf  = sys.argv[2]
    output_pdf = input_pdf.replace(".pdf", "_highlighted_sentences.pdf")

    highlight_sentences(input_pdf, query, output_pdf)
