'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onUploadSuccess: () => void
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [clearExisting, setClearExisting] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setMessage(null)
      } else {
        setMessage({ type: 'error', text: 'Please select a valid CSV file' })
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clearExisting', clearExisting.toString())

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'File uploaded successfully!',
        })
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onUploadSuccess()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to upload file',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Upload Bank Statement
        </h2>
        <p className="text-gray-600 mb-4">
          Upload your bank statement in CSV format. The system will automatically
          categorize transactions and make them available for analysis.
        </p>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Expected CSV Format:</h3>
          <p className="text-sm text-gray-600 mb-2">
            Your CSV should contain columns like:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li><strong>Date</strong> or <strong>Transaction Date</strong></li>
            <li><strong>Description</strong> or <strong>Merchant</strong></li>
            <li><strong>Amount</strong> (negative for expenses, positive for income)</li>
            <li>Optional: <strong>Account</strong>, <strong>Category</strong></li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mb-4"
          >
            <Upload className="mr-2" size={20} />
            Select CSV File
          </label>
          
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {file && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Selected: {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Size: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-6">
            <label className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="rounded"
              />
              <span>Clear existing transactions before upload</span>
            </label>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={20} />
                  Upload and Process
                </>
              )}
            </button>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-start ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="mr-2 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={20} />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}
