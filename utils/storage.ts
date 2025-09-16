import type { SavedReading, NewReading } from '../types';

const JOURNAL_KEY = 'goddessOracleJournal';

export const getReadings = (): SavedReading[] => {
  try {
    const data = localStorage.getItem(JOURNAL_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return [];
  }
};

export const saveReading = (reading: NewReading) => {
  try {
    const readings = getReadings();

    // Create new reading without storing large image data
    const newReading: SavedReading = {
      ...reading,
      id: new Date().toISOString(),
      date: new Date().toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      // Don't save base64 image data to prevent localStorage quota issues
      generatedImageUrl: null
    };

    const updatedReadings = [newReading, ...readings];

    // Limit the history size to prevent localStorage from getting too large
    if (updatedReadings.length > 20) {
      updatedReadings.splice(20);
    }

    // Try to save, if it fails due to quota, clear some old data
    try {
      localStorage.setItem(JOURNAL_KEY, JSON.stringify(updatedReadings));
    } catch (quotaError) {
      if (quotaError.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded, clearing old readings...');
        // Keep only the 10 most recent readings
        const reducedReadings = updatedReadings.slice(0, 10);
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(reducedReadings));
      } else {
        throw quotaError;
      }
    }
  } catch (error) {
    console.error("Error saving to localStorage", error);
  }
};

export const clearReadings = (): void => {
  try {
    localStorage.removeItem(JOURNAL_KEY);
  } catch (error) {
    console.error("Error clearing localStorage", error);
  }
};