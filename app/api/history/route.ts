import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = requireAuth(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate pagination parameters
    if (limit < 1 || limit > 200) {
      throw new Error('Limit must be between 1 and 200');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    logger.info('Fetching practice history', {
      userId: user.sub,
      regNo: user.reg_no,
      limit,
      offset,
    });

    // Fetch practice entries for user
    const { data: entries, error, count } = await supabase
      .from('practice_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', user.sub)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Database error during history fetch', {
        userId: user.sub,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info('Practice history fetched successfully', {
      userId: user.sub,
      count: entries?.length || 0,
    });

    return NextResponse.json({
      entries: entries?.map((entry) => ({
        id: entry.id,
        entryClientId: entry.entry_client_id,
        userId: entry.user_id,
        regNo: entry.reg_no,
        date: entry.date,
        minutes: entry.minutes,
        practiceText: entry.practice_text,
        sankalpWord: entry.sankalp_word,
        synced: entry.synced,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      })) || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

