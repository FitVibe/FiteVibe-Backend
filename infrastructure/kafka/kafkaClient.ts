import { Kafka } from 'kafkajs';
import 'dotenv/config';

export const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'fitvibe-backend',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
    retry: {
        retries: 5,
        initialRetryTime: 300,
    },
});

export const TOPICS = {
    WATER_REMINDERS: 'water-reminders',
    WORKOUT_REMINDERS: 'workout-reminders',
} as const;
