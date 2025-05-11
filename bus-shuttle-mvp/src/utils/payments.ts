// Stub for payment processing (Stripe/PayPal)
export async function processPayment({ amount, method }: {
  amount: number;
  method: 'stripe' | 'paypal';
}) {
  // Simulate payment processing
  return Promise.resolve({ success: true, transactionId: 'demo-tx-123' });
}
