import { createWriteStream } from 'fs';
import { join } from 'path';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, metadata?: any): string {
    const timestamp = this.getTimestamp();
    const meta = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level}] ${message}${meta}\n`;
  }

  private writeToFile(message: string) {
    const logFile = join(process.cwd(), 'logs', 'app.log');
    // In production, would use proper logging library like winston
    console.log(message.trim());
  }

  info(message: string, metadata?: any) {
    const formatted = this.formatMessage('INFO', message, metadata);
    this.writeToFile(formatted);
  }

  warn(message: string, metadata?: any) {
    const formatted = this.formatMessage('WARN', message, metadata);
    this.writeToFile(formatted);
  }

  error(message: string, error?: Error | any) {
    const metadata = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    const formatted = this.formatMessage('ERROR', message, metadata);
    this.writeToFile(formatted);
  }

  debug(message: string, metadata?: any) {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = this.formatMessage('DEBUG', message, metadata);
      this.writeToFile(formatted);
    }
  }
}

export const logger = new Logger();

