export enum ExerciseCategory {
    CARDIO = 'Cardio',
    HIIT = 'HIIT',
    CHEST_ARMS = 'Chest & Arms',
    LEGS_GLUTES = 'Legs & Glutes',
    CHEST_CORE = 'Chest & Core',
    CORE_STABILITY = 'Core & Stability',
    FULL_BODY = 'Full Body & Cardio',
}

export const EXERCISE_MET_VALUES: Record<string, number> = {
    'cardio': 8.0,
    'hiit': 8.0,
    'legs & glutes': 5.5,
    'leg': 5.5,
    'glute': 5.5,
    'chest & arms': 4.0,
    'chest & core': 4.0,
    'chest': 4.0,
    'arm': 4.0,
    'upper': 4.0,
    'core & stability': 3.0,
    'core': 3.0,
    'stability': 3.0,
    'full body & cardio': 8.0,
};

export const DEFAULT_EXERCISE_MET = 4.5;

/**
 * Returns the MET value for a given exercise category domain string.
 */
export function getMetForCategory(category?: string): number {
    if (!category) return DEFAULT_EXERCISE_MET;
    const catLower = category.toLowerCase().trim();
    return EXERCISE_MET_VALUES[catLower] || DEFAULT_EXERCISE_MET;
}
