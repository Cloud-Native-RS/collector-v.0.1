import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = '/tmp/collector-auth-debug.log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const logEntry = await request.json();
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, logLine);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Don't fail if logging fails
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

