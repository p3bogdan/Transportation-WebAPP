"use client";

import React, { useEffect, useState } from 'react';

interface Booking {
  id: number;
  user: string;
  routeId: string;
  date: string;
  createdAt: string;
  pickupCity?: string;
  destination?: string;
  email?: string;
  phone?: string;
  company?: string;
}

const AdminPanel: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2>Admin Panel</h2>
      <h3>Reservations</h3>
      {loading ? (
        <p>Loading reservations...</p>
      ) : bookings.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 18px' }}>Name</th>
              <th style={{ padding: '12px 18px' }}>Pickup Address</th>
              <th style={{ padding: '12px 18px' }}>Destination Address</th>
              <th style={{ padding: '12px 18px' }}>Email</th>
              <th style={{ padding: '12px 18px' }}>Phone</th>
              <th style={{ padding: '12px 18px' }}>Date of Departure</th>
              <th style={{ padding: '12px 18px' }}>Reservation Time</th>
              <th style={{ padding: '12px 18px' }}>Company</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td style={{ padding: '10px 18px' }}>{booking.user}</td>
                <td style={{ padding: '10px 18px' }}>{booking.pickupCity || '-'}</td>
                <td style={{ padding: '10px 18px' }}>{booking.destination || '-'}</td>
                <td style={{ padding: '10px 18px' }}>{booking.email || '-'}</td>
                <td style={{ padding: '10px 18px' }}>{booking.phone || '-'}</td>
                <td style={{ padding: '10px 18px' }}>{booking.date || '-'}</td>
                <td style={{ padding: '10px 18px' }}>{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '-'}</td>
                <td style={{ padding: '10px 18px' }}>{booking.company || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPanel;
