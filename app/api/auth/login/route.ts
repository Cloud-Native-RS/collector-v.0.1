import { NextRequest, NextResponse } from 'next/server';

const REGISTRY_SERVICE_URL = process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.email || !body.password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required',
          message: 'Please provide both email and password'
        },
        { status: 400 }
      );
    }

    // Forward request to registry service
    const registryResponse = await fetch(`${REGISTRY_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    const data = await registryResponse.json().catch(() => ({}));

    if (!registryResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Login failed',
          message: data.message || `HTTP ${registryResponse.status}: ${registryResponse.statusText}`
        },
        { status: registryResponse.status }
      );
    }

    // Set token cookie for middleware authentication
    const nextResponse = NextResponse.json({
      success: true,
      ...data,
    }, { status: 200 });

    // Extract access token from response
    const authData = data.data || data;
    const accessToken = authData.accessToken;

    if (accessToken) {
      // Set httpOnly cookie for server-side authentication checks
      nextResponse.cookies.set('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to authentication service',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

