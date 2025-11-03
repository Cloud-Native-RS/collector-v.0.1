import { NextRequest, NextResponse } from 'next/server';

const REGISTRY_SERVICE_URL = process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'No valid authorization token provided'
        },
        { status: 401 }
      );
    }

    const response = await fetch(`${REGISTRY_SERVICE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Failed to get user info',
          message: data.message || `HTTP ${response.status}: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Get profile API error:', error);
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

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'No valid authorization token provided'
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${REGISTRY_SERVICE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Failed to update profile',
          message: data.message || `HTTP ${response.status}: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data || data,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update profile API error:', error);
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

