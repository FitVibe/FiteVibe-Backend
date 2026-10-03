import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import { Model } from "mongoose";
import { DailyLoginEntity } from "@/domain/entities/DailyLoginEntity";
import { Types } from "mongoose";
import WaterService from "./WaterService";
import { MeasureCalculationService } from "@/domain/services/MeasureCalculationService";
import { getCache, setCache, clearUserDailyMeasures } from "@/infrastructure/memcached/memcachedClient";
import { IDailyTrainingPlannerRepository } from "@/domain/repositories/IDailyTrainingPlannerRepository";
import { IDailyMealsRepository } from "@/domain/repositories/IDailyMealsRepository";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { IMealRepository } from "@/domain/repositories/IMealRepository";

import ChallengeService from "./ChallengeService";

export default class HomeService {
    private db: MongoDBDatabase;
    private dailyLoginModel: Model<DailyLoginEntity>;
    private dailyTrainingPlannerRepo: IDailyTrainingPlannerRepository;
    private dailyMealsRepo: IDailyMealsRepository;
    private userRepo: IUserRepository;
    private waterService: WaterService;
    private challengeService?: ChallengeService;
    private mealRepo?: IMealRepository;

    constructor(
        db: MongoDBDatabase,
        dailyLoginModel: Model<DailyLoginEntity>,
        dailyTrainingPlannerRepo: IDailyTrainingPlannerRepository,
        dailyMealsRepo: IDailyMealsRepository,
        userRepo: IUserRepository,
        waterService: WaterService,
        challengeService?: ChallengeService,
        mealRepo?: IMealRepository
    ) {
        this.db = db;
        this.dailyLoginModel = dailyLoginModel;
        this.dailyTrainingPlannerRepo = dailyTrainingPlannerRepo;
        this.dailyMealsRepo = dailyMealsRepo;
        this.userRepo = userRepo;
        this.waterService = waterService;
        this.challengeService = challengeService;
        this.mealRepo = mealRepo;
    }

    public async getHomeData(userId: string) {
        let dailyLoginRecords = await this.db.query(this.dailyLoginModel, { userId: new Types.ObjectId(userId) });
        let dailyLogin = dailyLoginRecords && dailyLoginRecords.length > 0 ? dailyLoginRecords[0] : null;

        const now = new Date();
        // Normalize 'now' to midnight UTC
        const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);

        if (!dailyLogin) {
            // First time login
            dailyLogin = await this.db.insert(this.dailyLoginModel, {
                userId: new Types.ObjectId(userId),
                streakCount: 1,
                lastLoginDate: todayMidnight
            });
        } else {
            // Check diff
            const lastLoginDate = new Date(dailyLogin.lastLoginDate);
            const lastLoginMidnight = new Date(Date.UTC(lastLoginDate.getUTCFullYear(), lastLoginDate.getUTCMonth(), lastLoginDate.getUTCDate()));
            
            const msInDay = 1000 * 60 * 60 * 24;
            const diffDays = Math.floor((todayMidnight.getTime() - lastLoginMidnight.getTime()) / msInDay);

            if (diffDays === 1) {
                // Logged in yesterday
                dailyLogin = (await this.db.update(this.dailyLoginModel, 
                    { userId: new Types.ObjectId(userId) },
                    { 
                        streakCount: dailyLogin.streakCount + 1, 
                        lastLoginDate: todayMidnight 
                    }
                )) as any;
            } else if (diffDays > 1) {
                // Missed a day
                dailyLogin = (await this.db.update(this.dailyLoginModel, 
                    { userId: new Types.ObjectId(userId) },
                    { 
                        streakCount: 1, 
                        lastLoginDate: todayMidnight 
                    }
                )) as any;
            }
        }

        // Fetch water section data
        const water = await this.waterService.getWaterHomeData(userId);

        // Fetch Daily Training Planner for today via Repository
        let planner = await this.dailyTrainingPlannerRepo.findTodayPlannerForUser(userId, todayMidnight, tomorrowMidnight);

        if (!planner) {
            planner = await this.dailyTrainingPlannerRepo.findTodayFreePlanner(todayMidnight, tomorrowMidnight);
        }

        if (!planner) {
            planner = await this.dailyTrainingPlannerRepo.findLatestFreePlanner();
        }

        let trainingDay = null;

