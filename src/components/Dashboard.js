import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const handleLogout = () => {
    // Clear the security tokens
    localStorage.removeItem('strapiJWT');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('strapiBaseUrl');
    // Send back to login
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">🕉️ Shloka Portal</h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Logged in as: <strong>{userEmail}</strong></span>
            <button 
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: The Two Options */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">What would you like to do?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Option 1: Modify Existing */}
          <button 
            onClick={() => console.log('Navigate to Edit List')}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg border-2 border-transparent hover:border-orange-500 transition-all group"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              📝
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Modify Existing</h3>
            <p className="text-gray-600 text-center text-sm">
              Search, edit, or update translations and commentaries for existing shlokas.
            </p>
          </button>

          {/* Option 2: Add New */}
          <button 
            onClick={() => console.log('Navigate to Add New Form')}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg border-2 border-transparent hover:border-green-500 transition-all group"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              ✨
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Add New Entry</h3>
            <p className="text-gray-600 text-center text-sm">
              Create a brand new shloka entry with multi-language support.
            </p>
          </button>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;