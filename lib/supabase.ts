import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    // Validate environment variables at runtime
    if (!process.env.SUPABASE_URL) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    // Create Supabase client with service role key for admin operations
    supabaseInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return supabaseInstance;
};

// Export a proxy that initializes on first use
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getSupabaseClient();
    return client[prop as keyof SupabaseClient];
  },
});

// Database types for type safety
export interface User {
  id: string;
  reg_no: string;
  first_name: string;
  last_name: string;
  email: string;
  batch: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeEntry {
  id: string;
  entry_client_id: string;
  user_id: string;
  reg_no: string;
  date: string;
  minutes: number;
  practice_text: string | null;
  sankalp_word: string | null;
  airtable_record_id: string | null;
  synced: boolean;
  sync_attempts: number;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeEntryWithUser extends PracticeEntry {
  user: User;
}