        if (planner) {
            trainingDay = {
                plannerId: planner._id,
                name: planner.name,
                isFree: planner.isFree,
                exercisesCount: planner.exercises ? planner.exercises.length : 0,
                totalTime: planner.duration, // total time in minutes
                isCompleted: planner.isCompleted || false,
                date: planner.date,
                exercises: planner.exercises.map((item: any) => ({
                    workoutId: item.workoutId?._id || item.workoutId,
                    name: item.workoutId?.name || 'Workout Exercise',
                    category: item.workoutId?.category || '',
                    difficulty: item.workoutId?.difficulty || '',
                    video: item.workoutId?.video || '',
                    description: item.workoutId?.description || '',
                    place: item.workoutId?.place || '',
                    duration: item.duration,
                    repeatition: item.repeatition,
                    sets: item.sets,
                    kilos: item.kilos
                }))
            };
        }

        // Fetch Daily Meals Plan for today via Repository
        let mealsPlan = await this.dailyMealsRepo.findTodayMealsPlanForUser(userId, todayMidnight, tomorrowMidnight);

        if (!mealsPlan) {
            mealsPlan = await this.dailyMealsRepo.findTodayFreeMealsPlan(todayMidnight, tomorrowMidnight);
        }

        if (!mealsPlan) {
            mealsPlan = await this.dailyMealsRepo.findLatestFreeMealsPlan();
        }

        let dailyMeals = null;

        if (mealsPlan) {
            let totalCalories = 0;
            let totalCarbs = 0;
            let totalProtein = 0;
            let totalFats = 0;

            const mealsFormatted = mealsPlan.meals.map((item: any) => {
                const mealObj = item.mealId || {};
                const calories = mealObj.calories || ((mealObj.carbs || 0) * 4 + (mealObj.protein || 0) * 4 + (mealObj.fats || 0) * 9);
                
                totalCalories += calories;
                totalCarbs += mealObj.carbs || 0;
                totalProtein += mealObj.protein || 0;
                totalFats += mealObj.fats || 0;

                return {
                    meal_type: item.meal_type,
                    status: item.status || 'pending',
                    logged_at: item.logged_at || null,
                    meal: {
                        _id: mealObj._id || item.mealId,
                        name: mealObj.name || 'Delicious Meal',
                        calories: calories,
                        carbs: mealObj.carbs || 0,
                        protein: mealObj.protein || 0,
                        fats: mealObj.fats || 0,
                        ingredients: mealObj.ingredients || [],
                        image: mealObj.image || '',
                        isFree: mealObj.isFree !== undefined ? mealObj.isFree : true
                    }
                };
            });

            dailyMeals = {
                planId: mealsPlan._id,
                date: mealsPlan.date,
                is_complete: mealsPlan.is_complete || false,
                isFree: mealsPlan.isFree,
                totalCalories,
                totalCarbs,
                totalProtein,
                totalFats,
                meals: mealsFormatted
            };
        }

        // --- Fetch & Cache Daily Measures (Memcached) ---
        const todayString = `${todayMidnight.getUTCFullYear()}-${String(todayMidnight.getUTCMonth() + 1).padStart(2, '0')}-${String(todayMidnight.getUTCDate()).padStart(2, '0')}`;
        const cacheKey = `daily_measures:${userId}:${todayString}`;

        let dailyMeasures = await getCache<any>(cacheKey);

        if (!dailyMeasures) {
            // Fetch User Profile for Weight & Goals via Repository
            const user = await this.userRepo.findById(userId);
            const currentWeight = user?.client?.weight ?? null;
            const weightGoal = user?.client?.personal_goals?.weight_goal ?? null;

            // Calculate Workout Activity Metrics
            const activityMetrics = MeasureCalculationService.calculateWorkoutActivity(planner ? planner.exercises : [], currentWeight);

            // Filter Completed Meals & Calculate Macro Intake
            const completedMeals = mealsPlan
                ? mealsPlan.meals
                    .filter((m: any) => m.status === 'completed')
                    .map((m: any) => m.mealId || {})
                : [];

            const intakeMacros = MeasureCalculationService.calculateMealMacros(completedMeals);
            
            // Calculate Macro Calorie Breakdown
            const macroCalories = MeasureCalculationService.calculateMacroCalories(
                intakeMacros.totalProtein,
                intakeMacros.totalCarbs,
                intakeMacros.totalFats
            );

            // Calculate Target Goals from User Biometrics & Personal Goal
            const calculatedTargets = MeasureCalculationService.calculateTargetGoals({
                age: user?.age ?? null,
                gender: user?.gender ?? null,
                weightKg: currentWeight,
                heightCm: user?.client?.height ?? null,
                goal: user?.client?.personal_goals?.goal ?? null,
            });

            const targetCalories = (user?.client?.personal_goals as any)?.target_calories ?? calculatedTargets.targetCalories;
            const targetProteinGrams = (user?.client?.personal_goals as any)?.target_protein ?? calculatedTargets.targetProteinGrams;
            const targetCarbsGrams = (user?.client?.personal_goals as any)?.target_carbs ?? calculatedTargets.targetCarbsGrams;
            const targetFatsGrams = (user?.client?.personal_goals as any)?.target_fats ?? calculatedTargets.targetFatsGrams;

            // Calculate Net Calories
            const currentNetCalories = MeasureCalculationService.calculateNetCalories(
                intakeMacros.totalCalories,
                activityMetrics.burnedCalories
            );

            dailyMeasures = {
                weight: {
                    current: currentWeight,
                    goal: weightGoal,
                    unit: currentWeight !== null ? 'kg' : null,
                },
                activity: {
                    workoutTimeMinutes: activityMetrics.workoutTimeMinutes,
                    burnedCalories: activityMetrics.burnedCalories,
                },
                calories: {
                    currentNetCalories,
                    consumedCalories: intakeMacros.totalCalories,
                    burnedCalories: activityMetrics.burnedCalories,
                    targetCalories,
                },
                macros: {
                    protein: {
                        currentGrams: intakeMacros.totalProtein,
                        targetGrams: targetProteinGrams,
                        calories: macroCalories.proteinCalories,
                    },
                    carbs: {
                        currentGrams: intakeMacros.totalCarbs,
                        targetGrams: targetCarbsGrams,
                        calories: macroCalories.carbsCalories,
                    },
                    fats: {
                        currentGrams: intakeMacros.totalFats,
                        targetGrams: targetFatsGrams,
                        calories: macroCalories.fatsCalories,
                    },
                },
            };

            // Store in Memcached (TTL: 24 hours / 86400s)
            await setCache(cacheKey, dailyMeasures, 86400);
        }

