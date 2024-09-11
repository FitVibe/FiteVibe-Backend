import { Schema, model } from 'mongoose';
import { clientSchema } from './clientModel';
import { UserEntity } from '@/domain/entities/UserEntity';

const userSchema = new Schema<UserEntity>({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password:
    {
        type: String,
        required: true,
    },
    account_type:
    {
        type: String,
        required: true,
    },
    first_name:
    {
        type: String,
        required: true,
    },
    last_name:
    {
        type: String,
        required: true,
    },
    profile_image:
    {
        type: String,
        required: false,
    },
    city:
    {
        type: String,
        required: false,
    },
    country:
    {
        type: String,
        required: false,
    },
    age:
    {
        type: Number,
        required: true,
    },
    gender:
    {
        type: String,
        required: true,
    },
    email_verified:
    {
        type: Boolean,
        required: false,
    },
    client: {
        type: clientSchema,
        required: false,
    }
});

const User = model<UserEntity>('User', userSchema);

export default User;