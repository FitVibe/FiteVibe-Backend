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

    // Start Kafka water reminder pipeline
    try {
        await startWaterReminderProducer();
        await startWaterReminderConsumer();
        console.log('[Kafka] Water reminder pipeline started.');
    } catch (err) {
        console.error('[Kafka] Failed to start water reminder pipeline:', err);
    }

    // Start Kafka workout reminder pipeline
    try {
        await startWorkoutReminderProducer();
        await startWorkoutReminderConsumer();
        console.log('[Kafka] Workout reminder pipeline started.');
    } catch (err) {
        console.error('[Kafka] Failed to start workout reminder pipeline:', err);
    }
});