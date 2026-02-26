import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditList = () => {
  const [shlokas, setShlokas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();


// --- Inside EditList.js ---
useEffect(() => {
  let isMounted = true; // Use a flag to prevent state updates if unmounted

  const fetchEntries = async () => {
    const token = localStorage.getItem('strapiJWT');
    const baseUrl = localStorage.getItem('strapiBaseUrl') || "http://localhost:1337";

    try {
      const response = await axios.get(`${baseUrl}/api/entries?populate=book`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (isMounted) {
        console.log("Raw Strapi Response:", response.data.data);
        setShlokas(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching shlokas:', err);
      if (isMounted) setError('Failed to load data.');
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  fetchEntries();
  return () => { isMounted = false; }; // Cleanup function
}, []); // Empty array ensures it only runs ONCE on mount

  // 2. The "Flattening" Engine
// 1. Defensively flatten the data
 // --- Inside EditList.js ---
const allShlokasFlattened = shlokas.flatMap(entry => {
    // 1. Capture the correct identifier
    const entryIdentifier = entry.documentId || entry.id; 
    
    const attrs = entry.attributes || entry;
    const shlokaList = attrs.teekas || []; 
    const bookTitle = attrs.book?.data?.attributes?.title || "Untitled Book";

    return shlokaList.map((shloka, index) => ({
      ...shloka,
      entryId: entryIdentifier, // Use the documentId here
      shlokaIndex: index,
      bookTitle
    }));
  });

  // 2. Updated Filter logic to use the safe bookTitle
  const filteredData = allShlokasFlattened.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const sourceText = (item.sourceText || '').toLowerCase();
    const hierarchy = (item.hierarchyValues || []).join('.');
    const bookName = item.bookTitle.toLowerCase();
    
    return sourceText.includes(searchLower) || 
           hierarchy.includes(searchLower) || 
           bookName.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-slate-800">Scripture Library</h2>
          <button onClick={() => navigate('/dashboard')} className="text-indigo-600 font-bold hover:underline">
            ← Dashboard
          </button>
        </div>

        <input 
          type="text" 
          placeholder="Search verses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-8 outline-none focus:border-indigo-500"
        />

        {isLoading ? (
          <div className="text-center py-20 text-slate-400 font-bold italic">Loading divine verses...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl font-bold">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-5 text-[10px] uppercase font-black text-slate-400">Book</th>
                  <th className="p-5 text-[10px] uppercase font-black text-slate-400">Hierarchy</th>
                  <th className="p-5 text-[10px] uppercase font-black text-slate-400">Source Text</th>
                  <th className="p-5 text-right text-[10px] uppercase font-black text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((item, idx) => (
                  <tr key={`${item.entryId}-${idx}`} className="hover:bg-indigo-50/30 group">
                    <td className="p-5 font-bold text-indigo-900 text-xs uppercase">{item.bookTitle}</td>
                    <td className="p-5">
                      <span className="px-2 py-1 bg-white border rounded text-xs font-mono font-bold text-slate-500">
                        {item.hierarchyValues?.join('.') || '1.1.1.1'}
                      </span>
                    </td>
                    <td className="p-5 truncate max-w-xs font-serif italic text-slate-600">
                      {item.sourceText || 'No text'}
                    </td>
                    <td className="p-5 text-right">
                      {/* <button 
                        onClick={() => navigate(`/edit-shloka/${item.documentId}/${item.shlokaIndex}`)}
                        className="..."
                      >
                        Edit
                      </button> */}
                      <button 
  onClick={() => navigate(`/edit-shloka/${item.entryId}/${item.shlokaIndex}`)}
  className="..."
>
  Edit
</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditList;