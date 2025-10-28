import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { syncEntryToAirtable, updateAirtableRecord } from '@/lib/airtable';
import { PracticeEntryWithUser } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = requireAdmin(request);

    const body = await request.json();
    const { entryIds } = body;

    // Validate input
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      throw new Error('entryIds must be a non-empty array');
    }

    logger.info('Manual resync triggered', {
      adminEmail: admin.email,
      entryCount: entryIds.length,
    });

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as Array<{ entryId: string; error: string }>,
    };

    const concurrency = parseInt(
      process.env.SYNC_WORKER_CONCURRENCY || '5',
      10
    );

    // Process entries with concurrency control
    for (let i = 0; i < entryIds.length; i += concurrency) {
      const batch = entryIds.slice(i, i + concurrency);

      await Promise.all(
        batch.map(async (entryId) => {
          try {
            // Fetch entry with user data
            const { data: entry, error: fetchError } = await supabase
              .from('practice_entries')
              .select(`
                *,
                user:users(*)
              `)
              .eq('id', entryId)
              .single();

            if (fetchError || !entry || !entry.user) {
              throw new Error('Entry not found or missing user data');
            }

            const entryWithUser: PracticeEntryWithUser = {
              ...entry,
              user: Array.isArray(entry.user) ? entry.user[0] : entry.user,
            };

            let airtableRecordId = entry.airtable_record_id;

            // Sync to Airtable
            if (airtableRecordId) {
              // Update existing record
              await updateAirtableRecord(airtableRecordId, entryWithUser);
            } else {
              // Create new record
              airtableRecordId = await syncEntryToAirtable(entryWithUser);
            }

            // Update Supabase with success
            await supabase
              .from('practice_entries')
              .update({
                synced: true,
                airtable_record_id: airtableRecordId,
                last_sync_error: null,
              })
              .eq('id', entryId);

            results.synced++;
            logger.info('Entry synced successfully', { entryId });
          } catch (error) {
            results.failed++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            results.errors.push({
              entryId,
              error: errorMessage,
            });

            // Update sync attempts and error
            await supabase
              .from('practice_entries')
              .update({
                sync_attempts: supabase.rpc('increment', { x: 1 }),
                last_sync_error: errorMessage,
              })
              .eq('id', entryId);

            logger.error('Entry sync failed', {
              entryId,
              error: errorMessage,
            });
          }
        })
      );
    }

    logger.info('Resync completed', {
      adminEmail: admin.email,
      synced: results.synced,
      failed: results.failed,
    });

    return NextResponse.json({
      message: 'Resync completed',
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

