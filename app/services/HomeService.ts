import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import { Model } from "mongoose";
import { DailyLoginEntity } from "@/domain/entities/DailyLoginEntity";
import { DailyTrainingPlannerEntity } from "@/domain/entities/DailyTrainingPlannerEntity";
import { WorkoutEntity } from "@/domain/entities/WorkoutEntity";
import { DailyMealsEntity } from "@/domain/entities/DailyMealsEntity";
import { MealEntity } from "@/domain/entities/MealEntity";
import { Types } from "mongoose";
import WaterService from "./WaterService";

export default class HomeService {
    private db: MongoDBDatabase;
    private dailyLoginModel: Model<DailyLoginEntity>;
    private dailyTrainingPlannerModel: Model<DailyTrainingPlannerEntity>;
    private workoutModel: Model<WorkoutEntity>;
    private dailyMealsModel: Model<DailyMealsEntity>;
    private mealModel: Model<MealEntity>;
    private waterService: WaterService;

    constructor(
        db: MongoDBDatabase,
        dailyLoginModel: Model<DailyLoginEntity>,
        dailyTrainingPlannerModel: Model<DailyTrainingPlannerEntity>,
        workoutModel: Model<WorkoutEntity>,
        dailyMealsModel: Model<DailyMealsEntity>,
        mealModel: Model<MealEntity>,
        waterService: WaterService
    ) {
        this.db = db;
        this.dailyLoginModel = dailyLoginModel;
        this.dailyTrainingPlannerModel = dailyTrainingPlannerModel;
        this.workoutModel = workoutModel;
        this.dailyMealsModel = dailyMealsModel;
        this.mealModel = mealModel;
        this.waterService = waterService;
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

        // Fetch Daily Training Planner for today
        const userObjId = new Types.ObjectId(userId);
        
        // Priority 1: Specific planner for this client for today
        let planner = await this.dailyTrainingPlannerModel.findOne({
            userId: userObjId,
            date: { $gte: todayMidnight, $lt: tomorrowMidnight }
        }).populate('exercises.workoutId');

        // Priority 2: General/Free planner for today
        if (!planner) {
            planner = await this.dailyTrainingPlannerModel.findOne({
                $or: [{ userId: { $exists: false } }, { userId: null }],
                date: { $gte: todayMidnight, $lt: tomorrowMidnight }
            }).populate('exercises.workoutId');
        }

        // Priority 3: Fallback to any latest free planner
        if (!planner) {
            planner = await this.dailyTrainingPlannerModel.findOne({ isFree: true })
                .sort({ date: -1 })
                .populate('exercises.workoutId');
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

        // Fetch Daily Meals Plan for today
        // Priority 1: Specific daily meals plan for this client today
        let mealsPlan = await this.dailyMealsModel.findOne({
            userId: userObjId,
            date: { $gte: todayMidnight, $lt: tomorrowMidnight }
        }).populate('meals.mealId');

        // Priority 2: General/Free system daily meals plan for today
        if (!mealsPlan) {
            mealsPlan = await this.dailyMealsModel.findOne({
                $or: [{ userId: { $exists: false } }, { userId: null }],
                date: { $gte: todayMidnight, $lt: tomorrowMidnight }
            }).populate('meals.mealId');
        }

        // Priority 3: Fallback to latest available free system daily meals plan
        if (!mealsPlan) {
            mealsPlan = await this.dailyMealsModel.findOne({ isFree: true })
                .sort({ date: -1 })
                .populate('meals.mealId');
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

        return {
            dailyLogin: {
                streakCount: dailyLogin?.streakCount || 1,
                lastLoginDate: dailyLogin?.lastLoginDate || todayMidnight
            },
            water,
            trainingDay,
            dailyMeals,
        };
    }

    public async logMealStatus(userId: string, planId: string, mealType: string, status: string) {
        const plan = await this.dailyMealsModel.findById(planId);
        if (!plan) {
            throw new Error('Daily meals plan not found');
        }

        const mealItem = plan.meals.find(m => m.meal_type.toLowerCase() === mealType.toLowerCase());
        if (!mealItem) {
            throw new Error(`Meal type ${mealType} not found in this plan`);
        }

        mealItem.status = status;
        if (status === 'completed') {
            mealItem.logged_at = new Date();
        }

        // Check if all meals in plan are completed
        const allCompleted = plan.meals.every(m => m.status === 'completed');
        plan.is_complete = allCompleted;

        await plan.save();
        return plan;
    }
}
