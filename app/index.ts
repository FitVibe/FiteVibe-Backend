import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import passport from 'passport';
import apiRouter from "./routes/index";
import 'dotenv/config';
import "@/infrastructure/database/models";
import "@/infrastructure/passport_js/passport.config";
import { initMinioBucket } from "@/infrastructure/minio/minioClient";
import { startKafkaPipelines } from "@/infrastructure/kafka";
import { startCronJobs } from "@/infrastructure/cron";

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

    // Start all system background cron jobs
    startCronJobs();

    // Start all Kafka notification pipelines
    await startKafkaPipelines();
});