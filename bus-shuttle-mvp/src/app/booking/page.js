import React, { useState } from "react";
import BookingForm from "../../components/BookingForm";

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({});
  const [confirmed, setConfirmed] = useState(false);

  const handleNext = (data) => {
    setBookingData({ ...bookingData, ...data });
    setStep(step + 1);
  };

  const handleConfirm = () => {
    // For MVP, just show confirmation
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", padding: 40, borderRadius: 16, boxShadow: "0 2px 12px #0002" }}>
          <h2>Booking Confirmed!</h2>
          <p>Your booking reference: <b>#DEMO1234</b></p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", paddingTop: 40 }}>
        <h2 style={{ color: "#1746d3", fontSize: 28, marginBottom: 24 }}>Book Your Trip</h2>
        <div style={{ marginBottom: 24 }}>Step {step} of 2</div>
        <BookingForm step={step} onNext={handleNext} onConfirm={handleConfirm} bookingData={bookingData} />
      </div>
    </main>
  );
}
