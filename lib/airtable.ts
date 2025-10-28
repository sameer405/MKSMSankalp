import { logger } from './logger';
import { PracticeEntryWithUser } from './supabase';

// Runtime validation helper
const getAirtableConfig = () => {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('Missing AIRTABLE_API_KEY environment variable');
  }

  if (!process.env.AIRTABLE_BASE_ID) {
    throw new Error('Missing AIRTABLE_BASE_ID environment variable');
  }

  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'PracticeEntries';
  
  return {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    tableName: AIRTABLE_TABLE_NAME,
    apiUrl: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
  };
};

interface AirtableFields {
  RegNo: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Batch?: string;
  Date: string;
  Minutes: number;
  PracticeText?: string;
  SankalpWord?: string;
  EntryId: string;
  SyncedAt: string;
  Deleted?: boolean;
}

interface AirtableResponse {
  id: string;
  fields: AirtableFields;
  createdTime: string;
}

// Sync a new practice entry to Airtable
export const syncEntryToAirtable = async (
  entry: PracticeEntryWithUser
): Promise<string> => {
  try {
    const config = getAirtableConfig();
    
    const fields: AirtableFields = {
      RegNo: entry.reg_no,
      FirstName: entry.user.first_name,
      LastName: entry.user.last_name,
      Email: entry.user.email,
      Batch: entry.user.batch || undefined,
      Date: entry.date,
      Minutes: entry.minutes,
      PracticeText: entry.practice_text || undefined,
      SankalpWord: entry.sankalp_word || undefined,
      EntryId: entry.id,
      SyncedAt: new Date().toISOString(),
    };

    logger.info('Syncing entry to Airtable', {
      entryId: entry.id,
      regNo: entry.reg_no,
    });

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Airtable sync failed', {
        entryId: entry.id,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Airtable sync failed: ${response.status} - ${errorText}`);
    }

    const data: AirtableResponse = await response.json();

    logger.info('Successfully synced to Airtable', {
      entryId: entry.id,
      airtableRecordId: data.id,
    });

    return data.id;
  } catch (error) {
    logger.error('Airtable sync error', {
      entryId: entry.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

// Update an existing Airtable record
export const updateAirtableRecord = async (
  recordId: string,
  entry: PracticeEntryWithUser
): Promise<void> => {
  try {
    const config = getAirtableConfig();
    
    const fields: Partial<AirtableFields> = {
      Minutes: entry.minutes,
      PracticeText: entry.practice_text || undefined,
      SankalpWord: entry.sankalp_word || undefined,
      SyncedAt: new Date().toISOString(),
    };

    logger.info('Updating Airtable record', {
      airtableRecordId: recordId,
      entryId: entry.id,
    });

    const response = await fetch(`${config.apiUrl}/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Airtable update failed', {
        airtableRecordId: recordId,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Airtable update failed: ${response.status} - ${errorText}`);
    }

    logger.info('Successfully updated Airtable record', {
      airtableRecordId: recordId,
      entryId: entry.id,
    });
  } catch (error) {
    logger.error('Airtable update error', {
      airtableRecordId: recordId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

// Mark an Airtable record as deleted (soft delete)
export const deleteAirtableRecord = async (recordId: string): Promise<void> => {
  try {
    const config = getAirtableConfig();
    
    const fields = {
      Deleted: true,
      SyncedAt: new Date().toISOString(),
    };

    logger.info('Marking Airtable record as deleted', {
      airtableRecordId: recordId,
    });

    const response = await fetch(`${config.apiUrl}/${recordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Airtable delete marking failed', {
        airtableRecordId: recordId,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Airtable delete failed: ${response.status} - ${errorText}`);
    }

    logger.info('Successfully marked Airtable record as deleted', {
      airtableRecordId: recordId,
    });
  } catch (error) {
    logger.error('Airtable delete error', {
      airtableRecordId: recordId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

