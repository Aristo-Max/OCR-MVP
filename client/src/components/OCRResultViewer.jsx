import React from "react";
import AutoResizingTextarea from "./AutoResizingTextarea";

const OCRResultViewer = ({ data }) => (
    <div>
        <h1 style={{ textAlign: "center", color: "#333" }}>Your Result</h1>
        <div
            style={{
                width: "95%",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginTop: "20px",
            }}
        >
            {data.map((row, i) => (
                <div key={i} style={{ marginBottom: "20px" }}>
                    <h4 style={{ color: "#333" }}>{row.fileName}</h4>
                    <AutoResizingTextarea value={row.text} />
                </div>
            ))}
        </div>
    </div>
);

export default OCRResultViewer;
