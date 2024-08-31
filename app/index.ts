import express from 'express';
import fileUpload from 'express-fileupload';
import apiRouter from "./routes/index";

const app = express();
const port = process.env.PORT;

app.use(fileUpload());
app.use(express.json());

app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.listen(port, () => {
    console.log(`Server listening   
    on port ${port}`);
});