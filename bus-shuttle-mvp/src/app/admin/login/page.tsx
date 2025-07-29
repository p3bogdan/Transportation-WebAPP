"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple admin authentication (replace with proper auth in production)
    if (username === 'admin' && password === 'admin123') {
      // Set admin auth cookie
      document.cookie = 'admin_auth=1; path=/; max-age=86400'; // 24 hours
      router.push('/admin');
    } else {
      setError('Invalid username or password');
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
          Admin Login
        </h1>
        
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
          
          {error && (
            <div style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>
              {error}
            </div>
          )}
          
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
        
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 4,
          fontSize: 14,
          color: '#666'
        }}>
          <strong>Demo Credentials:</strong><br />
          Username: admin<br />
          Password: admin123
        </div>
        
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
