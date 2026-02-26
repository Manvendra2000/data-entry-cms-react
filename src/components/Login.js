import React, { useState } from 'react'; // Added useState
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  
  // --- Define the missing states ---
  const [email, setEmail] = useState(''); // Resolves Line 22:17 error
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Strapi requires 'identifier' for the email/username field
    const loginData = {
      identifier: email, 
      password: password
    };

    try {
      // Pointing to your local Strapi instance
      const res = await axios.post('http://localhost:1337/api/auth/local', loginData);

      // --- Success Path ---
      // These keys are required by your App.js ProtectedRoute and AddShloka.js
      localStorage.setItem('strapiJWT', res.data.jwt);
      localStorage.setItem('strapiBaseUrl', 'http://localhost:1337');
      
      navigate('/dashboard');
    } catch (err) {
      // Detailed error logging to avoid "Guessing"
      console.error("Login Error:", err.response?.data?.error);
      setError(err.response?.data?.error?.message || "Login failed. Check credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-lg rounded-xl w-96">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Ekatm Dham Login</h2>
        
        {error && <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email / Username</label>
          <input 
            type="text" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-2 border rounded"
            placeholder="test@test.com"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-2 border rounded"
            placeholder="••••••••"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;