import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import passport from 'passport';
import apiRouter from "./routes/index";
import 'dotenv/config';
import "@/infrastructure/passport_js/passport.config";
import { initMinioBucket } from "@/infrastructure/minio/minioClient";
import { startWaterReminderProducer } from "@/infrastructure/kafka/waterReminderProducer";
import { startWaterReminderConsumer } from "@/infrastructure/kafka/waterReminderConsumer";
import { startWorkoutReminderProducer } from "@/infrastructure/kafka/workoutReminderProducer";
import { startWorkoutReminderConsumer } from "@/infrastructure/kafka/workoutReminderConsumer";
import { startMealReminderProducer } from "@/infrastructure/kafka/mealReminderProducer";
import { startMealReminderConsumer } from "@/infrastructure/kafka/mealReminderConsumer";

const app = express();
const port = process.env.PORT || 3000;

app.use(fileUpload());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'fitvibe_secret_key',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send('FitVibe API Server is running!');
});

app.listen(port, async () => {
    console.log(`Server listening on port ${port}`);

    // Initialize MinIO S3 bucket
    await initMinioBucket();

    // Start Kafka notification pipelines
    try {
        await startWaterReminderProducer();
        await startWaterReminderConsumer();
        console.log('[Kafka] Water reminder pipeline started.');
    } catch (err: any) {
        console.warn('[Kafka] Water reminder pipeline skipped (Kafka broker not reachable at localhost:9092)');
    }

    try {
        await startWorkoutReminderProducer();
        await startWorkoutReminderConsumer();
        console.log('[Kafka] Workout reminder pipeline started.');
    } catch (err: any) {
        console.warn('[Kafka] Workout reminder pipeline skipped (Kafka broker not reachable at localhost:9092)');
    }

    try {
        await startMealReminderProducer();
        await startMealReminderConsumer();
        console.log('[Kafka] Meal reminder pipeline started.');
    } catch (err: any) {
        console.warn('[Kafka] Meal reminder pipeline skipped (Kafka broker not reachable at localhost:9092)');
    }
});