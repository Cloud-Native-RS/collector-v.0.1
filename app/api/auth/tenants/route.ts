import { NextRequest, NextResponse } from 'next/server';

const REGISTRY_SERVICE_URL = process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
    const registryResponse = await fetch(`${REGISTRY_SERVICE_URL}/api/auth/tenants`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await registryResponse.json().catch(() => ({}));

    if (!registryResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Failed to get tenants',
          message: data.message || `HTTP ${registryResponse.status}: ${registryResponse.statusText}`
        },
        { status: registryResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Get tenants API error:', error);
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

