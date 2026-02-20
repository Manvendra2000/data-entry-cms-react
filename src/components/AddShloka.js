import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = "https://dev.ekatmdhamlibrary.xoidlabs.com";

// Helper to convert plain text to Strapi Blocks JSON
const textToBlocks = (text) => {
  if (!text || text.trim() === '') return null;
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  return paragraphs.map(para => ({
    type: 'paragraph',
    children: [{ type: 'text', text: para.trim() }]
  }));
};

// Common languages for dropdowns
const LANGUAGES = [
  { code: 'hindi', label: 'Hindi' },
  { code: 'sanskrit', label: 'Sanskrit' },
  { code: 'kannada', label: 'Kannada' },
  { code: 'telugu', label: 'Telugu' },
  { code: 'tamil', label: 'Tamil' },
  { code: 'marathi', label: 'Marathi' },
  { code: 'gujarati', label: 'Gujarati' },
  { code: 'bengali', label: 'Bengali' }
];

const AddShloka = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('strapiJWT');
  const baseUrl = localStorage.getItem('strapiBaseUrl');

  // --- UI State ---
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- Dropdown Data State ---
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [chapters, setChapters] = useState([]);

  // --- Form Data State ---
  const [metadata, setMetadata] = useState({ book: '', chapter: '', author: '', locale: 'sa', addBhashya: false, addTika: false });
  const [coreText, setCoreText] = useState({ verseNumber: '', transliteration: '', text: '', translation: '' }); // translation = English default
  const [otherTranslations, setOtherTranslations] = useState([]); // { language: '', text: '' }
  
  // Dynamic Arrays
  const [commentaries, setCommentaries] = useState([]); // { Text: '', translation: '', translations: [], tika: [] }
  const [extraVars, setExtraVars] = useState([]);

  // 1. Fetch Dropdown Data on Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
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
    if(baseUrl && token) fetchData();
  }, [baseUrl, token]);

  // --- AI API Integrations ---
 const handleAutoTransliterate = async () => {
    if (!coreText.text) return alert("Please enter Main Text first.");
    setIsProcessingAI(true);
    try {
      // Use just the path, drop the API_BASE_URL
      const res = await axios.post('/api/gemini/transliterate-text', {
        content: coreText.text,
        targetLanguage: 'english' 
      });
      setCoreText(prev => ({ ...prev, transliteration: res.data.transliterated }));
    } catch (err) {
      alert("Transliteration failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessingAI(false);
    }
  };
const handleAutoTranslate = async (index) => {
    const targetLang = otherTranslations[index].language;
    if (!coreText.translation) return alert("Please enter the English translation first.");
    if (!targetLang) return alert("Please select a target language.");
    
    setIsProcessingAI(true);
    try {
      // Use just the path, drop the API_BASE_URL
      const res = await axios.post('/api/gemini/translate-text', {
        content: coreText.translation,
        sourceLanguage: 'english',
        targetLanguage: targetLang
      });
      const newTranslations = [...otherTranslations];
      newTranslations[index].text = res.data.translated;
      setOtherTranslations(newTranslations);
    } catch (err) {
      alert("Translation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessingAI(false);
    }
  };
  // --- Dynamic Field Handlers ---
  const addOtherTranslation = () => {
    setOtherTranslations([...otherTranslations, { language: '', text: '' }]);
  };
  const removeOtherTranslation = (idx) => {
    setOtherTranslations(otherTranslations.filter((_, i) => i !== idx));
  };

  const addCommentary = () => {
    setCommentaries([...commentaries, { Text: '', translation: '', translations: [], tika: [] }]);
  };
  const removeCommentary = (idx) => {
    setCommentaries(commentaries.filter((_, i) => i !== idx));
  };

  const addBhashyaTranslation = (bIdx) => {
    const newComms = [...commentaries];
    if (!newComms[bIdx].translations) newComms[bIdx].translations = [];
    newComms[bIdx].translations.push({ language: '', authorName: '', text: '' });
    setCommentaries(newComms);
  };
  const removeBhashyaTranslation = (bIdx, trIdx) => {
    const newComms = [...commentaries];
    newComms[bIdx].translations = newComms[bIdx].translations.filter((_, i) => i !== trIdx);
    setCommentaries(newComms);
  };

  const addTika = (bhashyaIndex) => {
    const newComms = [...commentaries];
newComms[bhashyaIndex].tika.push({ text: '', translation: '', authorTitle: '' });
    setCommentaries(newComms);
  };
  const removeTika = (bIdx, tIdx) => {
    const newComms = [...commentaries];
    newComms[bIdx].tika = newComms[bIdx].tika.filter((_, i) => i !== tIdx);
    setCommentaries(newComms);
  };

  const addExtraVar = (type) => {
    setExtraVars([...extraVars, { type: type, Label: '', Value: '' }]);
  };

  // --- Step & Submit Logic ---
  const handleNextStep = () => {
    if (!metadata.chapter || !metadata.author) {
      alert("Please select a Chapter and an Author to continue.");
      return;
    }
    if (metadata.addBhashya && commentaries.length === 0) addCommentary();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // NOTE: You will need to adjust the payload structure for `otherTranslations` and Bhashya `translations`
      // based on how your Strapi schema is strictly defined. This matches the UI state.
      const payload = {
        data: {
          locale: metadata.locale,
          chapter: parseInt(metadata.chapter),
          Verse_Number: parseInt(coreText.verseNumber),
          Transliteration: coreText.transliteration || null,
          Text: textToBlocks(coreText.text),
          Translation: textToBlocks(coreText.translation), // Default English
          // OtherTranslations: mapping goes here based on Strapi schema
        }
      };

      if (metadata.addBhashya && commentaries.length > 0) {
        payload.data.Commentry = commentaries.map(c => {
          const bhashyaObj = {
            content: textToBlocks(c.Text), // Changed to match schema
            translation: textToBlocks(c.translation),
            author: parseInt(metadata.author),
          };
          
          if (metadata.addTika && c.tika.length > 0) {
            bhashyaObj.tika = c.tika.map(t => ({
              content: textToBlocks(t.text), // Changed to match schema
              
              translation: textToBlocks(t.translation),
              authorTitle: t.authorTitle,
              author: parseInt(metadata.author)
            }));
          }
          
          return bhashyaObj;
        });
      }

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
      
      // Reset
      setCoreText(prev => ({ ...prev, verseNumber: parseInt(prev.verseNumber) + 1, text: '', translation: '', transliteration: '' }));
      setOtherTranslations([]);
      setCommentaries(metadata.addBhashya ? [{ Text: '', translation: '', translations: [], tika: [] }] : []);
      
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
            <div className="grid grid-cols-2 gap-4 border-b pb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Verse Number *</label>
                <input type="number" required value={coreText.verseNumber} onChange={e => setCoreText({...coreText, verseNumber: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g., 1" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Main Text * (Blocks)</label>
                <textarea required rows="3" value={coreText.text} onChange={e => setCoreText({...coreText, text: e.target.value})} className="w-full p-2 border rounded font-mono text-sm mb-2" placeholder="Sanskrit or primary text here..." />
              </div>

              {/* Transliteration AI Block */}
              <div className="col-span-2 bg-gray-50 p-3 rounded border">
                 <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Transliteration</label>
                    <button type="button" onClick={handleAutoTransliterate} disabled={isProcessingAI} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">
                      {isProcessingAI ? 'Generating...' : '✨ Auto-Transliterate'}
                    </button>
                 </div>
                <input type="text" value={coreText.transliteration} onChange={e => setCoreText({...coreText, transliteration: e.target.value})} className="w-full p-2 border rounded" placeholder="Generated transliteration..." />
              </div>

              {/* Translation Block */}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">English Translation (Manual Entry) *</label>
                <textarea required rows="3" value={coreText.translation} onChange={e => setCoreText({...coreText, translation: e.target.value})} className="w-full p-2 border rounded font-mono text-sm" placeholder="Enter English translation here..." />
              </div>

              {/* Multi-Language Translations */}
              <div className="col-span-2 pl-4 border-l-2 border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-gray-600">Other Language Translations</h4>
                  <button type="button" onClick={addOtherTranslation} className="text-xs text-blue-600 font-medium">+ Add Language</button>
                </div>
                
                {otherTranslations.map((tr, idx) => (
                  <div key={idx} className="flex gap-2 items-start mb-2">
                    <select value={tr.language} onChange={e => {
                      const newTr = [...otherTranslations]; newTr[idx].language = e.target.value; setOtherTranslations(newTr);
                    }} className="w-1/4 p-2 border rounded text-sm">
                      <option value="">Select Language</option>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                    <textarea value={tr.text} onChange={e => {
                      const newTr = [...otherTranslations]; newTr[idx].text = e.target.value; setOtherTranslations(newTr);
                    }} className="flex-1 p-2 border rounded text-sm" rows="1" placeholder="Translation..." />
                    
                    <button type="button" onClick={() => handleAutoTranslate(idx)} disabled={isProcessingAI || !tr.language} className="bg-blue-50 text-blue-600 px-3 py-2 rounded border border-blue-100 text-sm whitespace-nowrap">
                      ✨ Translate
                    </button>
                    <button type="button" onClick={() => removeOtherTranslation(idx)} className="text-red-500 px-2 py-2 text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bhashya Section */}
            {metadata.addBhashya && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h4 className="font-bold text-orange-800 mb-4">Bhashya Entries</h4>
                {commentaries.map((c, idx) => (
                  <div key={idx} className="mb-6 p-4 bg-white border rounded shadow-sm relative">
                    <button type="button" onClick={() => removeCommentary(idx)} className="absolute top-2 right-2 text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Remove Bhashya</button>
                    
                    <label className="block text-sm font-medium mb-1">Original Bhashya Text (Blocks)</label>
                    <textarea value={c.Text} onChange={e => {
                      const newComms = [...commentaries]; newComms[idx].Text = e.target.value; setCommentaries(newComms);
                    }} className="w-full p-2 border rounded mb-4 font-mono text-sm" rows="2" />
                    
                    {/* Bhashya Multi-Language Translations */}
                    <div className="border border-gray-100 bg-gray-50 p-3 rounded mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Translations for this Bhashya</label>
                        <button type="button" onClick={() => addBhashyaTranslation(idx)} className="text-xs bg-white border px-2 py-1 rounded text-orange-600 shadow-sm">+ Add More</button>
                      </div>

                      {(c.translations || []).map((bTr, trIdx) => (
                        <div key={trIdx} className="flex gap-2 items-start mb-2 bg-white p-2 rounded border">
                          <select value={bTr.language} onChange={e => {
                            const newComms = [...commentaries]; newComms[idx].translations[trIdx].language = e.target.value; setCommentaries(newComms);
                          }} className="w-1/4 p-2 border rounded text-xs">
                            <option value="">Language...</option>
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                          </select>
                          <input type="text" placeholder="Author Name" value={bTr.authorName} onChange={e => {
                            const newComms = [...commentaries]; newComms[idx].translations[trIdx].authorName = e.target.value; setCommentaries(newComms);
                          }} className="w-1/4 p-2 border rounded text-xs" />
                          <textarea placeholder="Translation text..." value={bTr.text} onChange={e => {
                            const newComms = [...commentaries]; newComms[idx].translations[trIdx].text = e.target.value; setCommentaries(newComms);
                          }} className="flex-1 p-2 border rounded font-mono text-xs" rows="1" />
                          <button type="button" onClick={() => removeBhashyaTranslation(idx, trIdx)} className="text-red-400 p-2 text-sm">✕</button>
                        </div>
                      ))}
                    </div>

                    {/* Nested Tika Section */}
                    {metadata.addTika && (
                      <div className="ml-6 mt-4 border-l-2 border-orange-300 pl-4">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold text-gray-600 text-sm">Tika (Sub-commentaries)</h5>
                          <button type="button" onClick={() => addTika(idx)} className="text-xs bg-white border px-2 py-1 rounded text-orange-600 shadow-sm">+ Add Tika</button>
                        </div>
                        {c.tika.map((t, tIdx) => (
                          <div key={tIdx} className="mb-3 relative pr-8 bg-white p-3 border rounded shadow-sm">
                            
                            {/* NEW: Tika Title Input */}
                            <input 
                              type="text" 
                              placeholder="Tika Title (e.g., Anandagiri Tika)" 
                              value={t.authorTitle || ''} 
                              onChange={e => {
                                const newComms = [...commentaries]; 
                                newComms[idx].tika[tIdx].authorTitle = e.target.value; 
                                setCommentaries(newComms);
                              }} 
                              className="w-full p-2 border border-gray-200 rounded text-sm mb-2 font-semibold text-gray-700" 
                            />

                            {/* Existing Tika Text Input */}
                            <textarea 
                              placeholder="Tika Text (Original)..." 
                              value={t.text} 
                              onChange={e => {
                                const newComms = [...commentaries]; 
                                newComms[idx].tika[tIdx].text = e.target.value; 
                                setCommentaries(newComms);
                              }} 
                              className="w-full p-2 border border-gray-200 rounded font-mono text-xs mb-2 bg-gray-50" 
                              rows="2" 
                            />

                            {/* Existing Tika Translation Input (Optional if you want to show it) */}
                            <textarea 
                              placeholder="Tika Translation..." 
                              value={t.translation} 
                              onChange={e => {
                                const newComms = [...commentaries]; 
                                newComms[idx].tika[tIdx].translation = e.target.value; 
                                setCommentaries(newComms);
                              }} 
                              className="w-full p-2 border border-gray-200 rounded font-mono text-xs bg-gray-50" 
                              rows="2" 
                            />

                            <button 
                              type="button" 
                              onClick={() => removeTika(idx, tIdx)} 
                              className="absolute right-2 top-2 text-red-400 text-lg hover:bg-red-50 hover:text-red-600 px-2 rounded transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addCommentary} className="text-sm font-medium bg-white px-4 py-2 rounded shadow text-orange-600 hover:bg-gray-50">+ Add Another Bhashya</button>
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
                <button type="button" onClick={() => addExtraVar('text-variable')} className="text-orange-600 text-sm font-medium bg-gray-50 px-3 py-1 rounded border hover:bg-gray-100">+ Add Text Variable</button>
                <button type="button" onClick={() => addExtraVar('numeric-variable')} className="text-orange-600 text-sm font-medium bg-gray-50 px-3 py-1 rounded border hover:bg-gray-100">+ Add Numeric Variable</button>
              </div>
            </div>

            {/* Messages & Submit */}
            {message.text && (
              <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={isLoading || isProcessingAI} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Save Shloka Entry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddShloka;