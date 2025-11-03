import { NextRequest, NextResponse } from 'next/server';

const INVENTORY_SERVICE_URL = 
  process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 
  process.env.INVENTORY_SERVICE_URL || 
  'http://localhost:3005';

export const dynamic = 'force-dynamic';

async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string = 'GET',
  body?: any
) {
  try {
    const token = request.headers.get('authorization') || '';
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';

    const url = new URL(`${INVENTORY_SERVICE_URL}${path}`);
    
    // Copy query parameters from request
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };

    if (token) {
      headers['Authorization'] = token;
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

    console.log('Inventory service response:', { status: response.status, statusText: response.statusText, hasData: !!data });

    if (!response.ok) {
      console.error('Inventory service error:', { status: response.status, data });
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Request failed',
          message: data.message || `HTTP ${response.status}: ${response.statusText}`,
          details: response.status === 404 ? 'Inventory service endpoint not found. Please check if the service is running and the route exists.' : undefined
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Inventory API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to inventory service',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('✅ /api/products GET handler called');
  const inventoryServiceUrl = process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 'http://localhost:3005';
  console.log('INVENTORY_SERVICE_URL:', inventoryServiceUrl);
  console.log('Request URL:', request.url);
  console.log('Query params:', Object.fromEntries(request.nextUrl.searchParams));
  console.log('Headers:', {
    'x-tenant-id': request.headers.get('x-tenant-id'),
    'authorization': request.headers.get('authorization') ? 'present' : 'missing'
  });
  
  try {
    return await proxyRequest(request, '/api/products');
  } catch (error: any) {
    console.error('GET /api/products error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, '/api/products', 'POST', body);
}

