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
import DailyTrainingPlanner from "@/infrastructure/database/models/dailyTrainingPlannerModel";
import Workout from "@/infrastructure/database/models/workoutModel";

const mongoDBInstance = new MongoDBDatabase();

export const userService = new UserService(mongoDBInstance, User, Client);
export const waterService = new WaterService(mongoDBInstance, UserSettings, DrinkWaterTask, DailyTasks);
export const homeService = new HomeService(mongoDBInstance, DailyLogin, DailyTrainingPlanner, Workout, waterService);