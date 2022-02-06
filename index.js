import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

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
    });
    const validation = userSchema.validate(user);

    if (validation.error) {
        return response.sendStatus(422);
    }

    try {
        await db.collection("users").insertOne(user);
        response.sendStatus(201);
    } catch (error) {
        response.sendStatus(500);
    }



});


server.listen(5000, () => {
    console.log("Running at http://localhost:5000")
});