import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      userId: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId
    }, { status: 200 });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
