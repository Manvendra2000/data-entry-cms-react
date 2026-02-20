import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper to convert plain text to Strapi Blocks JSON
const textToBlocks = (text) => {
  if (!text || text.trim() === '') return null;
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  return paragraphs.map(para => ({
    type: 'paragraph',
    children: [{ type: 'text', text: para.trim() }]
  }));
};

const AddShloka = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('strapiJWT');
  const baseUrl = localStorage.getItem('strapiBaseUrl');

  // --- UI State ---
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- Dropdown Data State ---
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [chapters, setChapters] = useState([]);

  // --- Form Data State ---
  const [metadata, setMetadata] = useState({ book: '', chapter: '', author: '', locale: 'sa', addBhashya: false, addTika: false });
  const [coreText, setCoreText] = useState({ verseNumber: '', transliteration: '', text: '', translation: '' });
  
  // Dynamic Arrays
  const [commentaries, setCommentaries] = useState([]);
  const [extraVars, setExtraVars] = useState([]);

  // 1. Fetch Dropdown Data on Load
// 1. Fetch Dropdown Data on Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Added pagination limits exactly like your HTML file
        const [booksRes, authorsRes, chaptersRes] = await Promise.all([
          axios.get(`${baseUrl}/api/books?pagination[limit]=100`, config),
          axios.get(`${baseUrl}/api/authors?pagination[limit]=100`, config),
          axios.get(`${baseUrl}/api/chapters?pagination[limit]=100`, config)
        ]);
        setBooks(booksRes.data.data);
        setAuthors(authorsRes.data.data);
        setChapters(chaptersRes.data.data);
      } catch (error) {
        console.error("Failed to load metadata dropdowns", error);
      }
    };
    fetchData();
  }, [baseUrl, token]);

  // 2. Dynamic Field Handlers
  const addCommentary = () => {
    setCommentaries([...commentaries, { Text: '', translation: '', tika: [] }]);
  };

  const addTika = (bhashyaIndex) => {
    const newComms = [...commentaries];
    newComms[bhashyaIndex].tika.push({ text: '', translation: '' });
    setCommentaries(newComms);
  };

  const addExtraVar = (type) => {
    setExtraVars([...extraVars, { type: type, Label: '', Value: '' }]);
  };

  // 3. Step 1 to Step 2 Transition
  const handleNextStep = () => {
    if (!metadata.chapter || !metadata.author) {
      alert("Please select a Chapter and an Author to continue.");
      return;
    }
    if (metadata.addBhashya && commentaries.length === 0) addCommentary();
    setStep(2);
  };

  // 4. Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Build Payload with exact API IDs mapping
      const payload = {
        data: {
          locale: metadata.locale,
          chapter: parseInt(metadata.chapter),
          Verse_Number: parseInt(coreText.verseNumber),
          Transliteration: coreText.transliteration || null,
          Text: textToBlocks(coreText.text),
          Translation: textToBlocks(coreText.translation),
        }
      };

      // Handle Commentry mapping
      if (metadata.addBhashya && commentaries.length > 0) {
        payload.data.Commentry = commentaries.map(c => {
          const bhashyaObj = {
            Text: textToBlocks(c.Text),
            translation: textToBlocks(c.translation),
            author: parseInt(metadata.author)
          };
          if (metadata.addTika && c.tika.length > 0) {
            bhashyaObj.tika = c.tika.map(t => ({
              text: textToBlocks(t.text),
              translation: textToBlocks(t.translation),
              author: parseInt(metadata.author)
            }));
          }
          return bhashyaObj;
        });
      }

      // Handle Dynamic Zone mapping
      if (extraVars.length > 0) {
        payload.data.extra_variables = extraVars.map(v => ({
          __component: `variables.${v.type}`,
          Label: v.Label,
          Value: v.type === 'numeric-variable' ? parseFloat(v.Value) : v.Value
        }));
      }

      await axios.post(`${baseUrl}/api/shlokas`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: `✓ Verse ${coreText.verseNumber} saved successfully!` });
      
      // Auto-increment and clear text for the next entry
      setCoreText(prev => ({ ...prev, verseNumber: parseInt(prev.verseNumber) + 1, text: '', translation: '' }));
      setCommentaries(metadata.addBhashya ? [{ Text: '', translation: '', tika: [] }] : []);
      
    } catch (error) {
      setMessage({ type: 'error', text: `✗ Error: ${error.response?.data?.error?.message || error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Shloka</h2>
          <button onClick={() => navigate('/dashboard')} className="text-orange-600 font-medium">← Dashboard</button>
        </div>

        {/* --- STEP 1: METADATA --- */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Step 1: Core Configuration</h3>
            
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Language (Locale) *</label>
                <select value={metadata.locale} onChange={e => setMetadata({...metadata, locale: e.target.value})} className="w-full p-2 border rounded">
                  <option value="sa">Sanskrit (sa)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>

              {/* Added Book Dropdown Back */}
              <div>
                <label className="block text-sm font-medium mb-1">Book *</label>
                <select value={metadata.book} onChange={e => setMetadata({...metadata, book: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">Select Book...</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.Title || b.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Chapter / Section *</label>
                <select value={metadata.chapter} onChange={e => setMetadata({...metadata, chapter: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">Select Chapter...</option>
                  {chapters.map(c => <option key={c.id} value={c.id}>{c.title || `Chapter ${c.number}`}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Default Commentator (Author) *</label>
                <select value={metadata.author} onChange={e => setMetadata({...metadata, author: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">Select Author...</option>
                  {/* Fixed casing to match Strapi author.name */}
                  {authors.map(a => <option key={a.id} value={a.id}>{a.name || a.Name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-6 py-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={metadata.addBhashya} onChange={e => setMetadata({...metadata, addBhashya: e.target.checked})} className="w-5 h-5 text-orange-600" />
                <span>Enable Bhashya (Commentary)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={metadata.addTika} onChange={e => setMetadata({...metadata, addTika: e.target.checked})} disabled={!metadata.addBhashya} className="w-5 h-5 text-orange-600" />
                <span className={!metadata.addBhashya ? "text-gray-400" : ""}>Enable Tika (Sub-commentary)</span>
              </label>
            </div>

            <button onClick={handleNextStep} className="w-full bg-orange-600 text-white py-2 rounded font-bold hover:bg-orange-700">Next: Enter Content →</button>
          </div>
        )}

        {/* --- STEP 2: CONTENT ENTRY --- */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-700">Step 2: Enter Shloka Data</h3>
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-orange-600">Edit Metadata</button>
            </div>

            {/* Core Text Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Verse Number *</label>
                <input type="number" required value={coreText.verseNumber} onChange={e => setCoreText({...coreText, verseNumber: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g., 1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transliteration</label>
                <input type="text" value={coreText.transliteration} onChange={e => setCoreText({...coreText, transliteration: e.target.value})} className="w-full p-2 border rounded" placeholder="dharma-kshetre..." />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Main Text * (Blocks)</label>
                <textarea required rows="3" value={coreText.text} onChange={e => setCoreText({...coreText, text: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" placeholder="Sanskrit or translated text here..." />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Translation (Blocks)</label>
                <textarea rows="3" value={coreText.translation} onChange={e => setCoreText({...coreText, translation: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" placeholder="Translation here..." />
              </div>
            </div>

            {/* Bhashya Section */}
            {metadata.addBhashya && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h4 className="font-bold text-orange-800 mb-4">Bhashya Entries</h4>
                {commentaries.map((c, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-white border rounded shadow-sm">
                    <label className="block text-sm font-medium mb-1">Bhashya Text (Blocks)</label>
                    <textarea value={c.Text} onChange={e => {
                      const newComms = [...commentaries]; newComms[idx].Text = e.target.value; setCommentaries(newComms);
                    }} className="w-full p-2 border rounded mb-2 font-mono text-sm" rows="2" />
                    
                    {/* Nested Tika Section */}
                    {metadata.addTika && (
                      <div className="ml-6 mt-4 border-l-2 border-orange-300 pl-4">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold text-gray-600 text-sm">Tika (Sub-commentaries)</h5>
                          <button type="button" onClick={() => addTika(idx)} className="text-xs text-orange-600">+ Add Tika</button>
                        </div>
                        {c.tika.map((t, tIdx) => (
                          <div key={tIdx} className="mb-2">
                            <textarea placeholder="Tika Text..." value={t.text} onChange={e => {
                              const newComms = [...commentaries]; newComms[idx].tika[tIdx].text = e.target.value; setCommentaries(newComms);
                            }} className="w-full p-2 border rounded font-mono text-xs" rows="1" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addCommentary} className="text-sm font-medium text-orange-600 hover:underline">+ Add Another Bhashya</button>
              </div>
            )}

            {/* Dynamic Zone: Extra Variables */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Extra Variables (Optional)</h3>
              
              {extraVars.map((v, idx) => (
                <div key={idx} className="flex gap-4 items-start mb-4 p-4 bg-gray-50 border rounded">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Variable Name (Label)</label>
                    <input type="text" value={v.Label} onChange={e => {
                      const newVars = [...extraVars]; newVars[idx].Label = e.target.value; setExtraVars(newVars);
                    }} className="w-full p-2 border rounded" placeholder="e.g., footnote" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Value ({v.type})</label>
                    <input type={v.type === 'numeric-variable' ? 'number' : 'text'} value={v.Value} onChange={e => {
                      const newVars = [...extraVars]; newVars[idx].Value = e.target.value; setExtraVars(newVars);
                    }} className="w-full p-2 border rounded" />
                  </div>
                  <button type="button" onClick={() => setExtraVars(extraVars.filter((_, i) => i !== idx))} className="mt-6 text-red-600 text-sm">Remove</button>
                </div>
              ))}

              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => addExtraVar('text-variable')} className="text-orange-600 text-sm font-medium">+ Add Text Variable</button>
                <button type="button" onClick={() => addExtraVar('numeric-variable')} className="text-orange-600 text-sm font-medium">+ Add Numeric Variable</button>
              </div>
            </div>

            {/* Messages & Submit */}
            {message.text && (
              <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
              {isLoading ? 'Saving...' : 'Save Shloka Entry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddShloka;