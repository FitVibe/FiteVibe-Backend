import express from 'express';
import fileUpload from 'express-fileupload';
import passport from 'passport';
import apiRouter from "./routes/index";
import 'dotenv/config';
import "@/infrastructure/passport_js/passport.config";

const app = express();
const port = process.env.PORT;

app.use(fileUpload());
app.use(express.json());
app.use(passport.initialize());

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.listen(port, () => {
    console.log(`Server listening   
    on port ${port}`);
});