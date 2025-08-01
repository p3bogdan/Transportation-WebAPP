"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import SearchBar from '../components/SearchBar';
import RouteList from '../components/RouteList';
import RouteDetails from '../components/RouteDetails';
import BookingForm from '../components/BookingForm';
import { Route } from '../utils/types';
import { sanitizeName, sanitizeEmail, sanitizePhone } from '../utils/sanitization';
import './globals.css';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchResults, setSearchResults] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<{ name: string; email: string; phone: string; pickupAddress: string; paymentMethod: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Modal state for account creation
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalForm, setModalForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const routesPerPage = 10;
  const totalPages = Math.ceil(searchResults.length / routesPerPage);

  // Fix hydration issues by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Only fetch data after client-side hydration
    
    async function fetchRoutes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/routes');
        if (!res.ok) throw new Error('Failed to fetch routes');
        const data = await res.json();
        setRoutes(data);
        setSearchResults(data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    async function fetchStatistics() {
      setStatsLoading(true);
      try {
        const res = await fetch('/api/statistics');
        if (res.ok) {
          const data = await res.json();
          setStatistics(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch statistics:', err);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchStatistics();
  }, [isClient]);

  const handleSearch = ({ origin, destination, date }: { origin: string; destination: string; date: string }) => {
    const filtered = routes.filter(r => {
      const matchesOrigin = r.departure.toLowerCase().includes(origin.toLowerCase());
      const matchesDestination = r.arrival.toLowerCase().includes(destination.toLowerCase());
      let matchesDate = true;
      if (date) {
        // Assume r.departureTime or r.departure is an ISO string or date string
        const routeDate = r.departureTime ? new Date(r.departureTime) : new Date(r.departure);
        const searchDate = new Date(date);
        // Compare only the date part (ignore time)
        matchesDate = routeDate.toISOString().slice(0, 10) === searchDate.toISOString().slice(0, 10);
      }
      return matchesOrigin && matchesDestination && matchesDate;
    });
    setSearchResults(filtered);
    setSelectedRoute(null);
    setBookingMode(false);
    setBookingConfirmed(false);
  };

  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    setBookingMode(false);
    setBookingConfirmed(false);
  };

  const handleBook = () => {
    setBookingMode(true);
  };

  const handleConfirmBooking = (data: { name: string; email: string; phone: string; pickupAddress: string; paymentMethod: string }) => {
    setBookingConfirmed(true);
    setBookingMode(false);
    setBookingData(data);
    console.log('Booking confirmed with data:', data);
  };

  // Get routes for current page
  const paginatedRoutes = searchResults.slice(
    (currentPage - 1) * routesPerPage,
    currentPage * routesPerPage
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedRoute(null);
    setBookingMode(false);
    setBookingConfirmed(false);
  };

  // Handle modal registration
  const handleModalRegistration = async () => {
    setModalLoading(true);
    setModalError('');
    
    // Sanitize inputs
    const sanitizedName = sanitizeName(modalForm.name);
    const sanitizedEmail = sanitizeEmail(modalForm.email);
    const sanitizedPhone = sanitizePhone(modalForm.phone);
    
    // Basic validation with sanitized inputs
    if (!sanitizedName || !sanitizedEmail || !modalForm.password) {
      setModalError('Please fill in all required fields');
      setModalLoading(false);
      return;
    }

    if (sanitizedName.length < 2) {
      setModalError('Name must be at least 2 characters long');
      setModalLoading(false);
      return;
    }

    // Validate password requirements specifically
    if (modalForm.password.length < 6) {
      setModalError('Password must be at least 6 characters long');
      setModalLoading(false);
      return;
    }

    if (!/[a-z]/.test(modalForm.password)) {
      setModalError('Password must contain at least one lowercase letter');
      setModalLoading(false);
      return;
    }

    if (!/[A-Z]/.test(modalForm.password)) {
      setModalError('Password must contain at least one uppercase letter');
      setModalLoading(false);
      return;
    }

    if (!/\d/.test(modalForm.password)) {
      setModalError('Password must contain at least one number');
      setModalLoading(false);
      return;
    }

    try {
      const registrationData = {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        password: modalForm.password // Don't sanitize password
      };

      console.log('Sending registration data:', { ...registrationData, password: '[HIDDEN]' });

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Show specific password errors if available
        if (data.details && Array.isArray(data.details)) {
          setModalError('Password requirements: ' + data.details.join(', '));
        } else {
          setModalError(data.error || 'Registration failed. Please try again.');
        }
        setModalLoading(false);
        return;
      }
      
      // Auto-login after successful registration
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: sanitizedEmail,
        password: modalForm.password,
        redirect: false,
      });

      if (result?.error) {
        setModalError('Account created but login failed. Please sign in manually.');
      } else {
        // Close modal and redirect to profile
        setShowModal(false);
        setModalForm({ name: '', email: '', phone: '', password: '' });
        window.location.href = '/profile';
      }
    } catch (error: any) {
      console.error('Modal registration error:', error);
      setModalError(error.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal function
  const closeModal = () => {
    setShowModal(false);
    setModalError('');
    setModalForm({ name: '', email: '', phone: '', password: '' });
  };

  // Don't render dynamic content until client-side hydration is complete
  if (!isClient) {
    return (
      <main className="homepage-main">
        <header className="homepage-header">
          <h1>
            <span role="img" aria-label="bus">🚌</span> Bus & Shuttle Marketplace
          </h1>
          <p className="homepage-subtitle">Find, compare, and book your next journey with ease</p>
        </header>
        
        <nav style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/" style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>Home</a>
          <a href="/admin" style={{ padding: '8px 16px', background: '#333', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>Admin</a>
          <a href="/auth/signin" style={{ padding: '8px 16px', background: '#17a2b8', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>Sign In</a>
        </nav>
        
        <section className="homepage-info" style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <h2>About This Website</h2>
          <p>
            This portal helps Romanian travelers find and book bus transportation to other countries easily. You can search, compare, and reserve your journey all in one place.
          </p>
          <p>
            For any questions or assistance, call us at <strong>0722 499 563</strong>.
          </p>
          <p>
            <em>This is a project for NCI 2025 Bogdan Munteanu.</em>
          </p>
        </section>
        
        <section className="homepage-search-section">
          <div style={{ 
            background: '#f8f9fa', 
            padding: 24, 
            borderRadius: 8, 
            marginBottom: 24,
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{ marginBottom: 16, color: '#333' }}>Search Routes</h2>
            <p>Loading search interface...</p>
          </div>
        </section>
        
        <section className="homepage-content">
          <p>Loading routes...</p>
        </section>
        
        <footer className="homepage-footer">
          <p>&copy; 2025 Bus & Shuttle Marketplace. All rights reserved.</p>
        </footer>
      </main>
    );
  }

  return (
    <main className="homepage-main">
      <header className="homepage-header">
        <h1>
          <span role="img" aria-label="bus">🚌</span> Bus & Shuttle Marketplace
        </h1>
        <p className="homepage-subtitle">Find, compare, and book your next journey with ease</p>
      </header>
      
      <nav style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>Home</a>
          <a href="/admin" style={{ padding: '8px 16px', background: '#333', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>Admin</a>
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {session ? (
            <>
              <span style={{ color: '#666', fontSize: 14 }}>
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <a 
                href="/profile" 
                style={{ 
                  padding: '8px 16px', 
                  background: '#17a2b8', 
                  color: '#fff', 
                  borderRadius: 4, 
                  textDecoration: 'none', 
                  fontWeight: 500 
                }}
              >
                My Profile
              </a>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{ 
                  padding: '8px 16px', 
                  background: '#dc3545', 
                  color: '#fff', 
                  borderRadius: 4, 
                  border: 'none',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <a 
                href="/auth/signin" 
                style={{ 
                  padding: '8px 16px', 
                  background: '#17a2b8', 
                  color: '#fff', 
                  borderRadius: 4, 
                  textDecoration: 'none', 
                  fontWeight: 500 
                }}
              >
                Sign In
              </a>
            </>
          )}
        </div>
      </nav>
      
      {/* Statistics/Audit Section */}
      {!statsLoading && statistics && (
        <section style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: 12,
          color: 'white'
        }}>
          <h2 style={{ margin: '0 0 20px 0', textAlign: 'center', color: 'white' }}>
            📊 Platform Statistics
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 16,
            marginBottom: 20
          }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: 16, 
              borderRadius: 8,
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.totalBookings}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Total Bookings</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: 16, 
              borderRadius: 8,
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.recentBookings}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Last 7 Days</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: 16, 
              borderRadius: 8,
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>€{statistics.totalRevenue.toFixed(2)}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Total Revenue</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: 16, 
              borderRadius: 8,
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚌</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.totalRoutes}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Available Routes</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: 16, 
              borderRadius: 8,
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.totalUsers}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Registered Users</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: 16, 
              borderRadius: 8,
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.totalCompanies}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Partner Companies</div>
            </div>
          </div>
          
          {/* Top Routes */}
          {statistics.topRoutes && statistics.topRoutes.length > 0 && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: 16, 
              borderRadius: 8,
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'white' }}>🔥 Most Popular Routes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {statistics.topRoutes.slice(0, 3).map((route: any, index: number) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: 6
                  }}>
                    <span style={{ fontSize: 14 }}>
                      {route.departure} → {route.arrival}
                    </span>
                    <span style={{ 
                      fontSize: 12, 
                      background: 'rgba(255, 255, 255, 0.2)', 
                      padding: '2px 8px', 
                      borderRadius: 12 
                    }}>
                      {route.bookingCount} bookings
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      
      {/* Remove login requirement - allow guest bookings */}
      {!session && selectedRoute && bookingMode && (
        <div style={{
          maxWidth: 600,
          margin: '0 auto 24px auto',
          padding: 16,
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1565c0' }}>Guest Booking</h3>
          <p style={{ margin: '0 0 12px 0', color: '#1565c0' }}>
            You're booking as a guest. Create an account after booking to track your trips.
          </p>
          <a 
            href="/auth/signin"
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: 14
            }}
          >
            Sign In for Account Benefits
          </a>
        </div>
      )}
      
      <section className="homepage-info" style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <h2>About This Website</h2>
        <p>
          This portal helps Romanian travelers find and book bus transportation to other countries easily. You can search, compare, and reserve your journey all in one place.
        </p>
        <p>
          For any questions or assistance, call us at <strong>0722 499 563</strong>.
        </p>
        <p>
          <em>This is a project for NCI 2025 Bogdan Munteanu.</em>
        </p>
      </section>
      
      <section className="homepage-search-section">
        <SearchBar onSearch={handleSearch} />
      </section>
      
      <section className="homepage-content">
        {loading && <p>Loading routes...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && !selectedRoute && (
          <>
            <RouteList routes={paginatedRoutes} onSelect={handleSelectRoute} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
        {!loading && !error && selectedRoute && !bookingMode && !bookingConfirmed && (
          <RouteDetails route={selectedRoute} onBook={handleBook} />
        )}
        {/* Allow booking for both authenticated and guest users */}
        {bookingMode && selectedRoute && !bookingConfirmed && (
          <BookingForm 
            route={selectedRoute} 
            onConfirm={handleConfirmBooking} 
            isGuest={!session}
          />
        )}
        {bookingConfirmed && selectedRoute && bookingData && (
          <div style={{ 
            maxWidth: 600, 
            margin: '0 auto', 
            padding: 32, 
            border: '2px solid #28a745', 
            borderRadius: 12,
            backgroundColor: '#d4edda',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#155724', margin: '0 0 16px 0' }}>Booking Confirmed!</h2>
            <p style={{ color: '#155724', marginBottom: 24, fontSize: 18 }}>
              Thank you for your booking. Your trip has been successfully reserved!
            </p>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: 20, 
              borderRadius: 8, 
              textAlign: 'left',
              marginBottom: 24
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Booking Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <div><strong>Passenger:</strong> {bookingData.name}</div>
                <div><strong>Email:</strong> {bookingData.email}</div>
                <div><strong>Phone:</strong> {bookingData.phone}</div>
                <div><strong>Pickup:</strong> {bookingData.pickupAddress}</div>
                <div><strong>Route:</strong> {selectedRoute.departure} → {selectedRoute.arrival}</div>
                <div><strong>Price:</strong> €{selectedRoute.price}</div>
                <div><strong>Payment:</strong> {bookingData.paymentMethod === 'cash' ? 'Pay on Board' : 'Card Payment'}</div>
                <div><strong>Provider:</strong> {selectedRoute.provider}</div>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7',
              padding: 16, 
              borderRadius: 8,
              marginBottom: 24,
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>Important Information</h4>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#856404', fontSize: 14 }}>
                <li>Please arrive 15 minutes before departure</li>
                <li>Bring a valid ID for international travel</li>
                <li>Confirmation details will be sent to your email</li>
                <li>For support, call: <strong>0722 499 563</strong></li>
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  setBookingConfirmed(false);
                  setBookingMode(false);
                  setSelectedRoute(null);
                  setBookingData(null);
                }}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#1976d2', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Book Another Trip
              </button>
              {session ? (
                <a 
                  href="/profile"
                  style={{ 
                    padding: '12px 24px', 
                    backgroundColor: '#17a2b8', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  View My Bookings
                </a>
              ) : (
                <button 
                  onClick={() => setShowModal(true)}
                  style={{ 
                    padding: '12px 24px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Create Account to Track Bookings
                </button>
              )}
            </div>
          </div>
        )}
      </section>
      
      {/* Account Creation Modal */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: 8, 
            padding: 32, 
            maxWidth: 400, 
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: 24, textAlign: 'center' }}>
              🚌 Create Your Account
            </h2>
            <p style={{ margin: '0 0 24px 0', color: '#666', textAlign: 'center' }}>
              Join to track your bookings and manage your trips
            </p>
            
            {modalError && (
              <div style={{ 
                backgroundColor: '#f8d7da', 
                color: '#721c24', 
                padding: 12, 
                borderRadius: 4, 
                marginBottom: 16,
                fontSize: 14,
                border: '1px solid #f5c6cb'
              }}>
                {modalError}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={modalForm.name}
                onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                style={{ 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ced4da',
                  fontSize: 16,
                  boxSizing: 'border-box'
                }}
              />
              <input 
                type="email" 
                placeholder="Email Address *" 
                value={modalForm.email}
                onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                style={{ 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ced4da',
                  fontSize: 16,
                  boxSizing: 'border-box'
                }}
              />
              <input 
                type="tel" 
                placeholder="Phone Number (optional)" 
                value={modalForm.phone}
                onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                style={{ 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ced4da',
                  fontSize: 16,
                  boxSizing: 'border-box'
                }}
              />
              <input 
                type="password" 
                placeholder="Password *" 
                value={modalForm.password}
                onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                style={{ 
                  padding: 12, 
                  borderRadius: 4, 
                  border: '1px solid #ced4da',
                  fontSize: 16,
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ 
                fontSize: 12, 
                color: '#666', 
                marginTop: -8,
                marginBottom: 8,
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: 4,
                border: '1px solid #e9ecef'
              }}>
                <strong>Password must contain:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                  <li>At least 6 characters</li>
                  <li>One lowercase letter (a-z)</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One number (0-9)</li>
                </ul>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={handleModalRegistration}
                disabled={modalLoading}
                style={{ 
                  flex: 1,
                  padding: '14px 20px', 
                  backgroundColor: modalLoading ? '#ccc' : '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 6,
                  cursor: modalLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16
                }}
              >
                {modalLoading ? 'Creating...' : 'Create Account'}
              </button>
              
              <button 
                onClick={closeModal}
                disabled={modalLoading}
                style={{ 
                  flex: 1,
                  padding: '14px 20px', 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 6,
                  cursor: modalLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16
                }}
              >
                Cancel
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
              <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: 14 }}>
                Already have an account?
              </p>
              <a 
                href="/auth/signin"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 'bold'
                }}
              >
                Sign In Instead
              </a>
            </div>
          </div>
        </div>
      )}
      
      <footer className="homepage-footer">
        <p>&copy; {new Date().getFullYear()} Bus & Shuttle Marketplace. All rights reserved.</p>
      </footer>
    </main>
  );
}
