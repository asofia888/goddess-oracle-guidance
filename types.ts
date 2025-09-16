
export interface GoddessCardData {
  id: number;
  name: string;
  description: string;
  message: string;
}

export interface SavedReading {
  id: string;
  date: string;
  mode: 'single' | 'three';
  cards: GoddessCardData[];
  generatedMessages: (string | null)[];
  generatedImageUrl: string | null;
}

export type NewReading = Omit<SavedReading, 'id' | 'date'>;

// FIX: Add GenerateMessageRequestBody type for the message generation API endpoint.
export interface GenerateMessageRequestBody {
  cards: GoddessCardData[];
  mode: 'single' | 'three';
}

// FIX: Add GenerateImageRequestBody type for the image generation API endpoint.
export interface GenerateImageRequestBody {
  prompt: string;
}
