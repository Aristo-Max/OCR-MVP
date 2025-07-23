import { useState, useEffect } from "react";
import axios from "axios";
import Header from "./components/Header";
import Footer from "./components/Footer";
import DropzoneUploader from "./components/DropzoneUploader";
import FilePreviewList from "./components/FilePreviewList";
import UploadButton from "./components/UploadButton";
import Notification from "./components/Notification";
import OCRResultViewer from "./components/OCRResultViewer";

function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [Data, setData] = useState(null);
  const [fileRequired, setFileRequired] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 3000);
  };

  const handleRemoveImage = (indexToRemove) => {
    const fileToRemove = previews[indexToRemove].file;
    setPreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== indexToRemove));
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const upload = async () => {
    if (files.length === 0) {
      setFileRequired(true);
      showNotification("Please select at least one file to upload.", "error");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await axios.post("http://13.204.91.67:3001/ocr-batch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && Array.isArray(response.data.results)) {
        setData(response.data.results);
        setIsLoaded(true);
        showNotification("OCR processing complete!", "success");
      } else {
        showNotification("Unexpected response from server.", "error");
      }
    } catch (error) {
      console.error("OCR batch error:", error);
      showNotification("OCR API error!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (acceptedFiles) => {
    const validFiles = acceptedFiles.filter((file) =>
      ["image/png", "image/jpeg", "image/jpg", "application/pdf"].includes(file.type)
    );

    if (validFiles.length !== acceptedFiles.length) {
      alert("Some files were rejected. Only PNG, JPG, JPEG, and PDF are allowed.");
    }

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);

    const newPreviews = validFiles.map((file) => ({
      isLoading: true,
      url: null,
      type: file.type,
      name: file.name,
      file,
    }));
    setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews((prevPreviews) => {
          const updatedPreviews = [...prevPreviews];
          updatedPreviews[prevPreviews.length - validFiles.length + index] = {
            isLoading: false,
            url: reader.result,
            type: file.type,
            name: file.name,
            file,
          };
          return updatedPreviews;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={{ height: '100vh' }}>
      <Header />
      <div style={{ borderTop: "2px solid #0D9ECA", width: "100%" }} />
      <Notification message={notification.message} type={notification.type} />
      <div style={{
        alignContent: "center", justifyItems: "center", backgroundColor: "#F2FAFF", padding: "20px", minHeight: '74.6vh'
      }}>
        <div style={{

          maxWidth: isLoaded ? "1200px" : "800px",
          width: "100%",
          minHeight: "35vh",
          maxHeight: "auto",
          padding: "5vw",
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}>
          {!isLoaded ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              upload();
            }}>
              <h1 style={{ textAlign: "center", color: "#333" }}>Select Images or PDF</h1>
              <DropzoneUploader onDrop={onDrop} fileRequired={fileRequired} />
              {previews.length > 0 && (
                <FilePreviewList previews={previews} onRemove={handleRemoveImage} />
              )}
              <UploadButton isLoading={isLoading} />
            </form>
          ) : (
            <OCRResultViewer data={Data} />
          )}
        </div>
      </div>
      <div style={{ borderTop: "2px solid #0D9ECA", width: "100%" }} />
      <Footer />
    </div>
  );
}

export default App;