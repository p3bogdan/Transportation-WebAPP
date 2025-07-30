"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      maxWidth: 450, 
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
          Create Your Account
        </h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          Join to track your bookings and manage your trips
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#333' }}>
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#333' }}>
            Email Address *
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

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#333' }}>
            Password *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Create a password (minimum 6 characters)"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666', fontSize: 12 }}>
            Your password must be at least 6 characters long
          </small>
        </div>

        {error && (
          <div style={{ 
            color: '#f44336', 
            marginBottom: 16, 
            padding: 12,
            backgroundColor: '#ffebee',
            borderRadius: 4,
            fontSize: 14,
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 16
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Already have account link */}
      <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #eee' }}>
        <p style={{ margin: 0, color: '#666' }}>
          Already have an account?
        </p>
        <a
          href="/auth/signin"
          style={{
            marginTop: 8,
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#1976d2',
            border: '1px solid #1976d2',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          Sign In Instead
        </a>
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