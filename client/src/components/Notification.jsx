import React from "react";

const Notification = ({ message, type }) => {
    if (!message) return null;
    return (
        <div
            style={{
                position: "fixed",
                top: "80px",
                left: "50%",
                transform: "translateX(-50%)",
                maxWidth: "400px",
                width: "90%",
                padding: "10px",
                backgroundColor: type === "success" ? "#0D9ECA" : "#dc3545",
                color: "white",
                textAlign: "center",
                borderRadius: "5px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                zIndex: 1000,
            }}
        >
            {message}
        </div>
    );
};

export default Notification;
