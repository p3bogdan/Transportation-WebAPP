import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useSession } from 'next-auth/react';

interface Route {
  id?: number;
  departure: string;
  arrival: string;
  departureTime?: string;
  arrivalTime?: string;
  price: number;
  provider: string;
  vehicleType?: string;
  seats?: number;
}

interface BookingFormProps {
  route: Route;
  onConfirm: (data: { name: string; email: string; phone: string; pickupAddress: string; paymentMethod: string }) => void;
  isGuest?: boolean;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const BookingForm: React.FC<BookingFormProps> = ({ route, onConfirm, isGuest = false }) => {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
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
    
    if (paymentMethod === 'card') return; // Let Stripe handle card payments
    
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
          route: {
            id: route.id,
            departure: route.departure,
            arrival: route.arrival,
            departureTime: route.departureTime,
            price: route.price,
            provider: route.provider,
            vehicleType: route.vehicleType,
            seats: route.seats
          },
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      const bookingData = await res.json();
      console.log('Booking created successfully:', bookingData);
      
      onConfirm({ name, email, phone, pickupAddress, paymentMethod });
    } catch (err: any) {
      console.error('Booking error:', err);
      setSubmitError(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 300 }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Booking Information</h3>
        
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          maxLength={60}
          onChange={e => setName(e.target.value)}
          required
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {errors.name && <span style={{ color: 'red', fontSize: 12 }}>{errors.name}</span>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={!!session?.user?.email}
          style={{ 
            padding: 8, 
            borderRadius: 4, 
            border: '1px solid #ccc',
            backgroundColor: session?.user?.email ? '#f5f5f5' : 'white'
          }}
        />
        {errors.email && <span style={{ color: 'red', fontSize: 12 }}>{errors.email}</span>}
        
        <input
          type="tel"
          placeholder="Phone (e.g. +40712345678)"
          value={phone}
          maxLength={16}
          onChange={e => setPhone(e.target.value)}
          required
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {errors.phone && <span style={{ color: 'red', fontSize: 12 }}>{errors.phone}</span>}
        
        <input
          type="text"
          placeholder="Pickup Address"
          value={pickupAddress}
          maxLength={90}
          onChange={e => setPickupAddress(e.target.value)}
          required
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {errors.pickupAddress && <span style={{ color: 'red', fontSize: 12 }}>{errors.pickupAddress}</span>}
        
        <div style={{ margin: '16px 0' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333' }}>
            Payment Method:
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={() => setPaymentMethod('cash')}
              style={{ marginRight: 8 }}
            />
            Pay with Cash (on board)
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              style={{ marginRight: 8 }}
            />
            Pay with Card (online)
          </label>
        </div>

        {paymentMethod === 'cash' && (
          <button 
            type="submit" 
            disabled={submitting}
            style={{
              padding: 12,
              backgroundColor: submitting ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Processing...' : 'Complete Booking'}
          </button>
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
          <div style={{ color: 'green', marginTop: 8, fontWeight: 'bold' }}>
            Payment successful! Booking confirmed.
          </div>
        )}
        
        {submitError && (
          <div style={{ color: 'red', marginTop: 8, fontSize: 14, padding: 8, backgroundColor: '#ffebee', borderRadius: 4 }}>
            {submitError}
          </div>
        )}
      </form>
      
      <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, minWidth: 280, background: '#fafbfc', height: 'fit-content' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Booking Overview</h3>
        <div style={{ marginBottom: 12 }}>
          <strong>Route:</strong><br />
          <span style={{ color: '#1976d2', fontSize: 18 }}>{route.departure} → {route.arrival}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Price:</strong><br />
          <span style={{ color: '#28a745', fontSize: 20, fontWeight: 'bold' }}>€{route.price}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Date & Time:</strong><br />
          {route.departureTime ? new Date(route.departureTime).toLocaleString() : 'TBD'}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Company:</strong><br />
          {route.provider}
        </div>
        <div>
          <strong>Vehicle:</strong><br />
          {route.vehicleType || 'Bus'}
        </div>
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
