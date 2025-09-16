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
    const newReading: SavedReading = {
      ...reading,
      id: new Date().toISOString(),
      date: new Date().toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    
    const updatedReadings = [newReading, ...readings];

    // Optional: Limit the history size to prevent localStorage from getting too large
    if (updatedReadings.length > 50) {
      updatedReadings.splice(50);
    }

    localStorage.setItem(JOURNAL_KEY, JSON.stringify(updatedReadings));
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