'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:3000';

interface Document {
  name: string;
  created_at: string;
  chunk_count: number;
}

interface SearchResult {
  content: string;
  document_name: string;
  chunk_index: number;
  similarity: number;
}

export default function AdvancedPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [fewShotExamples, setFewShotExamples] = useState('');
  const [selectedDocForExamples, setSelectedDocForExamples] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage('Please enter a search query');
      return;
    }

    setLoading(true);
    setMessage('');
    setSearchResults([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          documentName: selectedDocument || undefined,
          limit: 10,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.results || []);
        if (data.results.length === 0) {
          setMessage('No similar chunks found');
        }
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExamples = async () => {
    if (!selectedDocForExamples) {
      setMessage('Please select a document');
      return;
    }

    setLoading(true);
    setMessage('');
    setFewShotExamples('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${encodeURIComponent(selectedDocForExamples)}/examples`);
      const data = await response.json();

      if (response.ok) {
        setFewShotExamples(data.fewShotExamples || 'No examples found');
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Advanced Features</h1>
            <Link 
              href="/" 
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              ← Back to Main
            </Link>
          </div>
          <p className="text-gray-600 mt-2">Search documents and view few-shot examples</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Semantic Search */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Semantic Search</h2>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search terms to find similar content..."
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Similar Content'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Search Results ({searchResults.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{result.document_name}</span>
                        <span className="text-xs text-gray-500">
                          Similarity: {(result.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {result.content.length > 200 
                          ? result.content.substring(0, 200) + '...' 
                          : result.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Chunk #{result.chunk_index}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Few-shot Examples */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Few-shot Examples</h2>
            <div className="space-y-4">
              <select
                value={selectedDocForExamples}
                onChange={(e) => setSelectedDocForExamples(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a document</option>
                {documents.map((doc, index) => (
                  <option key={index} value={doc.name}>
                    {doc.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLoadExamples}
                disabled={loading || !selectedDocForExamples}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load Examples'}
              </button>
            </div>

            {/* Examples Display */}
            {fewShotExamples && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Generated Examples</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap text-gray-700">
                    {fewShotExamples}
                  </pre>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  These examples are automatically generated from the document content and cached for future use.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Testing Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Endpoints Testing</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Health Check</h3>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE_URL}/health`);
                    const data = await response.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (error) {
                    alert(`Error: ${error}`);
                  }
                }}
                className="text-sm bg-gray-600 text-white py-1 px-3 rounded hover:bg-gray-700"
              >
                Test /health
              </button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Statistics</h3>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE_URL}/api/stats`);
                    const data = await response.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (error) {
                    alert(`Error: ${error}`);
                  }
                }}
                className="text-sm bg-gray-600 text-white py-1 px-3 rounded hover:bg-gray-700"
              >
                Test /api/stats
              </button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Documents List</h3>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE_URL}/api/documents`);
                    const data = await response.json();
                    alert(JSON.stringify(data, null, 2));
                  } catch (error) {
                    alert(`Error: ${error}`);
                  }
                }}
                className="text-sm bg-gray-600 text-white py-1 px-3 rounded hover:bg-gray-700"
              >
                Test /api/documents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
