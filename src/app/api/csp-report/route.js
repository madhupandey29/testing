import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const report = await request.json();
    
    // Log CSP violations in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('CSP Violation:', report);
    }
    
    // In production, you might want to send this to a monitoring service
    // like Sentry, LogRocket, etc.
    
    return NextResponse.json({ status: 'received' });
  } catch (error) {
    console.error('CSP report error:', error);
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  }
}