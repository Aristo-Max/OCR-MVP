import React, { useEffect, useRef } from "react";

const AutoResizingTextarea = ({ value }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const lineHeight = 22; // approx for 14px font size with 1.5 line height
            const maxHeight = lineHeight * 50;
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
            textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            readOnly
            rows={1}
            style={{
                width: "97%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "14px",
                backgroundColor: "#f9f9f9",
                lineHeight: "1.5",
                resize: "none",
                overflowY: "hidden", // initially hidden, will be auto in JS
            }}
        />
    );
};

export default AutoResizingTextarea;
