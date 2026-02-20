import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;
const STRAPI_URL = 'http://localhost:1337';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!STRAPI_URL) {
      setError('Strapi URL is not configured. Check .env');
      setIsLoading(false);
      return;
    }

    const cleanUrl = STRAPI_URL.replace(/\/$/, '');

    try {
      console.log('Logging into:', `${cleanUrl}/api/auth/local`);

      const response = await axios.post(`${cleanUrl}/api/auth/local`, {
        identifier,
        password,
      });

      localStorage.setItem('strapiJWT', response.data.jwt);
      localStorage.setItem('userEmail', response.data.user.email);
      localStorage.setItem('strapiBaseUrl', cleanUrl);

      navigate('/dashboard');
    } catch (err) {
      console.error('Login Error:', err?.response?.data || err);
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Login failed. Check credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600">🕉️ Shloka Portal</h1>
          <p className="text-gray-600 mt-2">Admin Authentication</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email / Username
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="test@test.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="123456"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            {isLoading ? 'Connecting...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;