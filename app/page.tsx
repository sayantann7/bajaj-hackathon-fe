'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient, type Document, type QueryResult, type Stats } from '../lib/api';

const API_BASE_URL = 'http://209.38.122.127:3000';

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Check server health
  useEffect(() => {
    checkServerHealth();
    loadDocuments();
    loadStats();
  }, []);

  const checkServerHealth = async () => {
    try {
      await apiClient.checkHealth();
      setServerStatus('online');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await apiClient.getDocuments();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiClient.getStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Document processed successfully! ${data.chunksProcessed} chunks created.`);
        setSelectedFile(null);
        loadDocuments();
        loadStats();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExisting = async () => {
    if (!fileName.trim()) {
      setMessage('Please enter a file name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: fileName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Document processed successfully! ${data.chunksProcessed} chunks created.`);
        setFileName('');
        loadDocuments();
        loadStats();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setMessage('Please enter a query');
      return;
    }

    setLoading(true);
    setMessage('');
    setQueryResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          documentName: selectedDocument || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQueryResult(data);
        setMessage('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}" and all its data?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${encodeURIComponent(docName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Document "${docName}" deleted successfully!`);
        loadDocuments();
        loadStats();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 text-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bajaj Hackathon - Document Processing
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Server Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  serverStatus === 'online' ? 'bg-green-100 text-green-800' :
                  serverStatus === 'offline' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {serverStatus === 'online' ? '🟢 Online' :
                   serverStatus === 'offline' ? '🔴 Offline' :
                   '🟡 Checking...'}
                </span>
              </div>
            </div>
            {/* <Link 
              href="/advanced" 
              className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Advanced Features →
            </Link> */}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalChunks}</div>
                <div className="text-sm text-gray-600">Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.averageChunkSize}</div>
                <div className="text-sm text-gray-600">Avg Chunk Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.documentsWithExamples}</div>
                <div className="text-sm text-gray-600">With Examples</div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Document Management */}
          <div className="space-y-6">
            {/* Upload File */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Upload PDF Document</h2>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={handleFileUpload}
                  disabled={loading || !selectedFile}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Upload & Process'}
                </button>
              </div>
            </div>

            {/* Process Existing */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Process Existing File</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter filename (e.g., bajaj-2.pdf)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleProcessExisting}
                  disabled={loading || !fileName.trim()}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Process File'}
                </button>
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Processed Documents</h2>
              {documents.length === 0 ? (
                <p className="text-gray-500">No documents processed yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-gray-600">
                          {doc.chunk_count} chunks • {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.name)}
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Query Interface */}
          <div className="space-y-6">
            {/* Query Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Query Documents</h2>
              <div className="space-y-4">
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Documents</option>
                  {documents.map((doc, index) => (
                    <option key={index} value={doc.name}>
                      {doc.name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your question here..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Querying...' : 'Ask Question'}
                </button>
              </div>
            </div>

            {/* Query Result */}
            {queryResult && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Answer</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900 mb-2">Response:</div>
                    <div className="text-blue-800">{queryResult.answer}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Confidence: {(queryResult.confidence * 100).toFixed(1)}%</span>
                    <span>Sources: {queryResult.sources.length}</span>
                  </div>
                  {queryResult.sources.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Sources:</div>
                      <div className="space-y-2">
                        {queryResult.sources.map((source, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                            <div className="font-medium">{source.document_name}</div>
                            <div className="text-gray-600">{source.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={loadDocuments}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              disabled={loading}
            >
              Refresh Documents
            </button>
            <button
              onClick={loadStats}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              disabled={loading}
            >
              Refresh Stats
            </button>
            <button
              onClick={checkServerHealth}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              disabled={loading}
            >
              Check Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
