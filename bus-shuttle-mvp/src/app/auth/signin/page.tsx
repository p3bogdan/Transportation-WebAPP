"use client";

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Successful login
        router.push('/profile');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Registration failed');
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Registration successful but login failed. Please try logging in manually.');
      } else {
        router.push('/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '80px auto', 
      padding: 32,
      backgroundColor: '#fff',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ color: '#1976d2', marginBottom: 8 }}>
          🚌 Bus & Shuttle
        </h1>
        <h2 style={{ color: '#333', margin: 0, fontSize: 24 }}>
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          {isRegistering 
            ? 'Join to track your bookings and manage trips' 
            : 'Access your booking history and profile'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={isRegistering ? handleRegister : handleLogin}>
        {isRegistering && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#333' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isRegistering}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#333' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
        </div>

        {isRegistering && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#333' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +40712345678"
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#333' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={isRegistering ? "Create a password (min 6 characters)" : "Enter your password"}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
        </div>

        {error && (
          <div style={{ 
            color: '#f44336', 
            marginBottom: 16, 
            padding: 8,
            backgroundColor: '#ffebee',
            borderRadius: 4,
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 16
          }}
        >
          {loading 
            ? 'Please wait...' 
            : (isRegistering ? 'Create Account' : 'Sign In')
          }
        </button>
      </form>

      {/* Toggle between login and register */}
      <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #eee' }}>
        <p style={{ margin: 0, color: '#666' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
            setName('');
            setEmail('');
            setPassword('');
            setPhone('');
          }}
          style={{
            marginTop: 8,
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#1976d2',
            border: '1px solid #1976d2',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          {isRegistering ? 'Sign In Instead' : 'Create Account'}
        </button>
      </div>

      {/* Home link */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <a 
          href="/"
          style={{
            color: '#666',
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}