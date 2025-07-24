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
        // Compare only the date part (YYYY-MM-DD)
        const routeDate = r.departureTime ? new Date(r.departureTime).toISOString().slice(0, 10) : '';
        matchesDate = routeDate === date;
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

  return (
    <main className="homepage-main">
      <header className="homepage-header">
        <h1>
          <span role="img" aria-label="bus">🚌</span> Bus & Shuttle Marketplace
        </h1>
        <p className="homepage-subtitle">Find, compare, and book your next journey with ease</p>
      </header>
      <section className="homepage-search-section">
        <SearchBar onSearch={handleSearch} />
      </section>
      <section className="homepage-content">
        {loading && <p>Loading routes...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && !selectedRoute && (
          <RouteList routes={searchResults} onSelect={handleSelectRoute} />
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
