import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';

const LOG_FILE = '/tmp/collector-auth-debug.log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const logs = fs.readFileSync(LOG_FILE, 'utf-8');
      const logLines = logs.split('\n').filter(line => line.trim());
      const parsedLogs = logLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return line;
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        logs: parsedLogs,
        count: parsedLogs.length
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        logs: [],
        count: 0,
        message: 'Log file does not exist yet'
      });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

