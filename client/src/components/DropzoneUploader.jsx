import { useDropzone } from "react-dropzone";

const DropzoneUploader = ({ onDrop, fileRequired }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "application/pdf": [".pdf"],
        },
    });

    return (
        <>
            <div
                {...getRootProps()}
                style={{
                    border: "2px dashed #0D9ECA",
                    borderRadius: "8px",
                    padding: "15px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: isDragActive ? "#eaf6ff" : "#f9f9f9",
                    marginBottom: "15px",
                }}
            >
                <input {...getInputProps()} />
                <p style={{ color: "#555" }}>
                    {isDragActive ? "Drop the files here..." : "Select Images or PDF OR Drag & Drop here..."}
                </p>
            </div>
            {fileRequired && (
                <p style={{ color: "red", marginTop: "-10px", marginBottom: "10px", textAlign: "center" }}>
                    * File selection is required
                </p>
            )}
        </>
    );
};

export default DropzoneUploader;