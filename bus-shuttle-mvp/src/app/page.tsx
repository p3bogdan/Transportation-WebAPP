"use client";

import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import RouteList from '../components/RouteList';
import RouteDetails from '../components/RouteDetails';
import BookingForm from '../components/BookingForm';
import { Route } from '../utils/types';
import './globals.css';

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchResults, setSearchResults] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const routesPerPage = 10;
  const totalPages = Math.ceil(searchResults.length / routesPerPage);

  useEffect(() => {
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
  }, []);

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

  const handleConfirmBooking = (data: { name: string; email: string; phone: string; pickupAddress: string }) => {
    setBookingConfirmed(true);
    setBookingMode(false);
    // Here you would call the booking API and send email/SMS
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

  return (
    <main className="homepage-main">
      <header className="homepage-header">
        <h1>
          <span role="img" aria-label="bus">🚌</span> Bus & Shuttle Marketplace
        </h1>
        <p className="homepage-subtitle">Find, compare, and book your next journey with ease</p>
      </header>
      <nav style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <a href="/" style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>Home</a>
        <a href="/admin" style={{ padding: '8px 16px', background: '#333', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>Admin</a>
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
        {bookingMode && selectedRoute && !bookingConfirmed && (
          <BookingForm route={selectedRoute} onConfirm={handleConfirmBooking} />
        )}
        {bookingConfirmed && (
          <div className="booking-confirmed">
            <h3>Booking Confirmed!</h3>
            <p>Your booking reference and confirmation will be sent via email/SMS.</p>
          </div>
        )}
      </section>
      <footer className="homepage-footer">
        <p>&copy; {new Date().getFullYear()} Bus & Shuttle Marketplace. All rights reserved.</p>
      </footer>
    </main>
  );
}
