import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import passport from 'passport';
import apiRouter from "./routes/index";
import 'dotenv/config';
import "@/infrastructure/passport_js/passport.config";
import { startWaterReminderProducer } from "@/infrastructure/kafka/waterReminderProducer";
import { startWaterReminderConsumer } from "@/infrastructure/kafka/waterReminderConsumer";

const app = express();
const port = process.env.PORT;

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
    res.send('Hello, world!');
});

app.listen(port, async () => {
    console.log(`Server listening   
    on port ${port}`);

    // Start Kafka water reminder pipeline
    try {
        await startWaterReminderProducer();
        await startWaterReminderConsumer();
        console.log('[Kafka] Water reminder pipeline started.');
    } catch (err) {
        console.error('[Kafka] Failed to start reminder pipeline:', err);
    }
});