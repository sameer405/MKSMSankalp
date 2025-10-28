import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { rateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { validateRegNo, validateEmail } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regNo, email } = body;

    // Validate inputs
    validateRegNo(regNo);
    validateEmail(email);

    // Check rate limit by reg_no
    rateLimiter.checkRateLimit(regNo);

    logger.info('User login attempt', { regNo, email });

    // Find user by regNo and email (both must match)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('reg_no', regNo)
      .eq('email', email)
      .single();

    if (error || !user) {
      logger.warn('Login failed - invalid credentials', {
        regNo,
        email,
        error: error?.message,
      });

      // Generic error message to prevent user enumeration
      return NextResponse.json(
        {
          error: 'Invalid registration number or email',
          type: 'auth_error',
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      sub: user.id,
      reg_no: user.reg_no,
      email: user.email,
    });

    logger.info('User logged in successfully', {
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

