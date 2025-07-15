import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import Header from "./components/Header";
import Footer from "./components/Footer";
import axios from "axios";
import { saveAs } from 'file-saver';
import { ClipLoader } from 'react-spinners';

function App() {
  const [files, setFiles] = useState(() => {
    const savedFiles = localStorage.getItem("files");
    return savedFiles ? JSON.parse(savedFiles) : [];
  });
  const [previews, setPreviews] = useState([]);
  const [Data, setData] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    localStorage.setItem("files", JSON.stringify(files));
  }, [files]);

  const showNotification = (message, type) => {
    console.log("Showing notification:", message, type);
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 3000);
  };

  const handleFileChange = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setPreviews((prevPreviews) => [
      ...prevPreviews,
      ...newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
        isLoading: false,
        type: file.type,
        name: file.name,
      })),
    ]);
  };

  const handleRemoveImage = (indexToRemove) => {
    const fileToRemove = previews[indexToRemove].file;
    setPreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== indexToRemove));
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  // const uploadImages = async () => {
  //   setIsLoading(true);
  //   const formData = new FormData();
  //   files.forEach((file) => {
  //     formData.append("images", file);
  //   });

  //   try {
  //     const response = await axios.post("http://img2des.ap-south-1.elasticbeanstalk.com/api/upload", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     if (response.data.success) {
  //       showNotification("Images uploaded successfully!", "success");
  //       setIsLoaded(true);
  //     } else {
  //       showNotification("Server Down!!", "error");
  //     }
  //   } catch (error) {
  //     console.error("Error uploading images:", error.response ? error.response.data : error.message);
  //     showNotification("Something went wrong with the server!", "error");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const uploadPDF = async () => {
  //   setIsLoading(true);
  //   const formData = new FormData();
  //   files.forEach((file) => {
  //     formData.append("pdfs", file);
  //   });

  //   try {
  //     const response = await axios.post("", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     if (response.data.success) {
  //       showNotification("PDF uploaded successfully!", "success");
  //       setIsLoaded(true);
  //     } else {
  //       showNotification("Server Down!!", "error");
  //     }
  //   } catch (error) {
  //     console.error("Error uploading PDF:", error.response ? error.response.data : error.message);
  //     showNotification("Something went wrong with the server!", "error");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const uploadImages = async () => {
    setIsLoading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await axios.post("http://img2des.ap-south-1.elasticbeanstalk.com/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        showNotification("Images uploaded successfully!", "success");
        await loadCsv();
      } else {
        showNotification("Server Down!!", "error");
      }
    } catch (error) {
      console.error("Error uploading images:", error.response ? error.response.data : error.message);
      showNotification("Something went wrong with the server!", "error");
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
          };
          return updatedPreviews;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div>
      <Header />
      <div style={{
        borderTop: "2px solid #0D9ECA",
        width: "100%",
        marginTop: "0",
      }} />
      {notification.message && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "400px",
            width: "90%",
            padding: "10px",
            backgroundColor: notification.type === "success" ? '#0D9ECA' : "#dc3545",
            color: "white",
            textAlign: "center",
            borderRadius: "5px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
          }}
        >
          {notification.message}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "75vh",
          fontFamily: "'Roboto', sans-serif",
          backgroundColor: "#F2FAFF",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: isLoaded ? "1200px" : "800px",
            transition: "width 0.3s ease",
            padding: "30px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            backgroundColor: "#fff",
          }}
        >
          {!isLoaded ? (
            <>
              <h1 style={{ textAlign: "center", color: "#333" }}>Select Images or PDF</h1>
              {/* <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (files.some(file => file.type === "application/pdf")) {
                    uploadPDF();
                  } else {
                    uploadImages();
                  }
                }}
              > */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  uploadImages();
                }}
              >
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
                  <input {...getInputProps()} onChange={(e) => handleFileChange(e.target.files)} />
                  {isDragActive ? (
                    <p style={{ color: "#0D9ECA" }}>Drop the files here...</p>
                  ) : (
                    <p style={{ color: "#555" }}>
                      Select Images or PDF OR Drag & Drop here...
                    </p>
                  )}
                </div>
                {previews.length > 0 && (
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      marginTop: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "15px",
                        justifyContent: "center",
                      }}
                    >
                      {previews.map((preview, index) => (
                        <div
                          key={index}
                          style={{
                            position: "relative",
                            width: "90px",
                            height: "100px", 
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {preview.isLoading ? (
                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                border: "4px solid #ccc",
                                borderTop: "4px solid #0D9ECA",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                              }}
                            ></div>
                          ) : preview.type.startsWith("image/") ? (
                            <img
                              src={preview.url}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "90px",
                                objectFit: "cover",
                              }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <>
                              <img
                                src="/pdfimg.png" // Ensure this pdf image exists in the public folder
                                alt="PDF Preview"
                                style={{
                                  width: "100%",
                                  height: "70%",
                                  objectFit: "contain",
                                }}
                                onError={(e) => { e.target.src = '/default-placeholder.png'; }} // Fallback image if pdf-icon.png fails
                              />
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#333",
                                  textAlign: "center",
                                  marginTop: "5px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "80px",
                                  marginleft: "5px",
                                }}
                              >
                                {preview.name}
                              </p>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              position: "absolute",
                              top: "-10px",
                              right: "-10px",
                              background: "#ffffff",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              color: "#000000",
                              fontSize: "20px",
                              width: "25px",
                              height: "25px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              </form>
            </>
          ) : (
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
                <textarea
                  value={Data ? Data.map(row => Object.values(row).join("\n")).join("\n\n") : ""}
                  readOnly
                  style={{
                    width: "97%",
                    minHeight: "200px",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    resize: "vertical",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{
        borderTop: "2px solid #0D9ECA",
        width: "100%",
        marginTop: "0",
      }} />
      <Footer />
    </div>
  );
}

export default App;