        const challengesRes = this.challengeService ? await this.challengeService.getPublishedChallenges(userId, 0, 10) : null;
        const challenges = challengesRes ? (Array.isArray(challengesRes) ? challengesRes : challengesRes.challenges) : [];

        return {
            dailyLogin: {
                streakCount: dailyLogin?.streakCount || 1,
                lastLoginDate: dailyLogin?.lastLoginDate || todayMidnight
            },
            water,
            trainingDay,
            dailyMeals,
            dailyMeasures,
            challenges,
        };
    }

    public async logMealStatus(userId: string, planId: string, mealType: string, status: string) {
        const plan = await this.dailyMealsRepo.updateMealStatus(planId, mealType, status);
        if (!plan) {
            throw new Error('Daily meals plan not found or invalid meal type');
        }

        // Invalidate Memcached daily measures cache for user
        await clearUserDailyMeasures(userId);

        return plan;
    }

    public async completeWorkout(userId: string, plannerId: string) {
        const planner = await this.dailyTrainingPlannerRepo.findById(plannerId);
        if (!planner) {
            throw new Error('Daily training planner not found');
        }

        let updatedPlanner;

        if (!planner.userId) {
            // Shared/free system planner — clone for this specific user
            const exercisesClean = planner.exercises.map((item: any) => ({
                workoutId: item.workoutId?._id || item.workoutId,
                duration: item.duration,
                repeatition: item.repeatition,
                sets: item.sets,
                kilos: item.kilos
            }));

            updatedPlanner = await this.dailyTrainingPlannerRepo.create({
                userId: new Types.ObjectId(userId) as any,
                date: planner.date,
                name: planner.name,
                duration: planner.duration,
                isFree: planner.isFree,
                exercises: exercisesClean,
                isCompleted: true
            });
        } else {
            // User-specific planner — update in place
            updatedPlanner = await this.dailyTrainingPlannerRepo.update(plannerId, {
                isCompleted: true
            });
        }

        // Invalidate Memcached daily measures cache for user
        await clearUserDailyMeasures(userId);

        return updatedPlanner;
    }

    public async getPlannerDetails(plannerId: string) {
        const planner = await this.dailyTrainingPlannerRepo.findById(plannerId);
        if (!planner) {
            throw new Error('Daily training planner not found');
        }

        return {
            plannerId: planner._id,
            name: planner.name,
            isFree: planner.isFree,
            exercisesCount: planner.exercises ? planner.exercises.length : 0,
            totalTime: planner.duration,
            isCompleted: planner.isCompleted || false,
            date: planner.date,
            exercises: planner.exercises.map((item: any) => ({
                workoutId: item.workoutId?._id || item.workoutId,
                name: item.workoutId?.name || 'Workout Exercise',
                category: item.workoutId?.category || '',
                difficulty: item.workoutId?.difficulty || '',
                video: item.workoutId?.video || '',
                description: item.workoutId?.description || '',
                place: item.workoutId?.place || '',
                duration: item.duration,
                repeatition: item.repeatition,
                sets: item.sets,
                kilos: item.kilos
            }))
        };
    }

    public async getPlannersList(userId: string, skip: number = 0, limit: number = 20) {
        const filter: Record<string, any> = {
            $or: [
                { userId: new Types.ObjectId(userId) },
                { userId: { $exists: false } },
                { userId: null }
            ]
        };

        const planners = await this.dailyTrainingPlannerRepo.findPlanners(filter, skip, limit);

        return planners.map((planner: any) => ({
            plannerId: planner._id,
            name: planner.name,
            isFree: planner.isFree,
            exercisesCount: planner.exercises ? planner.exercises.length : 0,
            totalTime: planner.duration,
            isCompleted: planner.isCompleted || false,
            date: planner.date,
            exercises: planner.exercises.map((item: any) => ({
                workoutId: item.workoutId?._id || item.workoutId,
                name: item.workoutId?.name || 'Workout Exercise',
                category: item.workoutId?.category || '',
                difficulty: item.workoutId?.difficulty || '',
                video: item.workoutId?.video || '',
                description: item.workoutId?.description || '',
                place: item.workoutId?.place || '',
                duration: item.duration,
                repeatition: item.repeatition,
                sets: item.sets,
                kilos: item.kilos
            }))
        }));
    }

    public async getMealDetails(mealId: string) {
        if (!this.mealRepo) {
            throw new Error('Meal repository not configured');
        }

        const meal = await this.mealRepo.findById(mealId);
        if (!meal) {
            throw new Error('Meal not found');
        }

        const calories = meal.calories || ((meal.carbs || 0) * 4 + (meal.protein || 0) * 4 + (meal.fats || 0) * 9);

        // Fetch other available meals (excluding current meal)
        const filter = Types.ObjectId.isValid(mealId)
            ? { _id: { $ne: new Types.ObjectId(mealId) } }
            : {};
        const otherMealsDocs = await this.mealRepo.findAll(filter);

        const otherMeals = otherMealsDocs.map((m: any) => ({
            mealId: m._id,
            name: m.name,
            calories: m.calories || ((m.carbs || 0) * 4 + (m.protein || 0) * 4 + (m.fats || 0) * 9),
            carbs: m.carbs || 0,
            protein: m.protein || 0,
            fats: m.fats || 0,
            ingredients: m.ingredients || [],
            image: m.image || '',
            isFree: m.isFree !== undefined ? m.isFree : true
        }));

        return {
            mealId: meal._id,
            name: meal.name,
            calories,
            carbs: meal.carbs || 0,
            protein: meal.protein || 0,
            fats: meal.fats || 0,
            ingredients: meal.ingredients || [],
            image: meal.image || '',
            isFree: meal.isFree !== undefined ? meal.isFree : true,
            otherMeals
        };
    }

    public async getDailyMeals(userId: string) {
        const now = new Date();
        const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);

        let mealsPlan = await this.dailyMealsRepo.findTodayMealsPlanForUser(userId, todayMidnight, tomorrowMidnight);

        if (!mealsPlan) {
            mealsPlan = await this.dailyMealsRepo.findTodayFreeMealsPlan(todayMidnight, tomorrowMidnight);
        }

        if (!mealsPlan) {
            mealsPlan = await this.dailyMealsRepo.findLatestFreeMealsPlan();
        }

        if (!mealsPlan) {
            return null;
        }

        let totalCalories = 0;
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFats = 0;

        const mealsFormatted = mealsPlan.meals.map((item: any) => {
            const mealObj = item.mealId || {};
            const calories = mealObj.calories || ((mealObj.carbs || 0) * 4 + (mealObj.protein || 0) * 4 + (mealObj.fats || 0) * 9);

            totalCalories += calories;
            totalCarbs += mealObj.carbs || 0;
            totalProtein += mealObj.protein || 0;
            totalFats += mealObj.fats || 0;

            return {
                meal_type: item.meal_type,
                status: item.status || 'pending',
                logged_at: item.logged_at || null,
                meal: {
                    _id: mealObj._id || item.mealId,
                    name: mealObj.name || 'Delicious Meal',
                    calories: calories,
                    carbs: mealObj.carbs || 0,
                    protein: mealObj.protein || 0,
                    fats: mealObj.fats || 0,
                    ingredients: mealObj.ingredients || [],
                    image: mealObj.image || '',
                    isFree: mealObj.isFree !== undefined ? mealObj.isFree : true
                }
            };
        });

        return {
            planId: mealsPlan._id,
            date: mealsPlan.date,
            is_complete: mealsPlan.is_complete || false,
            isFree: mealsPlan.isFree,
            totalCalories,
            totalCarbs,
            totalProtein,
            totalFats,
            meals: mealsFormatted
        };
    }
}
