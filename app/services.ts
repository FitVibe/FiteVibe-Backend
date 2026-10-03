import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import UserService from "./services/UserService";
import HomeService from "./services/HomeService";
import WaterService from "./services/WaterService";
import ChallengeService from "./services/ChallengeService";
import ChallengeCommunityService from "./services/ChallengeCommunityService";
import User from "@/infrastructure/database/models/userModel";
import Client from "@/infrastructure/database/models/clientModel";
import DailyLogin from "@/infrastructure/database/models/dailyLoginModel";
import UserSettings from "@/infrastructure/database/models/userSettingsModel";
import DrinkWaterTask from "@/infrastructure/database/models/drinkWaterTaskModel";
import DailyTasks from "@/infrastructure/database/models/dailyTasksModel";
import { MongoUserRepository } from "@/infrastructure/database/repositories/MongoUserRepository";
import { MongoDailyTrainingPlannerRepository } from "@/infrastructure/database/repositories/MongoDailyTrainingPlannerRepository";
import { MongoDailyMealsRepository } from "@/infrastructure/database/repositories/MongoDailyMealsRepository";
import { MongoMealRepository } from "@/infrastructure/database/repositories/MongoMealRepository";
import { MongoChallengeRepository } from "@/infrastructure/database/repositories/MongoChallengeRepository";
import { MongoUserChallengeRepository } from "@/infrastructure/database/repositories/MongoUserChallengeRepository";
import { MongoChallengeCommunityRepository } from "@/infrastructure/database/repositories/MongoChallengeCommunityRepository";
import { MongoNotificationRepository } from "@/infrastructure/database/repositories/MongoNotificationRepository";
import NotificationService from "./services/NotificationService";

const mongoDBInstance = new MongoDBDatabase();

export const userRepository = new MongoUserRepository();
export const mealRepository = new MongoMealRepository();
export const dailyTrainingPlannerRepository = new MongoDailyTrainingPlannerRepository();
export const dailyMealsRepository = new MongoDailyMealsRepository();
export const challengeRepository = new MongoChallengeRepository();
export const userChallengeRepository = new MongoUserChallengeRepository();
export const challengeCommunityRepository = new MongoChallengeCommunityRepository();
export const notificationRepository = new MongoNotificationRepository();

export const userService = new UserService(mongoDBInstance, User, Client);
export const waterService = new WaterService(mongoDBInstance, UserSettings, DrinkWaterTask, DailyTasks);

export const notificationService = new NotificationService(
    notificationRepository,
    userRepository
);

export const challengeService = new ChallengeService(
    challengeRepository,
    userChallengeRepository,
    userRepository
);

export const challengeCommunityService = new ChallengeCommunityService(
    challengeCommunityRepository,
    notificationService
);

export const homeService = new HomeService(
    mongoDBInstance,
    DailyLogin,
    dailyTrainingPlannerRepository,
    dailyMealsRepository,
    userRepository,
    waterService,
    challengeService,
    mealRepository
);