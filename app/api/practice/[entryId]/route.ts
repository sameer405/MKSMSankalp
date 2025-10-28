import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { handleApiError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  validateMinutes,
  validatePracticeText,
  validateSankalpWord,
} from '@/lib/validation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    // Authenticate user
    const user = requireAuth(request);

    const { entryId } = await params;
    const body = await request.json();
    const { minutes, practiceText, sankalpWord } = body;

    // Validate inputs if provided
    if (minutes !== undefined) validateMinutes(minutes);
    if (practiceText !== undefined) validatePracticeText(practiceText);
    if (sankalpWord !== undefined) validateSankalpWord(sankalpWord);

    logger.info('Practice entry update attempt', {
      entryId,
      userId: user.sub,
    });

    // Fetch existing entry to verify ownership
    const { data: existingEntry, error: fetchError } = await supabase
      .from('practice_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError || !existingEntry) {
      throw new NotFoundError('Practice entry not found');
    }

    // Verify ownership
    if (existingEntry.user_id !== user.sub) {
      throw new ForbiddenError('You do not have permission to edit this entry');
    }

    // Build update object
    const updates: Record<string, unknown> = {
      synced: false, // Mark as unsynced for Airtable update
    };

    if (minutes !== undefined) updates.minutes = minutes;
    if (practiceText !== undefined) updates.practice_text = practiceText;
    if (sankalpWord !== undefined) updates.sankalp_word = sankalpWord;

    // Update entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('practice_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      logger.error('Database error during entry update', {
        entryId,
        error: updateError.message,
      });
      throw new Error(`Database error: ${updateError.message}`);
    }

    logger.info('Practice entry updated successfully', {
      entryId,
      userId: user.sub,
    });

    return NextResponse.json({
      entry: {
        id: updatedEntry.id,
        entryClientId: updatedEntry.entry_client_id,
        userId: updatedEntry.user_id,
        regNo: updatedEntry.reg_no,
        date: updatedEntry.date,
        minutes: updatedEntry.minutes,
        practiceText: updatedEntry.practice_text,
        sankalpWord: updatedEntry.sankalp_word,
        synced: updatedEntry.synced,
        updatedAt: updatedEntry.updated_at,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    // Authenticate user
    const user = requireAuth(request);

    const { entryId } = await params;

    logger.info('Practice entry deletion attempt', {
      entryId,
      userId: user.sub,
    });

    // Fetch existing entry to verify ownership
    const { data: existingEntry, error: fetchError } = await supabase
      .from('practice_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError || !existingEntry) {
      throw new NotFoundError('Practice entry not found');
    }

    // Verify ownership
    if (existingEntry.user_id !== user.sub) {
      throw new ForbiddenError('You do not have permission to delete this entry');
    }

    // Hard delete the entry (alternatively, implement soft delete)
    const { error: deleteError } = await supabase
      .from('practice_entries')
      .delete()
      .eq('id', entryId);

    if (deleteError) {
      logger.error('Database error during entry deletion', {
        entryId,
        error: deleteError.message,
      });
      throw new Error(`Database error: ${deleteError.message}`);
    }

    // If Airtable record exists, mark as deleted
    // This will be handled by admin resync if needed

    logger.info('Practice entry deleted successfully', {
      entryId,
      userId: user.sub,
    });

    return NextResponse.json({
      message: 'Entry deleted successfully',
      entryId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

