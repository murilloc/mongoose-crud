import express from 'express';
import mongoose from 'mongoose';
import accountRouter from './routes/accountRouter.js';

// using IIFE
(async () => {
    try {
        await mongoose.connect('mongodb://mongoserver/igti', {
            auth: {
                authSource: "admin"
            },
            user: "root",
            pass: "changeme!",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
        console.log('database connected');
    } catch (error) {
        console.log('MongoDb Connection failure:' + error);
    }
})();


const app = express();
app.use(express.json());
app.use('/',accountRouter);


app.listen(3000, () => {
    console.log('Api started an listenning on port 3000')
})

