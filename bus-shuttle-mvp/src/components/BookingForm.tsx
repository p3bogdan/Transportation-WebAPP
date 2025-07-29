import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { signIn } from 'next-auth/react';

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
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const BookingForm: React.FC<BookingFormProps> = ({ route, onConfirm }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [password, setPassword] = useState('');
  const [cardPaid, setCardPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
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
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Check if user exists
      const checkRes = await fetch(`/api/auth/check-user?email=${encodeURIComponent(email)}`);
      const { exists } = await checkRes.json();
      
      if (exists) {
        setIsNewUser(false);
        setShowPasswordPrompt(true);
        setAuthError('Account already exists, please log in.');
      } else {
        setIsNewUser(true);
        setShowPasswordPrompt(true);
        setAuthError(null);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    
    try {
      if (isNewUser) {
        // Register user
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone }),
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Registration failed');
        }
        
        // Don't use signIn for booking flow - just complete the booking directly
        console.log('User registered successfully, proceeding with booking');
      } else {
        // For existing users, verify password manually without signIn redirect
        const loginRes = await fetch('/api/auth/login-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        if (!loginRes.ok) {
          throw new Error('Invalid email or password');
        }
        
        console.log('User verified successfully, proceeding with booking');
      }
      
      // Complete booking after successful authentication (without redirect)
      setShowPasswordPrompt(false);
      setPassword('');
      await completeBooking();
      
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const completeBooking = async () => {
    if (paymentMethod === 'card') return; // Stripe handles card booking
    
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
    }
  };

  const handleCancelAuth = () => {
    setShowPasswordPrompt(false);
    setPassword('');
    setAuthError(null);
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
          disabled={showPasswordPrompt}
        />
        {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={showPasswordPrompt}
        />
        {errors.email && <span style={{ color: 'red' }}>{errors.email}</span>}
        
        <input
          type="tel"
          placeholder="Phone (e.g. +40712345678)"
          value={phone}
          maxLength={16}
          onChange={e => setPhone(e.target.value)}
          required
          disabled={showPasswordPrompt}
        />
        {errors.phone && <span style={{ color: 'red' }}>{errors.phone}</span>}
        
        <input
          type="text"
          placeholder="Pickup Address"
          value={pickupAddress}
          maxLength={90}
          onChange={e => setPickupAddress(e.target.value)}
          required
          disabled={showPasswordPrompt}
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
              disabled={showPasswordPrompt}
            />
            Pay with Cash
          </label>
          <label style={{ marginLeft: 16 }}>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              disabled={showPasswordPrompt}
            />
            Pay with Card
          </label>
        </div>

        {/* Password Prompt Section */}
        {showPasswordPrompt && (
          <div style={{ 
            border: '2px solid #1976d2', 
            borderRadius: 8, 
            padding: 16, 
            marginTop: 16, 
            backgroundColor: '#f8f9fa' 
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>
              {isNewUser ? 'Create Account' : 'Login Required'}
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
              {isNewUser 
                ? 'Set a password to create your account and complete booking' 
                : 'Enter your password to login and complete booking'
              }
            </p>
            {/* Removed nested form - just use div with buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && password.length >= 6) {
                    handlePasswordSubmit(e);
                  }
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button"
                  onClick={handlePasswordSubmit}
                  disabled={submitting || !password}
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#1976d2', 
                    color: 'white', 
                    border: 'none', 
                    padding: 8, 
                    borderRadius: 4,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Processing...' : (isNewUser ? 'Register & Book' : 'Login & Book')}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelAuth}
                  style={{ 
                    backgroundColor: '#666', 
                    color: 'white', 
                    border: 'none', 
                    padding: 8, 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
            {authError && <div style={{ color: 'red', marginTop: 8, fontSize: '14px' }}>{authError}</div>}
          </div>
        )}

        {/* Regular booking button for when no password prompt is shown */}
        {!showPasswordPrompt && paymentMethod === 'cash' && (
          <button type="submit" disabled={submitting}>
            {submitting ? 'Checking...' : 'Continue to Book'}
          </button>
        )}
        
        {!showPasswordPrompt && paymentMethod === 'card' && (
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
              requireAuth={true}
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
        <p><strong>Route:</strong> {route.departure} → {route.arrival}</p>
        <p><strong>Price:</strong> €{route.price}</p>
        <p><strong>Date & Time:</strong> {route.departureTime ? new Date(route.departureTime).toLocaleString() : 'TBD'}</p>
        <p><strong>Company:</strong> {route.provider}</p>
        <p><strong>Vehicle:</strong> {route.vehicleType || 'Bus'}</p>
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
  requireAuth?: boolean;
}> = ({ name, email, phone, pickupAddress, route, submitting, setSubmitting, setCardPaid, setSubmitError, onConfirm, requireAuth = false }) => {
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
      // If authentication is required, handle it first
      if (requireAuth) {
        // Check if user exists and handle auth flow
        const checkRes = await fetch(`/api/auth/check-user?email=${encodeURIComponent(email)}`);
        const { exists } = await checkRes.json();
        
        // This would need to be handled differently for card payments
        // For now, we'll proceed with the payment and let the booking API handle user creation
      }
      
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
