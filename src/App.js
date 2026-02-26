import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EditList from './components/EditList';
import AddShloka from './components/AddShloka';
import EditShloka from './components/EditShloka';

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
        
        {/* Protected Route for Edit List */}
        <Route 
          path="/edit-list" 
          element={
            <ProtectedRoute>
              <EditList />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Route for Edit Shloka */}
        <Route 
          path="/edit-shloka/:entryId/:shlokaIndex" 
          element={
            <ProtectedRoute>
              <EditShloka />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Route for Add New */}
        <Route 
          path="/add-new" 
          element={
            <ProtectedRoute>
              <AddShloka />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;