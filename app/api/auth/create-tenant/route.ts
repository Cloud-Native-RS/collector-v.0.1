import { NextRequest, NextResponse } from 'next/server';

const REGISTRY_SERVICE_URL = process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Create Tenant API] Request body:', body);
    
    // Validate request body
    if (!body.displayName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'displayName is required',
          message: 'Please provide displayName'
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
      console.error('[Create Tenant API] No token found');
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
    console.log('[Create Tenant API] Calling registry service:', `${REGISTRY_SERVICE_URL}/api/auth/create-tenant`);
    console.log('[Create Tenant API] Request payload:', { displayName: body.displayName, name: body.name });
    
    let registryResponse;
    try {
      registryResponse = await fetch(`${REGISTRY_SERVICE_URL}/api/auth/create-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: body.displayName,
          name: body.name,
        }),
      });
    } catch (fetchError: any) {
      console.error('[Create Tenant API] Failed to connect to registry service:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to registry service',
          message: `Cannot reach registry service at ${REGISTRY_SERVICE_URL}. Please ensure the service is running.`,
          details: fetchError.message
        },
        { status: 503 }
      );
    }

    let data;
    try {
      const text = await registryResponse.text();
      console.log('[Create Tenant API] Raw response text:', text);
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[Create Tenant API] Failed to parse response:', parseErr);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response from registry service',
          message: 'Registry service returned invalid JSON response'
        },
        { status: 500 }
      );
    }

    console.log('[Create Tenant API] Registry service response:', {
      status: registryResponse.status,
      ok: registryResponse.ok,
      data
    });

    if (!registryResponse.ok) {
      // Backend error handler returns: { success: false, error: { message, statusCode } }
      const errorMessage = data.error?.message || data.error || data.message || 'Failed to create company';
      console.error('[Create Tenant API] Error from registry service:', errorMessage);
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          message: errorMessage
        },
        { status: registryResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Tenant API] Unexpected error:', error);
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

