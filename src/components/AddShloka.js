import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = "https://dev.ekatmdhamlibrary.xoidlabs.com";

// --- UTILS: Script Filtering & Regex ---
const filterDevanagari = (val) => val.replace(/[^\u0900-\u097F\s.,;:!?'"|॥०-९\-\n\r()[\]{}@#$%^&*_+=\/\\<>~'|]/g, '');
const filterEnglish = (val) => val.replace(/[^a-zA-Z0-9\s.,;:!?'"()[\]{}\-\n\r@#$%^&*_+=\/\\<>~'|]/g, '');

const AddShloka = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('strapiJWT');

  // --- UI & Step State ---
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- STEP 1 STATE: Config & Metadata ---
  const [bookConfig, setBookConfig] = useState({
    selectedBookId: '',
    introduction: '',
    shankaracharyaIntro: '',
    shankaracharyaIntroTranslation: '',
    hierarchyLevels: 2,
    hierarchyNames: ['Chapter', 'Verse'],
    selectedCommentators: [] // Array of strings
  });

  // --- STEP 2 STATE: Content Entry ---
  const [entryData, setEntryData] = useState({
    sourceText: '',
    hierarchyValues: ['', ''], 
    verseTranslations: [{ lang: 'English', text: '' }],
    bhashyaContent: { sanskrit: '', english: '' },
    teekas: [] // Generated based on selectedCommentators
  });

  // Fetch Books for Dropdown
  const [availableBooks, setAvailableBooks] = useState([]);
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/books`);
        setAvailableBooks(res.data.data);
      } catch (err) { console.error("Books fetch failed", err); }
    };
    fetchBooks();
  }, []);

  // --- HANDLERS: Hierarchy Control ---
  const adjustHierarchy = (delta) => {
    const newCount = Math.min(Math.max(bookConfig.hierarchyLevels + delta, 1), 4);
    const newNames = [...bookConfig.hierarchyNames];
    const newValues = [...entryData.hierarchyValues];
    
    if (delta > 0) {
      newNames.push(`Level ${newCount}`);
      newValues.push('');
    } else {
      newNames.pop();
      newValues.pop();
    }
    setBookConfig(prev => ({ ...prev, hierarchyLevels: newCount, hierarchyNames: newNames }));
    setEntryData(prev => ({ ...prev, hierarchyValues: newValues }));
  };

  // --- HANDLERS: Auto-Increment Logic ---
  const incrementHierarchy = (values) => {
    const newValues = [...values];
    const lastIdx = newValues.length - 1;
    const lastVal = newValues[lastIdx];
    
    if (!isNaN(lastVal) && lastVal !== '') {
      newValues[lastIdx] = (parseInt(lastVal) + 1).toString();
    } else if (lastVal.includes('.')) {
      const parts = lastVal.split('.');
      const lastPart = parts.pop();
      if (!isNaN(lastPart)) {
        newValues[lastIdx] = [...parts, parseInt(lastPart) + 1].join('.');
      }
    }
    return newValues;
  };

  // --- SUBMIT: POST to Strapi ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload = {
      data: {
        sourceText: entryData.sourceText,
        hierarchyValues: entryData.hierarchyValues, // Matches JSON field
        verseTranslations: entryData.verseTranslations,
        bhashyaContent: entryData.bhashyaContent,
        teekas: entryData.teekas,
        book: bookConfig.selectedBookId
      }
    };

    try {
      await axios.post(`${API_BASE_URL}/api/entries`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Entry saved! Hierarchy incremented.' });
      
      // Auto-Increment and Reset specific fields
      setEntryData(prev => ({
        ...prev,
        sourceText: '',
        hierarchyValues: incrementHierarchy(prev.hierarchyValues),
        bhashyaContent: { sanskrit: '', english: '' },
        teekas: prev.teekas.map(t => ({ ...t, text: '', translation: '' }))
      }));

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed. Check console.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Ekatm Dham Content Engine</h1>
            <p className="text-indigo-200 text-sm">Step {step}: {step === 1 ? 'Metadata & Config' : 'Content Ingestion'}</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="bg-indigo-800 px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Dashboard</button>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Target Book</label>
                  <select 
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none"
                    value={bookConfig.selectedBookId}
                    onChange={(e) => setBookConfig({...bookConfig, selectedBookId: e.target.value})}
                  >
                    <option value="">Select a Book from Library...</option>
                    {availableBooks.map(b => <option key={b.id} value={b.id}>{b.attributes.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hierarchy Depth ({bookConfig.hierarchyLevels})</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => adjustHierarchy(-1)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">-</button>
                    <div className="flex-1 flex gap-2">
                      {bookConfig.hierarchyNames.map((name, i) => (
                        <input 
                          key={i}
                          value={name}
                          onChange={(e) => {
                            const n = [...bookConfig.hierarchyNames];
                            n[i] = e.target.value;
                            setBookConfig({...bookConfig, hierarchyNames: n});
                          }}
                          className="w-full text-center text-xs p-2 bg-indigo-50 border-none rounded-md"
                        />
                      ))}
                    </div>
                    <button onClick={() => adjustHierarchy(1)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">+</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Shankaracharya Intro (Sanskrit)</label>
                  <textarea 
                    className="w-full p-3 border rounded-xl font-serif"
                    value={bookConfig.shankaracharyaIntro}
                    onChange={(e) => setBookConfig({...bookConfig, shankaracharyaIntro: filterDevanagari(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Intro Translation (English)</label>
                  <textarea 
                    className="w-full p-3 border rounded-xl"
                    value={bookConfig.shankaracharyaIntroTranslation}
                    onChange={(e) => setBookConfig({...bookConfig, shankaracharyaIntroTranslation: filterEnglish(e.target.value)})}
                  />
                </div>
              </div>

              <button 
                disabled={!bookConfig.selectedBookId}
                onClick={() => {
                  // Pre-generate teeka slots for Step 2
                  setStep(2);
                }} 
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Continue to Shloka Entry →
              </button>
            </section>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hierarchy Value Inputs */}
              <div className="bg-indigo-50 p-6 rounded-2xl flex gap-4 overflow-x-auto">
                {bookConfig.hierarchyNames.map((name, i) => (
                  <div key={i} className="min-w-[120px]">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-indigo-400 mb-1">{name}</label>
                    <input 
                      required
                      value={entryData.hierarchyValues[i]}
                      onChange={(e) => {
                        const v = [...entryData.hierarchyValues];
                        v[i] = e.target.value;
                        setEntryData({...entryData, hierarchyValues: v});
                      }}
                      className="w-full p-3 rounded-lg border-none font-bold text-indigo-900"
                      placeholder="e.g. 1.1"
                    />
                  </div>
                ))}
              </div>

              {/* Source Text */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Original Sanskrit Text (Source)</label>
                <textarea 
                  required
                  rows="4"
                  value={entryData.sourceText}
                  onChange={(e) => setEntryData({...entryData, sourceText: filterDevanagari(e.target.value)})}
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl font-serif text-xl focus:border-indigo-500 outline-none"
                  placeholder="अथातो ब्रह्मजिज्ञासा ॥"
                />
              </div>

              {/* Bhashya Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-8">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <h3 className="font-bold text-amber-900 mb-4">Bhashyam (Sanskrit)</h3>
                  <textarea 
                    value={entryData.bhashyaContent.sanskrit}
                    onChange={(e) => setEntryData({...entryData, bhashyaContent: {...entryData.bhashyaContent, sanskrit: filterDevanagari(e.target.value)}})}
                    className="w-full p-3 rounded-xl border-none font-serif min-h-[150px]"
                  />
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-4">Bhashyam (English)</h3>
                  <textarea 
                    value={entryData.bhashyaContent.english}
                    onChange={(e) => setEntryData({...entryData, bhashyaContent: {...entryData.bhashyaContent, english: filterEnglish(e.target.value)}})}
                    className="w-full p-3 rounded-xl border-none min-h-[150px]"
                  />
                </div>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="px-8 py-4 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">Back</button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Save Shloka Entry & Increment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddShloka;