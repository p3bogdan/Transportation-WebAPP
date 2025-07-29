"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface Booking {
  id: number;
  status: string;
  amount: number;
  createdAt: string;
  paymentStatus: string;
  route: {
    id: number;
    departure: string;
    arrival: string;
    departureTime: string;
    arrivalTime: string;
    provider: string;
    price: number;
    company?: {
      name: string;
      phone: string;
    };
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(session.user.email)}`);
      if (!res.ok) {
        if (res.status === 404) {
          // User exists in session but not in our database - this can happen with NextAuth
          // Let's create a minimal profile
          setUser({
            id: 0,
            name: session.user.name || '',
            email: session.user.email,
            phone: '',
            createdAt: new Date().toISOString()
          });
          setBookings([]);
          setEditName(session.user.name || '');
          setEditPhone('');
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      
      const data = await res.json();
      setUser(data.user);
      setBookings(data.bookings);
      setEditName(data.user.name);
      setEditPhone(data.user.phone || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          name: editName,
          phone: editPhone,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      
      const data = await res.json();
      setUser(data.user);
      setEditing(false);
      setUpdateMessage('Profile updated successfully!');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'failed': return '#f44336';
      case 'not_required': return '#2196f3';
      default: return '#666';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
        <div style={{ color: 'red', marginBottom: 16, padding: 16, backgroundColor: '#ffebee', borderRadius: 8 }}>
          {error}
        </div>
        <button 
          onClick={() => router.push('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ color: '#1976d2', fontSize: 28 }}>My Profile</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => router.push('/')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#1976d2', 
              color: 'white', 
              border: 'none', 
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Home
          </button>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Welcome Message */}
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid #bbdefb'
      }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
          Welcome back, {user?.name || session.user?.name}! 👋
        </h2>
        <p style={{ margin: 0, color: '#1565c0' }}>
          Manage your profile and view your booking history below.
        </p>
      </div>

      {/* Profile Information */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: 24, 
        borderRadius: 8, 
        marginBottom: 32,
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#333' }}>Personal Information</h2>
          {!editing && (
            <button 
              onClick={() => setEditing(true)}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Name:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Phone:</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. +40712345678"
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="submit"
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
              <button 
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditName(user?.name || '');
                  setEditPhone(user?.phone || '');
                }}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <strong>Name:</strong> {user?.name || session.user?.name}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || session.user?.email}
            </div>
            <div>
              <strong>Phone:</strong> {user?.phone || 'Not provided'}
            </div>
            <div>
              <strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
            </div>
          </div>
        )}

        {updateMessage && (
          <div style={{ color: '#28a745', marginTop: 12, fontWeight: 'bold' }}>
            {updateMessage}
          </div>
        )}
      </div>

      {/* Booking History */}
      <div>
        <h2 style={{ color: '#333', marginBottom: 16 }}>Booking History</h2>
        {bookings.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 8,
            border: '1px solid #e9ecef'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎫</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#666' }}>No bookings yet</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666' }}>
              Start your journey by booking your first trip!
            </p>
            <button 
              onClick={() => router.push('/')}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#1976d2', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 'bold'
              }}
            >
              Book Your First Trip
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map((booking) => (
              <div 
                key={booking.id} 
                style={{ 
                  border: '1px solid #e9ecef', 
                  borderRadius: 8, 
                  padding: 20,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: 20 }}>
                      {booking.route.departure} → {booking.route.arrival}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      Booking #{booking.id} • {booking.route.provider}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      padding: '4px 12px', 
                      borderRadius: 20, 
                      backgroundColor: getStatusColor(booking.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      {booking.status.toUpperCase()}
                    </div>
                    <div style={{ 
                      padding: '4px 12px', 
                      borderRadius: 20, 
                      backgroundColor: getPaymentStatusColor(booking.paymentStatus),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {booking.paymentStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, fontSize: '14px', marginBottom: 12 }}>
                  <div>
                    <strong style={{ color: '#333' }}>Departure:</strong><br />
                    <span style={{ color: '#666' }}>{new Date(booking.route.departureTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#333' }}>Arrival:</strong><br />
                    <span style={{ color: '#666' }}>{new Date(booking.route.arrivalTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#333' }}>Amount:</strong><br />
                    <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: 16 }}>€{booking.amount}</span>
                  </div>
                </div>
                
                <div style={{ fontSize: 12, color: '#999', borderTop: '1px solid #eee', paddingTop: 8 }}>
                  Booked on {new Date(booking.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}