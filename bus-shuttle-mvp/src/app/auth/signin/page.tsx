"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeHtml, validatePassword } from '@/utils/sanitization';

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

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!sanitizedEmail) {
      setError('Valid email address is required');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: sanitizedEmail,
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

    // Sanitize all inputs
    const sanitizedName = sanitizeName(name);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPhone = sanitizePhone(phone);

    // Validate sanitized inputs
    if (!sanitizedName || sanitizedName.length < 2) {
      setError('Name must be at least 2 characters');
      setLoading(false);
      return;
    }

    if (!sanitizedEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitizedEmail)) {
      setError('Valid email address is required');
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(`Password requirements: ${passwordValidation.errors.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: sanitizedName, 
          email: sanitizedEmail, 
          password, 
          phone: sanitizedPhone 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Registration failed');
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        email: sanitizedEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Registration successful but login failed. Please try logging in manually.');
      } else {
        router.push('/profile');
      }
    } catch (err: any) {
      setError(sanitizeHtml(err.message || 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Input change handlers with real-time sanitization
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeName(e.target.value);
    setName(sanitized);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeEmail(e.target.value);
    setEmail(sanitized);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhone(e.target.value);
    setPhone(sanitized);
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
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required={isRegistering}
              maxLength={60}
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
            Email Address *
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
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
              onChange={handlePhoneChange}
              maxLength={20}
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
            Password *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            maxLength={128}
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
          {isRegistering && (
            <small style={{ color: '#666', fontSize: 12, display: 'block', marginTop: 4 }}>
              Password must contain uppercase, lowercase, and numbers
            </small>
          )}
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
          {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setName('');
              setPhone('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#1976d2',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {isRegistering 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Create one"
            }
          </button>
        </div>
      </form>
    </div>
  );
}