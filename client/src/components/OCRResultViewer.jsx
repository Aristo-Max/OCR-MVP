import React from "react";
import AutoResizingTextarea from "./AutoResizingTextarea";

const OCRResultViewer = ({ data }) => (
    <div>
        <h1 style={{ textAlign: "center", color: "#333" }}>OCR Results</h1>
        <div
            style={{
                width: "95%",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginTop: "20px",
            }}
        >
            {data.length === 0 ? (
                <p style={{ color: "#888", textAlign: "center" }}>No results to display.</p>
            ) : (
                data.map((row, i) => (
                    <div key={i} style={{ marginBottom: "20px" }}>
                        <h4 style={{ color: "#333" }}>{row.fileName}</h4>

                        {row.error ? (
                            <div style={{
                                backgroundColor: "#ffe5e5",
                                color: "#b30000",
                                padding: "10px",
                                borderRadius: "5px",
                                fontStyle: "italic",
                            }}>
                                OCR failed: {row.error}
                            </div>
                        ) : row.text?.trim() ? (
                            <AutoResizingTextarea value={row.text} />
                        ) : (
                            <div style={{ color: "#777", fontStyle: "italic" }}>No text extracted.</div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
);

export default OCRResultViewer;
