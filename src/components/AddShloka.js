import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

//const API_BASE_URL = "https://dev.ekatmdhamlibrary.xoidlabs.com";
// Change this line at the top of AddShloka.js
const API_BASE_URL = "http://localhost:1337";

// --- UTILS: Script Filtering ---
const filterDevanagari = (val) => val.replace(/[^\u0900-\u097F\s.,;:!?'"|॥०-९\-\n\r()[\]{}@#$%^&*_+=\/\\<>~'|]/g, '');
const filterEnglish = (val) => val.replace(/[^a-zA-Z0-9\s.,;:!?'"()[\]{}\-\n\r@#$%^&*_+=\/\\<>~'|]/g, '');

const AddShloka = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('strapiJWT');

  // Move these back INSIDE the AddShloka function
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [isAddingAuthor, setIsAddingAuthor] = useState(null);
  const [newAuthorName, setNewAuthorName] = useState('');
  
  // ... the rest of your states (step, isLoading, bookConfig, etc.)

  // UI & Step State
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availableBooks, setAvailableBooks] = useState([]);


  // --- STEP 1 STATE: Metadata Config ---
  const [bookConfig, setBookConfig] = useState({
    selectedBookId: '',
    selectedBhashya: 'Shankaracharya',
    introduction: '',
    shankaracharyaIntro: '',
    shankaracharyaIntroTranslation: '',
    hierarchyLevels: 2, 
    hierarchyNames: ['अध्याय', 'श्लोक'],
    selectedTeekas: [''] 
  });

  // --- STEP 2 STATE: Shloka Entry ---
  // const [entryData, setEntryData] = useState({
  //   hierarchyValues: ['', ''], 
  //   sourceText: '',
  //   englishTranslation: '',
  //   bhashyaSanskrit: '',
  //   bhashyaEnglish: '',
  //   teekaEntries: [] 
  // });

  // --- STEP 2 STATE: Shloka Entry ---
  const [entryData, setEntryData] = useState({
    hierarchyValues: ['', ''], 
    sourceText: '',
    englishTranslation: '',
    bhashyaSanskrit: '',
    bhashyaEnglish: '',
    teekaEntries: [] 
  });

  // ADD THESE LINES HERE (Approx Line 57):
  // const [selectableAuthors, setSelectableAuthors] = useState([]);

  // useEffect(() => {
  //   if (bookConfig.selectedBookId) {
  //     // Strapi v4 nests fields under .attributes; v5 may flatten them
  //     const selectedBook = availableBooks.find(b => b.id.toString() === bookConfig.selectedBookId.toString());
  //     const allowed = selectedBook?.attributes?.commentators || selectedBook?.commentators || [];
  //     setSelectableAuthors(allowed);
  //   } else {
  //     setSelectableAuthors([]);
  //   }
  // }, [bookConfig.selectedBookId, availableBooks]);
  // --- Replace everything from const [selectableAuthors... down to the next useEffect ---
  const [selectableAuthors, setSelectableAuthors] = useState([]);

  useEffect(() => {
    if (bookConfig.selectedBookId && availableBooks.length > 0) {
      // 1. Find the selected book object in the list fetched from Strapi
      const selectedBook = availableBooks.find(b => b.id.toString() === bookConfig.selectedBookId.toString());
      
      // 2. Extract the commentators list directly from the database JSON field
      // This supports both nested (attributes) and flattened response structures
      const authors = selectedBook?.attributes?.commentators || selectedBook?.commentators || [];
      
      setSelectableAuthors(authors);
    } else {
      setSelectableAuthors([]);
    }
  }, [bookConfig.selectedBookId, availableBooks]);

  // Fetch Books from Strapi
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/books`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableBooks(res.data.data || []); 
      } catch (err) { 
        console.error("Books fetch failed", err);
      }
    };
    if (token) fetchBooks();
  }, [token]);

  // --- "ON THE GO" HANDLERS ---
  const handleQuickAddBook = async () => {
    if (!newBookTitle.trim()) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/books`, 
        { data: { title: newBookTitle } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableBooks([...availableBooks, res.data.data]);
      setBookConfig({ ...bookConfig, selectedBookId: res.data.data.id });
      setIsAddingBook(false);
      setNewBookTitle('');
    } catch (err) { console.error("Quick add book failed", err); }
  };

  const handleQuickAddAuthor = async (index) => {
    if (!newAuthorName.trim()) return;
    try {
      // Logic for adding to an authors collection if it exists
      const updatedTeekas = [...bookConfig.selectedTeekas];
      updatedTeekas[index] = newAuthorName;
      setBookConfig({ ...bookConfig, selectedTeekas: updatedTeekas });
      setIsAddingAuthor(null);
      setNewAuthorName('');
    } catch (err) { console.error("Quick add author failed", err); }
  };

  // --- LOGIC HANDLERS ---
  const handleHierarchyChange = (delta) => {
    const newCount = bookConfig.hierarchyLevels + delta;
    if (newCount < 2 || newCount > 4) return; 

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

  const handleNext = () => {
    const slots = bookConfig.selectedTeekas
      .filter(t => t !== '')
      .map(author => ({ author, teekaName: '', sanskrit: '', english: '' }));
    
    setEntryData(prev => ({ ...prev, teekaEntries: slots }));
    setStep(2);
  };

  const handleSubmit = async (isFinish = false) => {
    setIsLoading(true);
    const payload = {
      data: {
        sourceText: entryData.sourceText,
        hierarchyValues: entryData.hierarchyValues,
        verseTranslations: [{ lang: 'English', text: entryData.englishTranslation }],
        bhashyaContent: { sanskrit: entryData.bhashyaSanskrit, english: entryData.bhashyaEnglish },
        teekas: entryData.teekaEntries,
        book: bookConfig.selectedBookId
      }
    };

    try {
      await axios.post(`${API_BASE_URL}/api/entries`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isFinish) navigate('/dashboard');
      else {
        const nextVals = [...entryData.hierarchyValues];
        const lastIdx = nextVals.length - 1;
        if (!isNaN(nextVals[lastIdx])) nextVals[lastIdx] = (parseInt(nextVals[lastIdx]) + 1).toString();
        
        setEntryData(prev => ({ ...prev, sourceText: '', englishTranslation: '', bhashyaSanskrit: '', bhashyaEnglish: '', hierarchyValues: nextVals }));
        setMessage({ type: 'success', text: 'Saved! Values incremented.' });
        setTimeout(() => setMessage({type: '', text: ''}), 3000);
      }
    } catch (err) { setMessage({ type: 'error', text: 'Error saving entry.' }); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Progress Stepper */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-center items-center gap-16">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === 1 ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-green-500 text-white'}`}>1</div>
          <div className="h-[2px] w-24 bg-slate-200"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === 2 ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-slate-200 text-slate-400'}`}>2</div>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                {/* Book Selector with + Button */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Book</label>
                  {!isAddingBook ? (
                    <div className="flex gap-2">
                      <select 
                            className="flex-1 p-4 border rounded-xl bg-slate-50" 
                            value={bookConfig.selectedBookId} 
                            onChange={e => setBookConfig({...bookConfig, selectedBookId: e.target.value})}
                          >
                            <option value="">Select Book...</option>
                            {/* The fix: Use optional chaining to prevent reading 'title' of undefined */}
                            {availableBooks?.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.attributes?.title || b.title || "Untitled Book"}
                              </option>
                            ))}
                          </select>
                      <button onClick={() => setIsAddingBook(true)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100">+</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input autoFocus className="flex-1 p-3 border rounded-xl" placeholder="New Book Title..." value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} />
                      <button onClick={handleQuickAddBook} className="bg-green-600 text-white px-4 rounded-xl font-bold">Save</button>
                      <button onClick={() => setIsAddingBook(false)} className="bg-slate-100 text-slate-500 px-3 rounded-xl">✕</button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Bhashya</label>
                  <select className="w-full p-3 border rounded-xl bg-slate-50" value={bookConfig.selectedBhashya} onChange={e => setBookConfig({...bookConfig, selectedBhashya: e.target.value})}>
                    <option>Shankaracharya</option>
                    <option>Ramanujacharya</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <textarea placeholder="Book Introduction (Optional)" className="w-full p-4 border rounded-xl min-h-[80px]" value={bookConfig.introduction} onChange={e => setBookConfig({...bookConfig, introduction: e.target.value})} />
                <textarea placeholder="Introduction by Shankaracharya" className="w-full p-4 border rounded-xl font-serif text-lg bg-amber-50/30" value={bookConfig.shankaracharyaIntro} onChange={e => setBookConfig({...bookConfig, shankaracharyaIntro: filterDevanagari(e.target.value)})} />
                <textarea placeholder="Translation of Introduction" className="w-full p-4 border rounded-xl" value={bookConfig.shankaracharyaIntroTranslation} onChange={e => setBookConfig({...bookConfig, shankaracharyaIntroTranslation: filterEnglish(e.target.value)})} />
              </div>

              {/* Teeka List with inline + button */}
              {/* <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase">Teeka / Commentaries</label>
                {bookConfig.selectedTeekas.map((teeka, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select className="flex-1 p-3 border rounded-xl bg-slate-50" value={teeka} onChange={e => {
                      const newT = [...bookConfig.selectedTeekas];
                      newT[idx] = e.target.value;
                      setBookConfig({...bookConfig, selectedTeekas: newT});
                    }}>
                      <option value="">Select Author...</option>
                      <option>Anandagiri</option>
                      <option>Adi Shankaracharya</option>
                    </select>
                    <button onClick={() => setIsAddingAuthor(idx)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg">+</button>
                    <button onClick={() => setBookConfig({...bookConfig, selectedTeekas: bookConfig.selectedTeekas.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500">✕</button>
                  </div>
                ))} */}
                {/* Teeka List with inline + button (Approx Line 144) */}
  <div className="space-y-3">
    <label className="block text-xs font-bold text-slate-500 uppercase">Teeka / Commentaries</label>
    {bookConfig.selectedTeekas.map((teeka, idx) => (
      <div key={idx} className="flex gap-2 items-center">
        {/* REPLACE YOUR OLD SELECT WITH THIS DYNAMIC ONE: */}
        {/* <select 
          className="flex-1 p-3 border rounded-xl bg-slate-50" 
          value={teeka} 
          onChange={e => {
            const newT = [...bookConfig.selectedTeekas];
            newT[idx] = e.target.value;
            setBookConfig({...bookConfig, selectedTeekas: newT});
          }}
        >
          <option value="">Select Author...</option>
          {selectableAuthors.map((author, i) => (
            <option key={i} value={author}>{author}</option>
          ))}
        </select> */}
        <select 
  className="flex-1 p-3 border rounded-xl bg-slate-50" 
  value={teeka} 
  onChange={e => {
    const newT = [...bookConfig.selectedTeekas];
    newT[idx] = e.target.value;
    setBookConfig({...bookConfig, selectedTeekas: newT});
  }}
>
  <option value="">Select Author...</option>
  {/* This now dynamically shows only the authors allowed for the selected book */}
  {selectableAuthors.map((author, i) => (
    <option key={i} value={author}>{author}</option>
  ))}
</select>
        
        <button onClick={() => setIsAddingAuthor(idx)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg">+</button>
        <button onClick={() => setBookConfig({...bookConfig, selectedTeekas: bookConfig.selectedTeekas.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500">✕</button>
      </div>
    ))}
                
                {isAddingAuthor !== null && (
                   <div className="flex gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                     <input autoFocus placeholder="New Author Name..." className="flex-1 p-2 border rounded-lg" value={newAuthorName} onChange={e => setNewAuthorName(e.target.value)} />
                     <button onClick={() => handleQuickAddAuthor(isAddingAuthor)} className="bg-indigo-600 text-white px-4 py-1 rounded-lg text-sm">Add</button>
                     <button onClick={() => setIsAddingAuthor(null)} className="text-slate-500 text-sm px-2">Cancel</button>
                   </div>
                )}
                <button onClick={() => setBookConfig({...bookConfig, selectedTeekas: [...bookConfig.selectedTeekas, '']})} className="text-indigo-600 font-bold text-sm hover:underline">+ Add Teeka</button>
              </div>

              {/* Hierarchy Identifiers */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">Hierarchy Identifiers</h3>
                  <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => handleHierarchyChange(-1)} disabled={bookConfig.hierarchyLevels <= 2} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold disabled:opacity-30">-</button>
                    <span className="font-bold px-2 text-indigo-600">{bookConfig.hierarchyLevels} Levels</span>
                    <button onClick={() => handleHierarchyChange(1)} disabled={bookConfig.hierarchyLevels >= 4} className="w-8 h-8 bg-white rounded-lg shadow-sm font-bold disabled:opacity-30">+</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {bookConfig.hierarchyNames.map((name, i) => (
                    <input key={i} className="p-3 border rounded-xl font-serif focus:ring-2 focus:ring-indigo-100 outline-none" value={name} onChange={e => {
                      const n = [...bookConfig.hierarchyNames];
                      n[i] = e.target.value;
                      setBookConfig({...bookConfig, hierarchyNames: n});
                    }} />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 border-t">
                <button onClick={() => navigate('/dashboard')} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Back</button>
                <button onClick={handleNext} disabled={!bookConfig.selectedBookId} className="px-12 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50">Next</button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Context Header */}
              <div className="grid grid-cols-4 gap-4 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-inner">
                {bookConfig.hierarchyNames.map((name, i) => (
                  <div key={i}>
                    <label className="block text-[10px] uppercase font-black text-indigo-400 mb-1">{name}</label>
                    <input className="w-full p-2 rounded-lg border-none font-bold text-indigo-900 bg-white" value={entryData.hierarchyValues[i]} onChange={e => {
                      const v = [...entryData.hierarchyValues];
                      v[i] = e.target.value;
                      setEntryData({...entryData, hierarchyValues: v});
                    }} />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Source Text (Devanagari)</label>
                <textarea className="w-full p-5 border rounded-2xl min-h-[140px] font-serif text-2xl bg-slate-50/50 shadow-sm" value={entryData.sourceText} onChange={e => setEntryData({...entryData, sourceText: filterDevanagari(e.target.value)})} />
              </div>

              <div className="space-y-6 pt-6 border-t">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Translations & Bhashya</label>
                  <textarea placeholder="English Translation" className="w-full p-4 border rounded-xl" value={entryData.englishTranslation} onChange={e => setEntryData({...entryData, englishTranslation: filterEnglish(e.target.value)})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <textarea placeholder="Bhashyam (Sanskrit)" className="p-4 border rounded-xl min-h-[120px] font-serif bg-amber-50/20" value={entryData.bhashyaSanskrit} onChange={e => setEntryData({...entryData, bhashyaSanskrit: filterDevanagari(e.target.value)})} />
                  <textarea placeholder="Bhashyam (English)" className="p-4 border rounded-xl min-h-[120px]" value={entryData.bhashyaEnglish} onChange={e => setEntryData({...entryData, bhashyaEnglish: filterEnglish(e.target.value)})} />
                </div>
              </div>

              {/* Dynamic Teeka Sections */}
              {entryData.teekaEntries.map((teeka, idx) => (
                <div key={idx} className="p-6 border rounded-2xl bg-slate-50/50 border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    <span className="font-black text-indigo-900 text-sm tracking-widest uppercase">{teeka.author}</span>
                  </div>
                  <input placeholder="Teeka Name" className="w-full p-3 border rounded-xl bg-white" value={teeka.teekaName} onChange={e => {
                    const newT = [...entryData.teekaEntries];
                    newT[idx].teekaName = e.target.value;
                    setEntryData({...entryData, teekaEntries: newT});
                  }} />
                  <textarea placeholder="Original Text (Sanskrit)" className="w-full p-3 border rounded-xl font-serif min-h-[100px]" value={teeka.sanskrit} onChange={e => {
                    const newT = [...entryData.teekaEntries];
                    newT[idx].sanskrit = filterDevanagari(e.target.value);
                    setEntryData({...entryData, teekaEntries: newT});
                  }} />
                  <textarea placeholder="English Translation" className="w-full p-3 border rounded-xl min-h-[100px]" value={teeka.english} onChange={e => {
                    const newT = [...entryData.teekaEntries];
                    newT[idx].english = filterEnglish(e.target.value);
                    setEntryData({...entryData, teekaEntries: newT});
                  }} />
                </div>
              ))}

              {message.text && (
                <div className={`p-4 rounded-xl text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex gap-4 pt-10 border-t">
                <button onClick={() => setStep(1)} className="px-10 py-4 font-bold text-slate-400 hover:text-slate-600">Back</button>
                <button onClick={() => handleSubmit(false)} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700">Save & Next Entry</button>
                <button onClick={() => handleSubmit(true)} className="px-10 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-100 hover:bg-green-700">Finish</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddShloka;