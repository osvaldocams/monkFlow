import { Request, Response } from 'express'
import prisma from '../config/db.js'
import { AccountKind } from '@prisma/client'; // 👈 importamos el type enum de kind

export class AccountControllers {
    static createAccount = async (req: Request, res: Response) => {
        try { 
            const { name, kind, balance } = req.body;
            const newAccount = await prisma.account.create({
                data: {
                    name,
                    kind: kind as AccountKind, // 👈 Le aseguramos a TS que es el Enum correcto
                    balance: balance ? Number(balance) : 0 // 👈 Nos aseguramos de que sea un número flotante puro
                }
            })
            res.status(201).json(newAccount)
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error creating account" })
        }
    }
}