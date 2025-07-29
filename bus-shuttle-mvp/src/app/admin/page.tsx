"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '../../components/AdminPanel';

interface DashboardStats {
  totalBookings: number;
  totalUsers: number;
  totalRoutes: number;
  totalCompanies: number;
  recentBookings: number;
  pendingPayments: number;
}

export default function AdminPage() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for admin authentication cookie
    const cookies = document.cookie.split(';');
    const adminAuthCookie = cookies.find(cookie => 
      cookie.trim().startsWith('admin_auth=')
    );

    if (!adminAuthCookie) {
      router.push('/admin/login');
      return;
    }

    try {
      const cookieValue = adminAuthCookie.split('=')[1];
      const parsedData = JSON.parse(decodeURIComponent(cookieValue));
      
      if (!parsedData.id || !parsedData.username) {
        router.push('/admin/login');
        return;
      }

      setAdminData(parsedData);
      
      // Load dashboard statistics
      loadDashboardStats();
    } catch (error) {
      console.error('Error parsing admin cookie:', error);
      router.push('/admin/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const loadDashboardStats = async () => {
    try {
      const [bookingsRes, usersRes, routesRes, companiesRes] = await Promise.all([
        fetch('/api/statistics'),
        fetch('/api/users'),
        fetch('/api/routes'),
        fetch('/api/companies')
      ]);

      const [bookingsData, usersData, routesData, companiesData] = await Promise.all([
        bookingsRes.json(),
        usersRes.json(),
        routesRes.json(),
        companiesRes.json()
      ]);

      // Calculate recent bookings (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      setStats({
        totalBookings: bookingsData.totalBookings || 0,
        totalUsers: usersData.length || 0,
        totalRoutes: routesData.length || 0,
        totalCompanies: companiesData.length || 0,
        recentBookings: bookingsData.recentBookings || 0,
        pendingPayments: bookingsData.pendingPayments || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleLogout = () => {
    document.cookie = 'admin_auth=; path=/; max-age=0';
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ 
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          Loading admin panel...
        </div>
      </div>
    );
  }

  if (!adminData) {
    return null; // Will redirect to login
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #dee2e6'
      }}>
        <nav style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '1rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <h1 style={{ margin: 0, color: '#1976d2', fontSize: '1.5rem' }}>
              Transportation Admin
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href="/" style={{ 
                padding: '0.5rem 1rem', 
                background: '#1976d2', 
                color: '#fff', 
                borderRadius: '4px', 
                textDecoration: 'none', 
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>
                🏠 Home
              </a>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              Welcome, <strong style={{ color: '#333' }}>{adminData.username}</strong>
              <span style={{ 
                marginLeft: '0.5rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}>
                {adminData.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🚪 Logout
            </button>
          </div>
        </nav>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Dashboard Statistics */}
        {stats && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#333' }}>📊 Dashboard Overview</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📅</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Total Bookings</h3>
                </div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
                  {stats.totalBookings}
                </p>
              </div>

              <div style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>👥</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Total Users</h3>
                </div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                  {stats.totalUsers}
                </p>
              </div>

              <div style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🚌</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Active Routes</h3>
                </div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#fd7e14' }}>
                  {stats.totalRoutes}
                </p>
              </div>

              <div style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏢</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Companies</h3>
                </div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
                  {stats.totalCompanies}
                </p>
              </div>

              <div style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🆕</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Recent Bookings</h3>
                </div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
                  {stats.recentBookings}
                </p>
                <small style={{ color: '#666', fontSize: '0.8rem' }}>Last 7 days</small>
              </div>

              <div style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⏳</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Pending Payments</h3>
                </div>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                  {stats.pendingPayments}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Admin Panel */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #dee2e6',
          overflow: 'hidden'
        }}>
          <AdminPanel />
        </div>
      </main>
    </div>
  );
}