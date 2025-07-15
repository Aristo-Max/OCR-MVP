import React from "react";
import { ClipLoader } from "react-spinners";

const UploadButton = ({ isLoading }) => (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
            type="submit"
            disabled={isLoading}
            style={{
                backgroundColor: "#0D9ECA",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
            }}
        >
            {isLoading ? <ClipLoader size={15} color={"#ffffff"} loading={isLoading} /> : "Upload"}
        </button>
    </div>
);

export default UploadButton;
