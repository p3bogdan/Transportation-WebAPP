"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({
    username: '',
    email: '',
    password: '',
    setupKey: ''
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Set secure admin auth cookie with admin info
        document.cookie = `admin_auth=${JSON.stringify({
          id: data.admin.id,
          username: data.admin.username,
          role: data.admin.role
        })}; path=/; max-age=86400; secure; samesite=strict`;
        
        router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
        // If no admin exists, show setup option
        if (data.error === 'Invalid credentials') {
          setShowSetup(true);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setupData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowSetup(false);
        setError('');
        alert('Admin account created successfully! Please login with your credentials.');
        setSetupData({ username: '', email: '', password: '', setupKey: '' });
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: 32, 
        borderRadius: 8, 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: 400
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24, color: '#333' }}>
          {showSetup ? 'Setup Admin Account' : 'Admin Login'}
        </h1>
        
        {!showSetup ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Username:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: 16
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: 16
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: 12, 
                backgroundColor: '#1976d2', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                fontSize: 16,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Username:
              </label>
              <input
                type="text"
                value={setupData.username}
                onChange={(e) => setSetupData(prev => ({ ...prev, username: e.target.value }))}
                required
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: 16
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Email:
              </label>
              <input
                type="email"
                value={setupData.email}
                onChange={(e) => setSetupData(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: 16
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Password:
              </label>
              <input
                type="password"
                value={setupData.password}
                onChange={(e) => setSetupData(prev => ({ ...prev, password: e.target.value }))}
                required
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: 16
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Setup Key:
              </label>
              <input
                type="password"
                value={setupData.setupKey}
                onChange={(e) => setSetupData(prev => ({ ...prev, setupKey: e.target.value }))}
                placeholder="Contact system administrator"
                required
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ccc',
                  fontSize: 16
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: 12, 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                fontSize: 16,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Admin Account'}
            </button>
            
            <button 
              type="button"
              onClick={() => setShowSetup(false)}
              style={{ 
                padding: 8, 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </form>
        )}
        
        {error && (
          <div style={{ color: 'red', textAlign: 'center', marginTop: 16, padding: 12, backgroundColor: '#f8d7da', borderRadius: 4 }}>
            {error}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
