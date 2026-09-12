import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Target,
  Upload,
  Zap,
} from "lucide-react";
import React from "react";

const BulkQuestionUploadAdmin = ({
  fileData,
  handleExcelUpload,
  downloadTemplate,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-50 px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Bulk Exam Management</h3>
            <p className="text-sm text-gray-600">
              Upload Excel files to add multiple questions at once
            </p>
          </div>
        </div>
      </div>
      <form className="px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-gray-900">
                Step 1: Get Template
              </span>
            </div>
            <button
              onClick={downloadTemplate}
              type="button"
              className="w-full group bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-300 rounded-xl p-3 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3">
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
                fileData
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    fileData ? "bg-indigo-500" : "bg-gray-400"
                  }`}
                >
                  {fileData ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="text-center">
                  {fileData ? (
                    <>
                      <p className="font-semibold text-indigo-700">
                        {fileData.name}
                      </p>
                      <p className="text-sm text-indigo-600">
                        File ready to upload
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-700">
                        Drop your file here
                      </p>
                      <p className="text-sm text-gray-500">
                        Excel files (.xlsx, .xls, .csv)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BulkQuestionUploadAdmin;
