import { Document } from "mongoose";

interface ClientEntity extends Document {
    _id?: String;
    weight: Number;
    height: Number;
    fats: Number;
    personal_goals: PersonalGoals
}

type PersonalGoals = {
    goal: Goal,
    weight_goal: Number
}

type Goal = 'Increase physical fitness' | 'Weight loss' | 'Gain muscle mass'
