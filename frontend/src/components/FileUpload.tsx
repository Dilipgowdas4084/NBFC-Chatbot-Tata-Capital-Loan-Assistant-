import React, { useState } from 'react';
import { uploadFile } from '../services/api';

interface Props {
    onUploadComplete: () => void;
}

const FileUpload: React.FC<Props> = ({ onUploadComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            await uploadFile(file);
            onUploadComplete();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 border border-dashed border-gray-400 rounded-lg bg-gray-50 my-2">
            <p className="mb-2 text-sm text-gray-600">Please upload your salary slip (PDF/Image)</p>
            <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
            />
            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`mt-3 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 
                    ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {uploading ? 'Uploading...' : 'Upload & Proceed'}
            </button>
        </div>
    );
};

export default FileUpload;
