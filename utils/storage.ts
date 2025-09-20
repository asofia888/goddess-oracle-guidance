import type { SavedReading, NewReading } from '../types';
import { secureStorage, sanitizeUserInput, generateSecureId } from './security';

const JOURNAL_KEY = 'goddessOracleJournal';

export const getReadings = (): SavedReading[] => {
  try {
    // Use secure storage wrapper
    const data = secureStorage.getItem(JOURNAL_KEY);
    return data || [];
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return [];
  }
};

export const saveReading = (reading: NewReading) => {
  try {
    const readings = getReadings();

    // Sanitize card data for security
    const sanitizedCards = reading.cards.map(card => ({
      ...card,
      name: sanitizeUserInput(card.name),
      description: sanitizeUserInput(card.description),
      message: sanitizeUserInput(card.message || '')
    }));

    // Sanitize generated messages
    const sanitizedMessages = reading.generatedMessages.map(msg =>
      msg ? sanitizeUserInput(msg) : null
    );

    // Create new reading with secure ID and sanitized data
    const newReading: SavedReading = {
      ...reading,
      id: generateSecureId(),
      date: new Date().toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      cards: sanitizedCards,
      generatedMessages: sanitizedMessages,
      // Don't save base64 image data to prevent localStorage quota issues
      generatedImageUrl: null
    };

    const updatedReadings = [newReading, ...readings];

    // Limit the history size to prevent localStorage from getting too large
    if (updatedReadings.length > 20) {
      updatedReadings.splice(20);
    }

    // Use secure storage with fallback handling
    if (!secureStorage.setItem(JOURNAL_KEY, updatedReadings)) {
      // Fallback: try with reduced data set
      console.warn('Failed to save full reading history, attempting with reduced data...');
      const reducedReadings = updatedReadings.slice(0, 10);

      if (!secureStorage.setItem(JOURNAL_KEY, reducedReadings)) {
        throw new Error('Failed to save reading data even with reduced set');
      }
    }
  } catch (error) {
    console.error("Error saving reading to localStorage", error);
    // Log security event for monitoring
    if (typeof window !== 'undefined') {
      console.warn('Storage security event:', { error: error.message, timestamp: Date.now() });
    }
  }
};

export const clearReadings = (): void => {
  try {
    secureStorage.removeItem(JOURNAL_KEY);
  } catch (error) {
    console.error("Error clearing localStorage", error);
  }
};