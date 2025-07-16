import { useState } from "react";
import { Search } from "lucide-react";
import OCRResultPopup from "./OCRResultPopup";
import AutoResizingTextarea from "./AutoResizingTextarea";

const OCRResultViewer = ({ data }) => {
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupRow, setPopupRow] = useState(null);

    const handleSearchClick = (row) => {
        setPopupRow(row);
        setPopupOpen(true);
    };

    const handleClosePopup = () => {
        setPopupOpen(false);
        setPopupRow(null);
    };

    return (
        <div>
            <h1 style={{ textAlign: "center", color: "#0D9ECA" }}>OCR Results</h1>
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                                <h4 style={{ color: "#333", margin: 0 }}>{row.fileName}</h4>
                                <Search
                                    size={18}
                                    color="#0D9ECA"
                                    style={{ marginRight: 18, cursor: "pointer" }}
                                    onClick={() => handleSearchClick(row)}
                                />
                            </div>
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
            <OCRResultPopup
                open={popupOpen}
                onClose={handleClosePopup}
                fileName={popupRow?.fileName}
                text={popupRow?.text}
            />
        </div>
    );
};

export default OCRResultViewer;
