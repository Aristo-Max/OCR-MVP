import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UploadPage() {
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setPreviews(selectedFiles.map(file => URL.createObjectURL(file)));
  };

  const handleUpload = () => {
    // For frontend-only, simulate result data and navigate
    const dummyResults = files.map((file, index) => ({
      name: file.name,
      result: `Result text for ${file.name}`
    }));

    navigate('/result', { state: { results: dummyResults } });
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h3>Select Images</h3>
      <input type="file" accept="image/*" multiple onChange={handleFileChange} />
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px', gap: '10px' }}>
        {previews.map((src, idx) => (
          <img key={idx} src={src} alt={`preview-${idx}`} style={{ width: '100px', height: '100px', objectFit: 'cover', border: '1px solid #ccc' }} />
        ))}
      </div>
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#0D9ECA',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Process and Show Results
        </button>
      )}
    </div>
  );
}

export default UploadPage;
