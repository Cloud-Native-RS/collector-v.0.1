import { NextRequest, NextResponse } from "next/server";

const ORDERS_SERVICE_URL = process.env.NEXT_PUBLIC_ORDERS_SERVICE_URL || 'http://localhost:3002';

async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string = 'GET',
  body?: any
) {
  try {
    const token = request.headers.get('authorization') || '';
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';

    const url = new URL(`${ORDERS_SERVICE_URL}${path}`);

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

    const response = await fetch(url.toString(), options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || data.message || 'Request failed',
          message: data.message || `HTTP ${response.status}: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Orders API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to orders service',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(request, `/api/orders/${id}`);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, `/api/orders/${id}`, 'PUT', body);
}

