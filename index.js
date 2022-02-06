import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";

dotenv.config();
const server = express();
server.use(cors());
server.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("API_MyWallet");
});

server.post('/sign-up', async (request, response) => {
    const user = request.body;

    const userSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required(),
        confirm: joi.string().required()
    });

    const validation = userSchema.validate(user);

    if (validation.error) {
        return response.sendStatus(422);
    }

    try {
        const hashedPassword = bcrypt.hashSync(user.password, 10);

        await db.collection("users").insertOne({
            ...user,
            password: hashedPassword,
            confirm: hashedPassword
        });
        response.sendStatus(201);

    } catch (error) {
        response.sendStatus(500);
    }
});
server.post('/sign-in', async (request, response) => {
    const { email, password } = request.body;
    
    const loginSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
    });

    const validation = loginSchema.validate({ email, password });

    if (validation.error) {
        return response.sendStatus(422);
    }

    try {
        const user = await db.collection("users").findOne({ email });

        if (!user) {
            response.sendStatus(401);
            return;
        }

        const isAuthorized = bcrypt.compareSync(password, user.password);
        console.log(isAuthorized);
        if (isAuthorized) {
            const token = uuid();
            return response.send(token);
        }

        response.sendStatus(401);
    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});

server.listen(5000, () => {
    console.log("Running at http://localhost:5000")
});