import { NextRequest, NextResponse } from "next/server";

const ORDERS_SERVICE_URL = process.env.NEXT_PUBLIC_ORDERS_SERVICE_URL || 'http://localhost:3002';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = request.headers.get('authorization') || '';
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    const body = await request.json().catch(() => ({}));

    const url = `${ORDERS_SERVICE_URL}/api/orders/${id}/payment`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };

    if (token) {
      headers['Authorization'] = token;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

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

