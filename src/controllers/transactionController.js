import { ObjectId } from "mongodb";
import db from "../database.js";

export async function newExpense(request, response) {
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
};

export async function newDeposit(request, response) {
    const { value, description } = request.body;

    try {
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
};

export async function expenseControl(request, response) {
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
};