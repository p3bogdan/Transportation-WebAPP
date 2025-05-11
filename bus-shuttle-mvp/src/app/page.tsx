"use client";

import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import RouteList from '../components/RouteList';
import RouteDetails from '../components/RouteDetails';
import BookingForm from '../components/BookingForm';
import { routes as mockRoutes } from '../utils/mockData';
import { Route } from '../utils/types';
import './globals.css';

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<Route[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const handleSearch = ({ origin, destination, date }: { origin: string; destination: string; date: string }) => {
    const filtered = mockRoutes.filter(
      r =>
        r.origin.toLowerCase().includes(origin.toLowerCase()) &&
        r.destination.toLowerCase().includes(destination.toLowerCase())
    );
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

  const handleConfirmBooking = (data: { name: string; email: string; phone: string }) => {
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
        {!selectedRoute && (
          <RouteList routes={searchResults} onSelect={handleSelectRoute} />
        )}
        {selectedRoute && !bookingMode && !bookingConfirmed && (
          <RouteDetails route={selectedRoute} onBook={handleBook} />
        )}
        {bookingMode && selectedRoute && !bookingConfirmed && (
          <BookingForm routeId={selectedRoute.id} onConfirm={handleConfirmBooking} />
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
