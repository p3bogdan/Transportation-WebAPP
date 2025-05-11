import React, { useState } from 'react';

interface BookingFormProps {
  routeId: string;
  onConfirm: (data: { name: string; email: string; phone: string }) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ routeId, onConfirm }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ name, email, phone });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="tel"
        placeholder="Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
      />
      <button type="submit">Confirm Booking</button>
    </form>
  );
};

export default BookingForm;
