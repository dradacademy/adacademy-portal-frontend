import { AlertTriangle, ArrowLeft } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

const ExamNotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Exam Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The exam you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Link
            to="/activities"
            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>
        </div>
      </div>
  )
}

export default ExamNotFound