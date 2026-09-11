import { ChallengeEntity, ChallengeTask } from "@/domain/entities/ChallengeEntity";

export class ChallengePointService {
    /**
     * Calculates points for Type 1 (System Daily Tasks):
     * Awards standard base points per completed category task during the challenge period.
     */
    public static calculateSystemTaskPoints(completedCategories: string[]): number {
        if (!completedCategories || completedCategories.length === 0) return 0;
        
        // Base points per category check-in
        const pointsMap: Record<string, number> = {
            workout: 50,
            nutrition: 30,
            hydration: 20,
            mindset: 25,
        };

        return completedCategories.reduce((total, category) => {
            return total + (pointsMap[category.toLowerCase()] || 10);
        }, 0);
    }

    /**
     * Calculates points for Type 2 (Coach Custom Challenge Tasks):
     * Evaluates completion of specific daily tasks attached to the challenge.
     */
    public static calculateCoachTaskPoints(
        challengeTasks: ChallengeTask[],
        completedTaskIndices: number[]
    ): number {
        if (!challengeTasks || challengeTasks.length === 0) return 0;

        let totalPoints = 0;
        for (const idx of completedTaskIndices) {
            if (challengeTasks[idx]) {
                totalPoints += challengeTasks[idx].targetPoints || 20;
            }
        }
        return totalPoints;
    }
}
