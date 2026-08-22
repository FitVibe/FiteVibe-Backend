import { Document, Types } from "mongoose";

interface UserEntity extends Document {
    _id?: Types.ObjectId;
    email: string;
    account_type: AccountType;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    fcm_device_token?: string;
    city: string;
    country: string;
    age: number;
    gender: 'Male' | 'Female';
    email_verified: boolean;
    client?: ClientEntity
}

type AccountType = 'client' | 'coach' | 'admin'