import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import UserService from "./services/UserService";
import User from "@/infrastructure/database/models/userModel";
import Client from "@/infrastructure/database/models/clientModel";

const mongoDBInstance = new MongoDBDatabase();

export const userService = new UserService(mongoDBInstance, User, Client)