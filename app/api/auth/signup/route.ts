import { NextRequest, NextResponse } from 'next/server';

const REGISTRY_SERVICE_URL = process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email, password, and name are required',
          message: 'Please provide email, password, and name'
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must be at least 8 characters long',
          message: 'Password is too short'
        },
        { status: 400 }
      );
    }

    // Forward request to registry service
    const response = await fetch(`${REGISTRY_SERVICE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        name: body.name,
        avatar: body.avatar,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Signup failed',
          message: data.message || `HTTP ${response.status}: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      ...data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup API error:', error);
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

