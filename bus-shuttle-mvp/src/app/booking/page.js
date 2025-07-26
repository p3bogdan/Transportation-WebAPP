"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BookingForm from "../../components/BookingForm";

function BookingContent() {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [route, setRoute] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to get route data from URL params or localStorage
    const routeId = searchParams.get('routeId');
    if (routeId) {
      // In a real app, you'd fetch the route by ID
      // For now, create a mock route
      setRoute({
        id: routeId,
        origin: "Bucharest",
        destination: "Vienna", 
        price: 45,
        departure: "2024-01-20",
        provider: "Sample Provider"
      });
    }
  }, [searchParams]);

  const handleNext = (data) => {
    setBookingData({ ...bookingData, ...data });
    setStep(step + 1);
  };

  const handleConfirm = () => {
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div style={{ background: "#fff", padding: 40, borderRadius: 16, boxShadow: "0 2px 12px #0002" }}>
        <h2>Booking Confirmed!</h2>
        <p>Your booking reference: <b>#DEMO1234</b></p>
      </div>
    );
  }

  if (!route) {
    return <div>Loading route information...</div>;
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", paddingTop: 40 }}>
      <h2 style={{ color: "#1746d3", fontSize: 28, marginBottom: 24 }}>Book Your Trip</h2>
      <div style={{ marginBottom: 24 }}>Step {step} of 2</div>
      <BookingForm route={route} onConfirm={handleConfirm} />
    </div>
  );
}

export default function BookingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f3f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Suspense fallback={<div>Loading booking form...</div>}>
        <BookingContent />
      </Suspense>
    </main>
  );
}
