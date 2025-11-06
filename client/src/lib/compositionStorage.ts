/**
 * Composition data structure
 */
export interface SavedComposition {
  id: string;
  title: string;
  raga: string;
  tala: string;
  instruments: string[];
  tempo: number;
  mood: string;
  audioUrl: string;
  description?: string;
  createdAt: string;
  generatedAt: string;
}

/**
 * Storage key for compositions in localStorage
 */
const STORAGE_KEY = "saved_compositions";

/**
 * Get all saved compositions from localStorage
 */
export function getSavedCompositions(): SavedComposition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading compositions:", error);
    return [];
  }
}

/**
 * Save a composition to localStorage
 */
export function saveComposition(composition: Omit<SavedComposition, "id" | "createdAt" | "generatedAt">): SavedComposition {
  const compositions = getSavedCompositions();
  const newComposition: SavedComposition = {
    ...composition,
    id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };
  
  compositions.unshift(newComposition); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compositions));
  return newComposition;
}

/**
 * Delete a composition by ID
 */
export function deleteComposition(id: string): boolean {
  try {
    const compositions = getSavedCompositions();
    const filtered = compositions.filter((comp) => comp.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting composition:", error);
    return false;
  }
}

/**
 * Get a composition by ID
 */
export function getCompositionById(id: string): SavedComposition | null {
  const compositions = getSavedCompositions();
  return compositions.find((comp) => comp.id === id) || null;
}

/**
 * Search compositions by query
 */
export function searchCompositions(query: string): SavedComposition[] {
  const compositions = getSavedCompositions();
  if (!query.trim()) return compositions;
  
  const lowerQuery = query.toLowerCase();
  return compositions.filter(
    (comp) =>
      comp.title.toLowerCase().includes(lowerQuery) ||
      comp.raga.toLowerCase().includes(lowerQuery) ||
      comp.tala.toLowerCase().includes(lowerQuery) ||
      comp.mood.toLowerCase().includes(lowerQuery) ||
      comp.instruments.some((inst) => inst.toLowerCase().includes(lowerQuery)) ||
      comp.description?.toLowerCase().includes(lowerQuery)
  );
}

