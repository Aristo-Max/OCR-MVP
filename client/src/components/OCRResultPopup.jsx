import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FileSearch, X } from "lucide-react";
import { ClipLoader } from "react-spinners"; // Add this import

const highlightSubstring = (text, substring, highlightRef) => {
    if (!substring || !text) return text;
    const regex = new RegExp(substring, "gi");
    const parts = text.split(regex);
    const matches = text.match(regex);
    if (!matches) return text;
    let result = [];
    parts.forEach((part, i) => {
        result.push(<span key={i + "-part"}>{part}</span>);
        if (i < matches.length) {
            result.push(
                <span
                    key={i + "-highlight"}
                    style={{ background: "#ffe066", color: "#b30000", fontWeight: "bold" }}
                    ref={i === 0 ? highlightRef : null} // attach ref to first match
                >
                    {matches[i]}
                </span>
            );
        }
    });
    return result;
};

const OCRResultPopup = ({ open, onClose, fileName, text }) => {
    const [search, setSearch] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const highlightRef = useRef(null);

    useEffect(() => {
        if (result && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [result]);

    if (!open) return null;

    const handleSemanticSearch = async (e) => {
        e.preventDefault();
        setError("");
        setResult(null);
        if (!search.trim()) {
            setError("Please enter a search query.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await axios.post("http://13.204.91.67:3001/semantic-search", {
                query: search,
                text: text
            });
            if (res.data && res.data.substring) {
                setResult(res.data.substring);
            } else {
                setResult(null);
                setError("Nothing matched from this text.");
            }
        } catch (err) {
            setResult(null);
            setError("Nothing matched from this text.");
        }
        setIsLoading(false);
    };

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
        }}>
            <div style={{
                background: "#fff",
                padding: 24,
                borderRadius: 8,
                width: "90%",
                boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                position: "relative"
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 8,
                        right: 12,
                        background: "transparent",
                        border: "none",
                        fontSize: 22,
                        cursor: "pointer"
                    }}
                    aria-label="Close"
                >
                    <X
                        size={18}
                        color="#000000"
                        style={{ cursor: "pointer" }} />
                </button>
                {/* Centered Title */}
                <h2 style={{ textAlign: "center", color: "#0D9ECA", margin: "0 0 18px 0" }}>Semantic Search</h2>
                {/* Search box and button row */}
                <form
                    onSubmit={handleSemanticSearch}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 18,
                        gap: 8
                    }}>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Type to search..."
                        style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 20,
                            border: "1px solid #ccc",
                            fontSize: "1rem"
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            background: "#0D9ECA",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 38,
                            height: 38,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            fontSize: 18
                        }}
                        aria-label="Search"
                    >
                        {isLoading
                            ? <ClipLoader size={18} color="#FFFFFF" loading={isLoading} />
                            : <FileSearch size={18} color="#FFFFFF" style={{ cursor: "pointer" }} />
                        }
                    </button>
                </form>
                {/* File name and text */}
                <h3 style={{ marginTop: 0 }}>{fileName}</h3>
                {error && (
                    <div style={{
                        backgroundColor: "#ffe5e5",
                        color: "#b30000",
                        padding: "10px",
                        borderRadius: "5px",
                        fontStyle: "italic",
                        marginBottom: 8
                    }}>
                        {error}
                    </div>
                )}
                <div style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    fontSize: "1rem",
                    padding: "10px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    background: "#fafbfc",
                    marginTop: 8,
                    maxHeight: "14em", // ~8 lines at 1rem + padding
                    overflowY: "auto"
                }}>
                    {result
                        ? highlightSubstring(text, result, highlightRef)
                        : text}
                </div>
            </div>
        </div>
    );
};

export default OCRResultPopup;