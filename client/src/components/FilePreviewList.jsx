import React from "react";

const FilePreviewList = ({ previews, onRemove }) => {
    return (
        <div style={{
            maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "8px", padding: "15px", marginTop: "15px",
        }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" }}>
                {previews.map((preview, index) => (
                    <div key={index} style={{
                        position: "relative", width: "90px", height: "100px", borderRadius: "5px", border: "1px solid #ddd", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                    }}>
                        {preview.isLoading ? (
                            <div style={{
                                width: "30px", height: "30px", border: "4px solid #ccc", borderTop: "4px solid #0D9ECA", borderRadius: "50%", animation: "spin 1s linear infinite",
                            }} />
                        ) : preview.type.startsWith("image/") ? (
                            <img src={preview.url} alt={`Preview ${index + 1}`} style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                        ) : (
                            <>
                                <img src="/pdfimg.png" alt="PDF" style={{ width: "100%", height: "70%", objectFit: "contain" }} />
                                <p style={{
                                    fontSize: "12px", color: "#333", textAlign: "center", marginTop: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80px",
                                }}>{preview.name}</p>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            style={{
                                position: "absolute", top: "-10px", right: "-10px", background: "#fff", border: "none", borderRadius: "50%", fontSize: "20px", width: "25px", height: "25px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                            }}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FilePreviewList;
