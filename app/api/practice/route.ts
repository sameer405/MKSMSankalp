import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import {
  validateEntryClientId,
  validateDate,
  validateMinutes,
  validatePracticeText,
  validateSankalpWord,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = requireAuth(request);

    const body = await request.json();
    const { entryClientId, date, minutes, practiceText, sankalpWord } = body;

    // Validate inputs
    validateEntryClientId(entryClientId);
    validateDate(date);
    validateMinutes(minutes);
    validatePracticeText(practiceText);
    validateSankalpWord(sankalpWord);

    // Check rate limit
    rateLimiter.checkRateLimit(user.reg_no);

    logger.info('Practice entry creation attempt', {
      userId: user.sub,
      regNo: user.reg_no,
      entryClientId,
      date,
    });

    // Insert practice entry (idempotent via entry_client_id unique constraint)
    const { data: entry, error } = await supabase
      .from('practice_entries')
      .insert({
        entry_client_id: entryClientId,
        user_id: user.sub,
        reg_no: user.reg_no,
        date,
        minutes,
        practice_text: practiceText || null,
        sankalp_word: sankalpWord || null,
        synced: false,
        sync_attempts: 0,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate entry)
      if (error.code === '23505') {
        logger.info('Duplicate entry detected, returning existing entry', {
          entryClientId,
        });

        // Fetch and return the existing entry
        const { data: existingEntry, error: fetchError } = await supabase
          .from('practice_entries')
          .select('*')
          .eq('entry_client_id', entryClientId)
          .single();

        if (fetchError || !existingEntry) {
          throw new Error('Failed to fetch existing entry');
        }

        return NextResponse.json(
          {
            entry: {
              id: existingEntry.id,
              entryClientId: existingEntry.entry_client_id,
              userId: existingEntry.user_id,
              regNo: existingEntry.reg_no,
              date: existingEntry.date,
              minutes: existingEntry.minutes,
              practiceText: existingEntry.practice_text,
              sankalpWord: existingEntry.sankalp_word,
              synced: existingEntry.synced,
              createdAt: existingEntry.created_at,
            },
            message: 'Entry already exists',
          },
          { status: 200 }
        );
      }

      logger.error('Database error during entry creation', {
        userId: user.sub,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info('Practice entry created successfully', {
      entryId: entry.id,
      userId: user.sub,
      regNo: user.reg_no,
    });

    return NextResponse.json(
      {
        entry: {
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
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

