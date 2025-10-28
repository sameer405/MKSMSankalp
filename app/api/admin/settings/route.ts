import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Get all settings
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = requireAdmin(request);

    logger.info('Fetching all settings', {
      adminEmail: admin.email,
    });

    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (error) {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return NextResponse.json({
      settings: settings?.map((setting) => ({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updatedBy: setting.updated_by,
        updatedAt: setting.updated_at,
      })) || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Update a setting
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = requireAdmin(request);

    const body = await request.json();
    const { key, value } = body;

    // Validate inputs
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Setting key is required');
    }

    if (value === undefined || value === null) {
      throw new ValidationError('Setting value is required');
    }

    // Special validation for target_practice_minutes
    if (key === 'target_practice_minutes') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue <= 0) {
        throw new ValidationError('Target practice minutes must be a positive number');
      }
    }

    logger.info('Updating setting', {
      adminEmail: admin.email,
      key,
      value,
    });

    // Update or insert the setting
    const { data: setting, error } = await supabase
      .from('settings')
      .upsert(
        {
          key,
          value: String(value),
          updated_by: admin.email,
        },
        {
          onConflict: 'key',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update setting: ${error.message}`);
    }

    logger.info('Setting updated successfully', {
      key: setting.key,
      value: setting.value,
    });

    return NextResponse.json({
      setting: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updatedBy: setting.updated_by,
        updatedAt: setting.updated_at,
      },
      message: 'Setting updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

