import { getMetForCategory } from "@/domain/types/ExerciseCategory";

export class MeasureCalculationService {
    /**
     * Calculates total intake macros and calories from completed meals.
     */
    public static calculateMealMacros(completedMeals: Array<{ carbs?: number; protein?: number; fats?: number; calories?: number }>) {
        if (!completedMeals || completedMeals.length === 0) {
            return {
                totalCarbs: 0,
                totalProtein: 0,
                totalFats: 0,
                totalCalories: 0,
            };
        }

        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFats = 0;
        let totalCalories = 0;

        for (const meal of completedMeals) {
            const carbs = meal.carbs || 0;
            const protein = meal.protein || 0;
            const fats = meal.fats || 0;
            const calories = meal.calories || (carbs * 4 + protein * 4 + fats * 9);

            totalCarbs += carbs;
            totalProtein += protein;
            totalFats += fats;
            totalCalories += calories;
        }

        return {
            totalCarbs,
            totalProtein,
            totalFats,
            totalCalories,
        };
    }

    /**
     * Calculates individual calorie contributions for macros (Protein: 4kcal/g, Carbs: 4kcal/g, Fats: 9kcal/g).
     */
    public static calculateMacroCalories(proteinGrams?: number | null, carbsGrams?: number | null, fatsGrams?: number | null) {
        return {
            proteinCalories: proteinGrams !== undefined && proteinGrams !== null ? proteinGrams * 4 : null,
            carbsCalories: carbsGrams !== undefined && carbsGrams !== null ? carbsGrams * 4 : null,
            fatsCalories: fatsGrams !== undefined && fatsGrams !== null ? fatsGrams * 9 : null,
        };
    }

    /**
     * Calculates total workout activity time (minutes) and burned calories using MET formula.
     * Uses category MET values defined in domain/types/ExerciseCategory.ts.
     */
    public static calculateWorkoutActivity(
        exercises: Array<{ category?: string; duration?: number }>,
        userWeightKg?: number | null
    ) {
        if (!exercises || exercises.length === 0) {
            return {
                workoutTimeMinutes: 0,
                burnedCalories: userWeightKg ? 0 : null,
            };
        }

        let totalWorkoutSeconds = 0;
        let totalBurnedCalories = 0;

        for (const exercise of exercises) {
            const durationSec = exercise.duration || 0;
            totalWorkoutSeconds += durationSec;

            if (userWeightKg && durationSec > 0) {
                const durationMins = durationSec / 60;
                const met = getMetForCategory(exercise.category);

                const calories = (met * 3.5 * userWeightKg / 200) * durationMins;
                totalBurnedCalories += calories;
            }
        }

        const workoutTimeMinutes = Math.round(totalWorkoutSeconds / 60);

        return {
            workoutTimeMinutes,
            burnedCalories: userWeightKg ? Math.round(totalBurnedCalories) : null,
        };
    }

    /**
     * Calculates net calories: Consumed calories - Burned workout calories.
     * Returns null if neither consumed nor burned calories are available.
     */
    public static calculateNetCalories(consumedCalories?: number | null, burnedCalories?: number | null): number | null {
        if ((consumedCalories === undefined || consumedCalories === null) && (burnedCalories === undefined || burnedCalories === null)) {
            return null;
        }
        const consumed = consumedCalories || 0;
        const burned = burnedCalories || 0;
        return Math.max(0, consumed - burned);
    }

    /**
     * Calculates target daily calories and macronutrient breakdown (protein, carbs, fats)
     * based on user biometrics (age, gender, weight, height) and personal goals.
     * Uses Mifflin-St Jeor equation for BMR and TDEE adjustment.
     * Returns null values if required biometric info is missing.
     */
    public static calculateTargetGoals(params: {
        age?: number | null;
        gender?: string | null;
        weightKg?: number | null;
        heightCm?: number | null;
        goal?: string | null;
    }) {
        const { age, gender, weightKg, heightCm, goal } = params;

        // Strict validation: if core biometrics are missing, return nulls
        if (!age || !gender || !weightKg || !heightCm) {
            return {
                targetCalories: null,
                targetProteinGrams: null,
                targetCarbsGrams: null,
                targetFatsGrams: null,
            };
        }

        // Mifflin-St Jeor BMR Formula
        const isMale = gender.toLowerCase() === 'male' || gender.toLowerCase() === 'm';
        const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + (isMale ? 5 : -161);

        // Standard Moderate Activity Factor (1.375)
        const tdee = bmr * 1.375;

        // Adjust target calories based on goal
        let targetCalories = tdee;
        if (goal === 'Weight loss') {
            targetCalories -= 500; // Calorie deficit
        } else if (goal === 'Gain muscle mass') {
            targetCalories += 300; // Calorie surplus
        } // 'Increase physical fitness' maintains TDEE

        targetCalories = Math.round(Math.max(1200, targetCalories)); // Ensure healthy minimum floor

        // Macro Breakdown: 30% Protein (4kcal/g), 40% Carbs (4kcal/g), 30% Fats (9kcal/g)
        const targetProteinGrams = Math.round((targetCalories * 0.30) / 4);
        const targetCarbsGrams = Math.round((targetCalories * 0.40) / 4);
        const targetFatsGrams = Math.round((targetCalories * 0.30) / 9);

        return {
            targetCalories,
            targetProteinGrams,
            targetCarbsGrams,
            targetFatsGrams,
        };
    }
}
