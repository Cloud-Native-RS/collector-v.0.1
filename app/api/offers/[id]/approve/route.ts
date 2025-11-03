import { NextRequest, NextResponse } from "next/server";

const OFFERS_SERVICE_URL = 
  process.env.NEXT_PUBLIC_OFFERS_SERVICE_URL || 
  process.env.OFFERS_SERVICE_URL || 
  'http://localhost:3004';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function proxyRequest(request: NextRequest, offerId: string, body?: any) {
  try {
    const token = request.headers.get('authorization') || '';
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';

    const url = new URL(`${OFFERS_SERVICE_URL}/api/offers/${offerId}/approve`);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };

    if (token) {
      headers['Authorization'] = token;
    }

    const options: RequestInit = {
      method: 'POST',
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

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
    console.error('Offers approve API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to offers service',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return proxyRequest(request, id, body);
}

