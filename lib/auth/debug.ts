/**
 * Debug utilities for authentication
 */

const MAX_LOGS = 100; // Keep last 100 logs

function writeLog(level: 'INFO' | 'ERROR' | 'WARN', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone to avoid circular references
  };
  
  // Write to console
  const consoleMessage = `[AUTH DEBUG] [${timestamp}] [${level}] ${message}`;
  if (level === 'ERROR') {
    console.error(consoleMessage, data || '');
  } else if (level === 'WARN') {
    console.warn(consoleMessage, data || '');
  } else {
    console.log(consoleMessage, data || '');
  }
  
  // Store in localStorage for debugging (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const existingLogs = localStorage.getItem('auth_debug_logs');
      let logs: any[] = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(logEntry);
      
      // Keep only last MAX_LOGS entries
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(-MAX_LOGS);
      }
      
      localStorage.setItem('auth_debug_logs', JSON.stringify(logs));
      localStorage.setItem('auth_debug_last_log', JSON.stringify(logEntry));
    } catch (e) {
      // If localStorage is full, just skip storing
      console.warn('[AUTH DEBUG] Failed to store log in localStorage:', e);
    }
    
    // Also try to send to API endpoint for server-side logging
    try {
      fetch('/api/auth/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      }).catch(() => {
        // Ignore API errors - logging shouldn't break the app
      });
    } catch (e) {
      // Ignore fetch errors
    }
  }
}

export function logAuth(message: string, data?: any) {
  writeLog('INFO', message, data);
}

export function logAuthError(message: string, error?: any) {
  writeLog('ERROR', message, error);
}

export function logAuthWarn(message: string, data?: any) {
  writeLog('WARN', message, data);
}

