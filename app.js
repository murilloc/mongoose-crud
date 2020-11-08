import express from 'express';
import mongoose from 'mongoose';
import router from './routes/accountRouter.js';
import dotenv from 'dotenv';
const app = express();
app.use(express.json());
app.use(router);


dotenv.config({
    path: process.env.NODE_ENV === "development" ? ".env.development" : ".env"
})


console.log(process.env.DB_PASS);
console.log(process.env.DB_USER);
console.log(process.env.DB_HOST);

(async () => {
    try {
        if (process.env.NODE_ENV === 'development') {

            console.log('Connecting to Local Database');
            await mongoose.connect(process.env.DB_HOST, {
                auth: {
                    authSource: "admin"
                },
                user: process.env.DB_USER,
                pass: process.env.DB_PASS,
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Local database connected!');
        } else /*if (process.env.NODE_ENV === 'development')*/ {
            console.log('Connecting to cloud Database:' + process.env.DB_HOST);
            await mongoose.connect(process.env.DB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log('Cloud database connected!');
        }
    } catch (error) {
        console.log('MongoDb Connection failure:' + error);
    }

})();

app.listen(process.env.PORT, () => {
    console.log('Api started an listenning on port 3000')
})

