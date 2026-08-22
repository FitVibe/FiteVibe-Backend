import { Document, Types } from "mongoose";
import { WaterSettings } from "./DrinkWaterSettingsEntity";

export interface UserSettingsEntity extends Document {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    water: WaterSettings;
}
