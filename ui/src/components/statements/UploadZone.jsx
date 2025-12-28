import React from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';

export default function UploadZone({ uploading, onUpload }) {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all group relative text-center">
      <input 
        type="file" 
        onChange={onUpload} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        disabled={uploading} 
        accept=".pdf" 
      />
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {uploading ? <Loader2 className="text-blue-600 animate-spin" size={32} /> : <CloudUpload className="text-blue-600" size={32} />}
        </div>
        <h2 className="text-xl font-bold text-gray-800">{uploading ? "Uploading..." : "Upload Bank Statement"}</h2>
        <p className="text-gray-500 mt-1">Select your PDF statement to begin processing</p>
      </div>
    </div>
  );
}