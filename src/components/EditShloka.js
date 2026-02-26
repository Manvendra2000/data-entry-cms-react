import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditShloka = () => {
  const { entryId, shlokaIndex } = useParams();
  const navigate = useNavigate();
  const [shlokaData, setShlokaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Guard against undefined IDs
      if (!entryId || entryId === 'undefined') return;

      const token = localStorage.getItem('strapiJWT');
      const baseUrl = localStorage.getItem('strapiBaseUrl') || "http://localhost:1337";

      try {
        const res = await axios.get(`${baseUrl}/api/entries/${entryId}?populate=book`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const entry = res.data.data;
        // Defensive check for attributes wrapper
        const attrs = entry.attributes || entry;
        const allShlokas = attrs.teekas || [];
        
        console.log("Entry data:", entry); // Debug log
        console.log("All shlokas:", allShlokas); // Debug log
        console.log("Shloka index:", shlokaIndex); // Debug log
        
        if (allShlokas[shlokaIndex]) {
          setShlokaData(allShlokas[shlokaIndex]);
        } else {
          console.error("Shloka not found at index:", shlokaIndex);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [entryId, shlokaIndex]);

  if (isLoading) return <div className="p-20 font-mono text-slate-400">Fetching Data...</div>;
  if (!shlokaData) return <div className="p-20 text-red-500 font-bold">Error: Shloka not found at index {shlokaIndex}</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-10 font-mono">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-xl font-black text-slate-800">RAW DATA DUMP</h2>
          <button onClick={() => navigate('/edit-list')} className="text-indigo-600 font-bold">← BACK TO LIST</button>
        </div>

        <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px'}}>
          {JSON.stringify(shlokaData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default EditShloka;