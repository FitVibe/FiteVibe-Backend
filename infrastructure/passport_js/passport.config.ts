import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User from "../database/models/userModel";
import { MongoDBDatabase } from '../database/MongoDatabase';
import { Model } from 'mongoose';

// Initialize the database
const db = new MongoDBDatabase();

// Define passport-local strategy
passport.use(new LocalStrategy(async function verify(username: string, password:string, done:any) {
    try {
        const user = await db.query(User as Model<any>, { username });

        if (!user || user.length === 0) { 
            return done(null, false, { message: 'Incorrect username or password.' });
        }

        const foundUser = user[0];

        if (!foundUser.password) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }

        // Compare the hashed password using bcrypt
        const isMatch = await bcrypt.compare(password, foundUser.password);

        if (!isMatch) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }

        return done(null, foundUser);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user: any, done: any) => {
    done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
    try {
        const user = await db.query(User as Model<any>, { _id: id });
        done(null, user && user.length > 0 ? user[0] : null);
    } catch (err) {
        done(err);
    }
});
