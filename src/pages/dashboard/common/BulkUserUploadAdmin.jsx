import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Target,
  Upload,
  Zap,
} from "lucide-react";

const BulkUserUploadAdmin = () => {
  const [file, setFile] = useState(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.includes("sheet")) {
      setFile(droppedFile);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/users/download-template`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type:
          res.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "UserTemplate.xlsx");
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download template");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await handleSubmit(e);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_API_URL}/users/register/bulk-upload`,
        formData,
        { withCredentials: true }
      );
      toast.success(res.data.message);
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-50 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Bulk User Management</h3>
            <p className="text-sm text-gray-600">
              Upload Excel files to add multiple users at once
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={handleFormSubmit} className="px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-gray-900">
                Step 1: Get Template
              </span>
            </div>
            <button
              onClick={handleDownloadTemplate}
              type="button"
              className="w-full group bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-300 rounded-xl p-3 transition-all duration-300 cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center transition-transform">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">
                    Download Excel Template
                  </p>
                  <p className="text-sm text-gray-600">
                    Get the formatted template file
                  </p>
                </div>
              </div>
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-indigo-500" />
              <span className="font-medium text-gray-900">
                Step 2: Upload File
              </span>
            </div>
            <div
              className={`relative border-2 border-dashed rounded-xl p-3 transition-all duration-300 ${
                isDragOver
                  ? "border-indigo-400 bg-indigo-50"
                  : file
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".xlsx,.xls,.csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    file ? "bg-indigo-500" : "bg-gray-400"
                  }`}
                >
                  {file ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="text-center">
                  {file ? (
                    <>
                      <p className="font-semibold text-indigo-700">
                        {file.name}
                      </p>
                      <p className="text-sm text-indigo-600">
                        File ready to upload
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-700">
                        {isDragOver
                          ? "Drop your file here"
                          : "Choose file or drag & drop"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Excel files (.xlsx, .xls, .csv)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="font-medium text-indigo-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={!file || isUploading}
              className={`w-full text-[15px] py-[10px] px-6 rounded-xl font-semibold transition-all duration-300 ${
                file && !isUploading
                  ? "bg-indigo-500 hover:bg-indigo-600 text-white hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Excel File</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BulkUserUploadAdmin;
