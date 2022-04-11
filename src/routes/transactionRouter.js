import { Router } from "express";
import { newExpense, newDeposit, expenseControl } from "../controllers/transactionController.js";

const transactionRouter = Router();

transactionRouter.get("/expense-control", expenseControl);
transactionRouter.post("/new-deposit", )
transactionRouter.post("/new-expense")
