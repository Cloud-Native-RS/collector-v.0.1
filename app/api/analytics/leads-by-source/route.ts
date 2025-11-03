import { NextRequest, NextResponse } from "next/server";

const CRM_SERVICE_URL = 
  process.env.NEXT_PUBLIC_CRM_SERVICE_URL || 
  process.env.CRM_SERVICE_URL || 
  'http://localhost:3009';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string = 'GET'
) {
  try {
    const authHeader = request.headers.get('authorization');
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';

    const url = new URL(`${CRM_SERVICE_URL}${path}`);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
      method,
      headers,
    };

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
    console.error('Analytics leads-by-source API proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to CRM service',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/api/analytics/leads-by-source');
}

