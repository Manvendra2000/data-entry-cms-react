import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

// This acts as your security guard. 
// It checks if a JWT token exists in the browser before letting anyone in.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('strapiJWT');
  
  if (!token) {
    // No token found? Kick them back to the login page.
    return <Navigate to="/" replace />;
  }
  
  // Token found? Let them see the protected screen.
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Route (Screen 1) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;