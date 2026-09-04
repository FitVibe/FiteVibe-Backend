import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import UserService from "./services/UserService";
import HomeService from "./services/HomeService";
import WaterService from "./services/WaterService";
import User from "@/infrastructure/database/models/userModel";
import Client from "@/infrastructure/database/models/clientModel";
import DailyLogin from "@/infrastructure/database/models/dailyLoginModel";
import UserSettings from "@/infrastructure/database/models/userSettingsModel";
import DrinkWaterTask from "@/infrastructure/database/models/drinkWaterTaskModel";
import DailyTasks from "@/infrastructure/database/models/dailyTasksModel";
import { MongoUserRepository } from "@/infrastructure/database/repositories/MongoUserRepository";
import { MongoDailyTrainingPlannerRepository } from "@/infrastructure/database/repositories/MongoDailyTrainingPlannerRepository";
import { MongoDailyMealsRepository } from "@/infrastructure/database/repositories/MongoDailyMealsRepository";

const mongoDBInstance = new MongoDBDatabase();

export const userRepository = new MongoUserRepository();
export const dailyTrainingPlannerRepository = new MongoDailyTrainingPlannerRepository();
export const dailyMealsRepository = new MongoDailyMealsRepository();

export const userService = new UserService(mongoDBInstance, User, Client);
export const waterService = new WaterService(mongoDBInstance, UserSettings, DrinkWaterTask, DailyTasks);

export const homeService = new HomeService(
    mongoDBInstance,
    DailyLogin,
    dailyTrainingPlannerRepository,
    dailyMealsRepository,
    userRepository,
    waterService
);