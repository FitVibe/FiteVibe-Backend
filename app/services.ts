import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import UserService from "./services/UserService";
import HomeService from "./services/HomeService";
import User from "@/infrastructure/database/models/userModel";
import Client from "@/infrastructure/database/models/clientModel";
import DailyLogin from "@/infrastructure/database/models/dailyLoginModel";

const mongoDBInstance = new MongoDBDatabase();

export const userService = new UserService(mongoDBInstance, User, Client);
export const homeService = new HomeService(mongoDBInstance, DailyLogin);