import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import dayjs from "dayjs";

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
        console.log(error);
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

        if (isAuthorized) {
            const token = uuid();

            await db.collection("sessions").insertOne({ token, userId: user._id });

            return response.send({ ...user, token: token });
        }

        response.sendStatus(401);
    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});
server.get('/expense-control', async (request, response) => {
    const authorization = request.headers.authorization;
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
        console.log("Token error");
        return response.sendStatus(401);
        
    }

    try {
        const session = await db.collection("sessions").findOne({ token });

        if (!session) {
            console.log("Session not found");
            return response.sendStatus(404); 
        }

        const savedUser = await db.collection("users").findOne({ _id: session.userId });

        if (savedUser) {
            const expenses = await db.collection("expenses").find({
                idUser: (savedUser._id),
            }).toArray();

            response.send(expenses).status(201);

        } else {
            response.sendStatus(401);
            console.log("User not found");
        }

    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});
server.post("/new-expense", async (request, response) => {
    const { value, description } = request.body;
    const { authorization } = request.headers;
    const token = authorization?.replace("Bearer ", "");

    if (!token) return response.sendStatus(401);

    try {
        const session = await db.collection("sessions").findOne({ token });

        if (!session) return response.sendStatus(401);

        const dbUser = await db.collection("users").findOne({
            _id: session.userId,
        });

        if (dbUser) {
            await db.collection("expenses").insertOne({
                idUser: dbUser._id,
                value,
                description,
                date: dayjs().locale("pt-br").format("DD/MM"),
                type: "output",
            });
            response.sendStatus(201);

        } else {
            response.sendStatus(401);
        }
    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});
server.post("/new-deposit", async (request, response) => {
    const { value, description } = request.body;
    const { authorization } = request.headers;
    const token = authorization?.replace("Bearer ", "");

    if (!token) return response.sendStatus(401);

    try {
        const session = await db.collection("sessions").findOne({ token });

        if (!session) return response.sendStatus(401);

        const dbUser = await db.collection("users").findOne({
            _id: session.userId,
        });

        if (dbUser) {
            await db.collection("expenses").insertOne({
                idUser: dbUser._id,
                value,
                description,
                date: dayjs().locale("pt-br").format("DD/MM"),
                type: "input",
            });
            response.sendStatus(201);

        } else {
            response.sendStatus(401);
        }
    } catch (error) {
        console.log(error);
        response.sendStatus(500);
    }
});
server.listen(process.env.PORT, () => {
    console.log("Running at " + process.env.PORT);
});