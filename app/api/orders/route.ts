import { NextRequest, NextResponse } from "next/server";

// Get orders service URL - prefer NEXT_PUBLIC_ for client, but fallback to server env var
const ORDERS_SERVICE_URL = 
  process.env.NEXT_PUBLIC_ORDERS_SERVICE_URL || 
  process.env.ORDERS_SERVICE_URL || 
  'http://localhost:3002';

// Export runtime config to ensure route is properly registered
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string = 'GET',
  body?: any
) {
  try {
    // Get authorization header - it should already include "Bearer " prefix from client
    const authHeader = request.headers.get('authorization');
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';

    const url = new URL(`${ORDERS_SERVICE_URL}${path}`);
    
    // Copy query parameters from request
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };

    // Preserve the full Authorization header (should include "Bearer " prefix)
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    console.log('Proxying request to:', url.toString());
    const response = await fetch(url.toString(), options);
    
    let data: any = {};
    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch {
      // If response is not JSON, that's okay
    }

    console.log('Orders service response:', { status: response.status, statusText: response.statusText, hasData: !!data });

    if (!response.ok) {
      console.error('Orders service error:', { status: response.status, data });
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Request failed',
          message: data.message || `HTTP ${response.status}: ${response.statusText}`,
          details: response.status === 404 ? 'Orders service endpoint not found. Please check if the service is running and the route exists.' : undefined
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Orders API proxy error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Check if it's a fetch error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Network error',
          message: `Failed to connect to orders service at ${ORDERS_SERVICE_URL}. Please ensure the service is running.`,
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to orders service',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('✅ /api/orders GET handler called');
  const ordersServiceUrl = process.env.NEXT_PUBLIC_ORDERS_SERVICE_URL || 'http://localhost:3002';
  console.log('ORDERS_SERVICE_URL:', ordersServiceUrl);
  console.log('Request URL:', request.url);
  console.log('Query params:', Object.fromEntries(request.nextUrl.searchParams));
  
  try {
    return await proxyRequest(request, '/api/orders');
  } catch (error: any) {
    console.error('GET /api/orders error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, '/api/orders', 'POST', body);
}

