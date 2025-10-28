// Structured logging utility
type LogLevel = 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: metadata?.traceId || this.generateTraceId(),
      ...metadata,
    };

    // Output as JSON to stdout (captured by Vercel)
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata);
  }
}

// Export singleton instance
export const logger = new Logger();

