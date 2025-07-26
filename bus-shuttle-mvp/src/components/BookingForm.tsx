import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface Route {
  origin: string;
  destination: string;
  price: number;
  departure: string;
  provider: string;
}

interface BookingFormProps {
  route: Route;
  onConfirm: (data: { name: string; email: string; phone: string; pickupAddress: string; paymentMethod: string }) => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const BookingForm: React.FC<BookingFormProps> = ({ route, onConfirm }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardPaid, setCardPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; pickupAddress?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name || name.length > 60) newErrors.name = 'Name is required and must be ≤ 60 characters.';
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!phone || !/^\+\d{8,15}$/.test(phone)) newErrors.phone = 'Enter a valid international phone number (e.g. +40712345678).';
    if (!pickupAddress || pickupAddress.length > 90) newErrors.pickupAddress = 'Pickup city is required and must be ≤ 90 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (paymentMethod === 'card') return; // Stripe handles card submit
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          pickupAddress,
          paymentMethod,
          route,
        }),
      });
      if (!res.ok) throw new Error('Failed to create booking');
      onConfirm({ name, email, phone, pickupAddress, paymentMethod });
    } catch (err: any) {
      setSubmitError(err.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 300 }}>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          maxLength={60}
          onChange={e => setName(e.target.value)}
          required
        />
        {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {errors.email && <span style={{ color: 'red' }}>{errors.email}</span>}
        <input
          type="tel"
          placeholder="Phone (e.g. +40712345678)"
          value={phone}
          maxLength={16}
          onChange={e => setPhone(e.target.value)}
          required
        />
        {errors.phone && <span style={{ color: 'red' }}>{errors.phone}</span>}
        <input
          type="text"
          placeholder="Pickup Address"
          value={pickupAddress}
          maxLength={90}
          onChange={e => setPickupAddress(e.target.value)}
          required
        />
        {errors.pickupAddress && <span style={{ color: 'red' }}>{errors.pickupAddress}</span>}
        <div>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={() => setPaymentMethod('cash')}
            />
            Pay with Cash
          </label>
          <label style={{ marginLeft: 0 }}>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
            />
            Pay with Card
          </label>
        </div>
        {paymentMethod === 'cash' && (
          <button type="submit" disabled={submitting}>{submitting ? 'Booking...' : 'Confirm Booking'}</button>
        )}
        {paymentMethod === 'card' && (
          <Elements stripe={stripePromise}>
            <StripeCardSection
              name={name}
              email={email}
              phone={phone}
              pickupAddress={pickupAddress}
              route={route}
              submitting={submitting}
              setSubmitting={setSubmitting}
              setCardPaid={setCardPaid}
              setSubmitError={setSubmitError}
              onConfirm={onConfirm}
            />
          </Elements>
        )}
        {paymentMethod === 'card' && cardPaid && (
          <div style={{ color: 'green', marginTop: 8 }}>Payment successful! Booking confirmed.</div>
        )}
        {submitError && <div style={{ color: 'red', marginTop: 8 }}>{submitError}</div>}
      </form>
      <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, minWidth: 280, background: '#fafbfc' }}>
        <h3>Booking Overview</h3>
        <p><strong>Route:</strong> {route.origin} → {route.destination}</p>
        <p><strong>Price:</strong> €{route.price}</p>
        <p><strong>Date & Time:</strong> {new Date(route.departure).toLocaleString()}</p>
        <p><strong>Company:</strong> {route.provider}</p>
        <p><strong>Company Phone:</strong> 0123-456-789</p> {/* Replace with real phone if available */}
      </div>
    </div>
  );
};

const StripeCardSection: React.FC<{
  name: string;
  email: string;
  phone: string;
  pickupAddress: string;
  route: Route;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  setCardPaid: (v: boolean) => void;
  setSubmitError: (v: string | null) => void;
  onConfirm: (data: { name: string; email: string; phone: string; pickupAddress: string; paymentMethod: string }) => void;
}> = ({ name, email, phone, pickupAddress, route, submitting, setSubmitting, setCardPaid, setSubmitError, onConfirm }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleStripePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    if (!stripe || !elements) {
      setSubmitError('Stripe not loaded.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: route.price * 100, currency: 'eur' }),
      });
      const data = await res.json();
      if (!data.clientSecret) throw new Error('Failed to initialize payment.');
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found.');
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      });
      if (result.error) throw new Error(result.error.message || 'Payment failed.');
      if (result.paymentIntent?.status === 'succeeded') {
        await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            pickupAddress,
            paymentMethod: 'card',
            route,
            paymentStatus: result.paymentIntent.status,
          }),
        });
        setCardPaid(true);
        onConfirm({ name, email, phone, pickupAddress, paymentMethod: 'card' });
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CardElement options={{ hidePostalCode: true }} />
      <button
        type="button"
        disabled={submitting}
        style={{ marginTop: 12 }}
        onClick={handleStripePayment}
      >
        {submitting ? 'Processing...' : 'Pay Now'}
      </button>
    </>
  );
};

export default BookingForm;
