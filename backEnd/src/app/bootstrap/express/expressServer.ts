import cors from 'cors'
import express, { Router } from 'express'
import { handleExpressError } from '../exceptions/handleExpressError';

import { Express, NextFunction, Response, Request } from "express";

import passport from "passport"
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { apiV1 } from '@/routes/apiV1';
import MongoStore from 'connect-mongo'
import { cwd } from 'process';
import path from 'path';
import sharp from 'sharp'
import { UserRepository } from '@/app/http/controllers/auth/repository/userRepository';
import { Note } from '@/app/models/noteSchema';
import Stripe from "stripe";
export function expressServer(app: Express, PORT: number) {
    const router = Router()
    const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)

    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
    }));



    const currentDir = cwd()
    app.use(express.static(path.join(currentDir, "public")));


    // app.use(express.json())
    // app.use(express.urlencoded({ extended: true }))

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ limit: "10mb", extended: true }));

   


    app.get('/', async (req: Request, res: Response) => {
        res.json({ message: "server is up" })
    })

    app.get('/health', (req: Request, res: Response) => {
        res.status(200).json({ status: "ok" })
    })







    const isProduction = process.env.NODE_ENV === 'production'
    const sess: session.SessionOptions = {
        store: MongoStore.create({
            mongoUrl: process.env.DB_URL,
            collectionName: "sessions",
        }),
        secret: process.env.COOKIE_KEY as string,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
        }
    }



    if (isProduction) {
        app.set('trust proxy', 1) // trust first proxy
    }

    app.use(session(sess))
    app.use(passport.initialize())
    app.use(passport.session())


    // --- GOOGLE STRATEGY ---
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
                callbackURL: process.env.CALL_BACK_URL,
                //  passReqToCallback: true,
            },
            async (accessToken: string, refreshToken: string, profile: any, done: any) => {


                const userRepo = UserRepository.getInstance()
                const user = await userRepo.createUser(profile, { accessToken, refreshToken })
                return done(null, user)
            }
        )
    )


    passport.serializeUser((user: any, done) => {
        // console.log('user in seri:::', user)
        done(null, user); // store only the user ID
    });


    // Called on every request that uses the session.
    passport.deserializeUser(async (obj: any, done) => {
        try {
            // here check if user exist in db
            done(null, obj);
        } catch (err) {
            done(err);
        }
    });





    app.get(
        "/auth/google",
        passport.authenticate("google",
            {
                scope: [
                    "profile",
                    "email",
                    "https://www.googleapis.com/auth/drive.readonly",
                    "https://www.googleapis.com/auth/drive.file",
                ],
                accessType: "offline",
                prompt: "consent",

            })
    )


    app.get(
        "/auth/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/auth/login",
            successRedirect: process.env.SUCCESS_REDIRECT_URL, // frontend route
        })
    )


    app.get('/api/v1/auth/me', (req: any, res: any) => {
        if (!req.user) return res.status(401).json({ error: 'Not logged in' });
        res.json(req.user);
    });



    app.get("/api/v1/logout", (req: Request, res: Response, next: NextFunction) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            }

            // Destroy the session completely
            req.session.destroy((sessionErr) => {
                if (sessionErr) {
                    return res.status(500).json({ error: "Failed to destroy session" });
                }

                // Clear session cookie
                res.clearCookie("connect.sid", {
                    path: "/",
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production", // only secure in prod
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                });

                return res.json({ message: "Logged out successfully" });
            });
        });
    });





    apiV1(app, router)

 app.use(handleExpressError)





    app.listen(PORT, () => {
        console.log(`Express server is running at http://localhost:${PORT}`)
    })
}
