import { Schema, model } from 'mongoose';
import { WorkoutEntity } from '@/domain/entities/WorkoutEntity';

export const workoutSchema = new Schema<WorkoutEntity>({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        required: true,
    },
    video: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    place: {
        type: String,
        required: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    isFree: {
        type: Boolean,
        required: true,
        default: true,
    },
}, { timestamps: true });

const Workout = model<WorkoutEntity>('Workout', workoutSchema);

export default Workout;
