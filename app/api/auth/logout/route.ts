import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Logout je jednostavno - samo očistimo client-side storage
    // Backend JWT token ne može biti "invalidiran" bez blacklist sistema
    // Ali možemo dodati logiku za invalidaciju ako je potrebno u budućnosti
    
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    }, { status: 200 });

    // Clear token cookie
    response.cookies.delete('token');

    return response;
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to logout',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

