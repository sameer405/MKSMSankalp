import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import {
  validateRegNo,
  validateEmail,
  validateName,
  validateBatch,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regNo, firstName, lastName, email, batch } = body;

    // Validate inputs
    validateRegNo(regNo);
    validateEmail(email);
    validateName(firstName, 'First name');
    validateName(lastName, 'Last name');
    if (batch) validateBatch(batch);

    // Check rate limit by reg_no
    rateLimiter.checkRateLimit(regNo);

    logger.info('User registration attempt', { regNo, email });

    // Upsert user (insert or update if exists)
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          reg_no: regNo,
          first_name: firstName,
          last_name: lastName,
          email,
          batch: batch || null,
        },
        {
          onConflict: 'reg_no',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('Database error during registration', {
        regNo,
        error: error.message,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    // Generate JWT token
    const token = signToken({
      sub: user.id,
      reg_no: user.reg_no,
      email: user.email,
    });

    logger.info('User registered successfully', {
      userId: user.id,
      regNo: user.reg_no,
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          regNo: user.reg_no,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          batch: user.batch,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

