import { Schema, model } from 'mongoose';
import { UserSettingsEntity } from '@/domain/entities/UserSettingsEntity';

const waterSettingsSchema = new Schema({
    is_active: {
        type: Boolean,
        required: true,
        default: false,
    },
    daily_need: {
        type: Number,
        required: true,
        default: 2.0,  // Litres
    },
    cup_size_ml: {
        type: Number,
        required: true,
        default: 250,  // ml
    },
    reminder_interval_minutes: {
        type: Number,
        required: true,
        default: 60,
    },
    next_reminder_at: {
        type: Date,
        required: false,
        default: null,
    },
}, { _id: false }); // embedded sub-doc, no separate _id needed

const userSettingsSchema = new Schema<UserSettingsEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    water: {
        type: waterSettingsSchema,
        required: true,
        default: () => ({}),
    },
});

const UserSettings = model<UserSettingsEntity>('UserSettings', userSettingsSchema);

export default UserSettings;
