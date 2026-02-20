import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditList = () => {
  const [shlokas, setShlokas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();

  // 1. Fetch Data on Component Mount
  useEffect(() => {
    const fetchShlokas = async () => {
      const token = localStorage.getItem('strapiJWT');
      const baseUrl = localStorage.getItem('strapiBaseUrl');

      try {
        // Fetch shlokas and populate the chapter relation so we can show it in the list
        const response = await axios.get(`${baseUrl}/api/shlokas?populate=chapter`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Strapi returns the array of items inside response.data.data
        setShlokas(response.data.data);
      } catch (err) {
        console.error('Error fetching shlokas:', err);
        setError('Failed to load data. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShlokas();
  }, []);

  // 2. Search Logic (Filter locally for speed)
  const filteredShlokas = shlokas.filter(shloka => {
    const searchLower = searchTerm.toLowerCase();
    const trans = shloka.Transliteration?.toLowerCase() || '';
    const verseNum = shloka.Verse_Number?.toString() || '';
    
    return trans.includes(searchLower) || verseNum.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
        
        {/* Header & Controls */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Modify Existing Shlokas</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-orange-600 hover:text-orange-800 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search by Verse Number or Transliteration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Loading / Error States */}
        {isLoading && <div className="text-center py-8 text-gray-500">Loading library...</div>}
        {error && <div className="text-center py-8 text-red-600">{error}</div>}

        {/* Data Table */}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  <th className="p-4 font-semibold text-gray-700">Verse #</th>
                  <th className="p-4 font-semibold text-gray-700">Transliteration Preview</th>
                  <th className="p-4 font-semibold text-gray-700">Chapter</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShlokas.map((shloka) => (
                  <tr key={shloka.documentId} className="border-b hover:bg-orange-50 transition-colors">
                    <td className="p-4 font-medium">{shloka.Verse_Number || '-'}</td>
                    <td className="p-4 text-gray-600 truncate max-w-md">
                      {shloka.Transliteration || 'No transliteration available'}
                    </td>
                    <td className="p-4 text-gray-600">
                      {shloka.chapter?.title || `Ch ${shloka.chapter?.number || '?'}`}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        // We will pass the unique documentId to the edit form route
                        onClick={() => navigate(`/edit-shloka/${shloka.documentId}`)}
                        className="bg-orange-100 text-orange-700 px-4 py-2 rounded hover:bg-orange-200 font-medium transition-colors"
                      >
                        Edit Entry
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredShlokas.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      No shlokas found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditList;