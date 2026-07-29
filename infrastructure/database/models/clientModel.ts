import { ClientEntity } from '@/domain/entities/ClientEntity';
import { Schema, model } from 'mongoose';

export const clientSchema = new Schema<ClientEntity>({
    weight: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    fats:
    {
        type: String,
        required: true,
    },
    personal_goals: {
        goal: {
            type: String,
            required: true,
            enum: ['Increase physical fitness', 'Weight loss', 'Gain muscle mass'],
        },
        weight_goal: {
            type: Number,
            required: true,
        }
    }
});

const Client = model('Client', clientSchema);

export default Client;