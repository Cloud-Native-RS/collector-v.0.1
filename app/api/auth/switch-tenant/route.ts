import { NextRequest, NextResponse } from 'next/server';

const REGISTRY_SERVICE_URL = process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.tenantId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId is required',
          message: 'Please provide tenantId'
        },
        { status: 400 }
      );
    }

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const tokenFromCookie = request.cookies.get('token')?.value;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'Authentication token required'
        },
        { status: 401 }
      );
    }

    // Forward request to registry service
    const registryResponse = await fetch(`${REGISTRY_SERVICE_URL}/api/auth/switch-tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenantId: body.tenantId,
      }),
    });

    const data = await registryResponse.json().catch(() => ({}));

    if (!registryResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Failed to switch tenant',
          message: data.message || `HTTP ${registryResponse.status}: ${registryResponse.statusText}`
        },
        { status: registryResponse.status }
      );
    }

    // Extract new access token from response
    const authData = data.data || data;
    const newAccessToken = authData.accessToken;

    if (!newAccessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response from authentication service',
          message: 'New access token not provided'
        },
        { status: 500 }
      );
    }

    // Set new token cookie for middleware authentication
    const nextResponse = NextResponse.json({
      success: true,
      ...data,
    }, { status: 200 });

    // Update token cookie
    nextResponse.cookies.set('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return nextResponse;
  } catch (error: any) {
    console.error('Switch tenant API error:', error);
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

