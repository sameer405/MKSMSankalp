import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = requireAdmin(request);

    logger.info('Fetching failed syncs', {
      adminEmail: admin.email,
    });

    // Fetch entries that failed to sync
    const { data: entries, error } = await supabase
      .from('practice_entries')
      .select(`
        *,
        user:users(*)
      `)
      .eq('synced', false)
      .order('sync_attempts', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Database error fetching failed syncs', {
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info('Failed syncs fetched successfully', {
      count: entries?.length || 0,
    });

    return NextResponse.json({
      entries: entries?.map((entry: any) => ({
        id: entry.id,
        entryClientId: entry.entry_client_id,
        regNo: entry.reg_no,
        date: entry.date,
        minutes: entry.minutes,
        synced: entry.synced,
        syncAttempts: entry.sync_attempts,
        lastSyncError: entry.last_sync_error,
        createdAt: entry.created_at,
        user: entry.user ? {
          firstName: entry.user.first_name,
          lastName: entry.user.last_name,
          email: entry.user.email,
        } : null,
      })) || [],
      summary: {
        total: entries?.length || 0,
        neverAttempted: entries?.filter((e: any) => e.sync_attempts === 0).length || 0,
        failedRetries: entries?.filter((e: any) => e.sync_attempts > 0).length || 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

