import { ValidationError } from './errors';

// Validate registration number (alphanumeric)
export const validateRegNo = (regNo: string): void => {
  if (!regNo || typeof regNo !== 'string') {
    throw new ValidationError('Registration number is required');
  }

  if (!/^[a-zA-Z0-9]+$/.test(regNo)) {
    throw new ValidationError('Registration number must be alphanumeric');
  }

  if (regNo.length < 3 || regNo.length > 50) {
    throw new ValidationError('Registration number must be between 3 and 50 characters');
  }
};

// Validate email format
export const validateEmail = (email: string): void => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

// Validate minutes (1-1440)
export const validateMinutes = (minutes: number): void => {
  if (typeof minutes !== 'number') {
    throw new ValidationError('Minutes must be a number');
  }

  const maxMinutes = parseInt(process.env.MAX_MINUTES_PER_ENTRY || '1440', 10);
  
  if (minutes < 1 || minutes > maxMinutes) {
    throw new ValidationError(`Minutes must be between 1 and ${maxMinutes}`);
  }

  if (!Number.isInteger(minutes)) {
    throw new ValidationError('Minutes must be a whole number');
  }
};

// Validate date (ISO format, not future, allow today)
export const validateDate = (dateStr: string): void => {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new ValidationError('Date is required');
  }

  // Check ISO date format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateStr)) {
    throw new ValidationError('Date must be in ISO format (YYYY-MM-DD)');
  }

  const date = new Date(dateStr);
  
  // Check if valid date
  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid date');
  }

  // Check if not in future (allow today)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (date > today) {
    throw new ValidationError('Date cannot be in the future');
  }
};

// Validate Sankalp word (max 100 chars)
export const validateSankalpWord = (word: string | null | undefined): void => {
  if (!word) {
    return; // Optional field
  }

  if (typeof word !== 'string') {
    throw new ValidationError('Sankalp word must be a string');
  }

  if (word.length > 100) {
    throw new ValidationError('Sankalp word must not exceed 100 characters');
  }
};

// Validate practice text (optional, but if provided must be string)
export const validatePracticeText = (text: string | null | undefined): void => {
  if (!text) {
    return; // Optional field
  }

  if (typeof text !== 'string') {
    throw new ValidationError('Practice text must be a string');
  }

  if (text.length > 5000) {
    throw new ValidationError('Practice text must not exceed 5000 characters');
  }
};

// Validate entry client ID (UUID format)
export const validateEntryClientId = (id: string): void => {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Entry client ID is required');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Entry client ID must be a valid UUID');
  }
};

// Validate name fields
export const validateName = (name: string, fieldName: string): void => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (name.trim().length < 1) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }

  if (name.length > 100) {
    throw new ValidationError(`${fieldName} must not exceed 100 characters`);
  }
};

// Validate batch (optional)
export const validateBatch = (batch: string | null | undefined): void => {
  if (!batch) {
    return; // Optional field
  }

  if (typeof batch !== 'string') {
    throw new ValidationError('Batch must be a string');
  }

  if (batch.length > 50) {
    throw new ValidationError('Batch must not exceed 50 characters');
  }
};

