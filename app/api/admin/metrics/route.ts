import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = requireAdmin(request);

    logger.info('Fetching metrics', {
      adminEmail: admin.email,
    });

    // Get total entries count
    const { count: totalEntries, error: totalError } = await supabase
      .from('practice_entries')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw new Error(`Failed to count total entries: ${totalError.message}`);
    }

    // Get synced entries count
    const { count: syncedEntries, error: syncedError } = await supabase
      .from('practice_entries')
      .select('*', { count: 'exact', head: true })
      .eq('synced', true);

    if (syncedError) {
      throw new Error(`Failed to count synced entries: ${syncedError.message}`);
    }

    // Get queued entries count (never attempted)
    const { count: queuedEntries, error: queuedError } = await supabase
      .from('practice_entries')
      .select('*', { count: 'exact', head: true })
      .eq('synced', false)
      .eq('sync_attempts', 0);

    if (queuedError) {
      throw new Error(`Failed to count queued entries: ${queuedError.message}`);
    }

    // Get failed entries count (attempted but failed)
    const { count: failedEntries, error: failedError } = await supabase
      .from('practice_entries')
      .select('*', { count: 'exact', head: true })
      .eq('synced', false)
      .gt('sync_attempts', 0);

    if (failedError) {
      throw new Error(`Failed to count failed entries: ${failedError.message}`);
    }

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      throw new Error(`Failed to count users: ${usersError.message}`);
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentEntries, error: recentError } = await supabase
      .from('practice_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      throw new Error(`Failed to count recent entries: ${recentError.message}`);
    }

    logger.info('Metrics fetched successfully', {
      totalEntries: totalEntries || 0,
    });

    return NextResponse.json({
      entries: {
        total: totalEntries || 0,
        synced: syncedEntries || 0,
        queued: queuedEntries || 0,
        failed: failedEntries || 0,
        recentActivity: recentEntries || 0,
      },
      users: {
        total: totalUsers || 0,
      },
      syncRate: totalEntries
        ? ((syncedEntries || 0) / totalEntries) * 100
        : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

