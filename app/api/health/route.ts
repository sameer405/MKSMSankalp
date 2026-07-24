import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// TEMP: intentional type error to trigger a Vercel build failure (see commit msg).
const __buildCanary: number = 'break-the-build';

export async function GET() {
  try {
    // Test Supabase connectivity
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      logger.error('Health check failed - Supabase connection error', {
        error: error.message,
      });

      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Database connection failed',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational',
      },
    });
  } catch (error) {
    logger.error('Health check failed - Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Unexpected error',
      },
      { status: 503 }
    );
  }
}

