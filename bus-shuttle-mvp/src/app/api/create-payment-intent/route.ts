import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const { amount, currency } = await req.json();
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create PaymentIntent' }, { status: 500 });
  }
}
