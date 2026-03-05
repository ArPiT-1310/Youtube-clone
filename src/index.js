//require('dotenv').config({path: './env'});

import dotenv from 'dotenv';
import connectDB from './db/db.js';

dotenv.config({ path: "./public/.env" });

connectDB();



/*
//IIFE function to connect DB
//usign async await to wait for response from the DB as it can it anywhere and might take time to respond
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        
        app.on("error", (error) => {
            console.log("ERRR: ", error);
        });

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on PORT ${process.env.PORT}`);
        })
    } catch(error) {
        console.log("ERROR: ", error);
    }
})();
*/