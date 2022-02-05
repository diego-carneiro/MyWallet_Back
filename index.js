import express from "express";
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
    db = mongoClient.db("API_MyWallet")
});

server.post('/', async (request, response) => {
    const 

});


server.listen(5000, () => {
    console.log("Running at http://localhost:5000")
});