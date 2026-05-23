import { Request, Response } from 'express'
import prisma from '../config/db.js'
import { AccountKind } from '@prisma/client'; // 👈 importamos el type enum de kind
import { Prisma } from '@prisma/client'; // 👈 importamos Prisma para manejar errores específicos

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
    static getAllAccounts = async (req: Request, res: Response) => {
        try {
            const accounts = await prisma.account.findMany()
            res.status(200).json(accounts)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: "Error fetching accounts" })
        }
    }
    static getAccountById = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const { id } = req.params

            const account = await prisma.account.findUnique({
                where: { id }
            })

            // Si la cuenta no existe en Neon, rompemos el ciclo con un 404
            if (!account) {
                return res.status(404).json({ error: "Account not found" })
            }

            res.status(200).json(account)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: "Error fetching account" })
        }
    }
    static updateAccount = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const { id } = req.params
            const { name } = req.body // 👈 Restricción absoluta: solo extraemos el name

            // Actualización quirúrgica en Neon
            const updatedAccount = await prisma.account.update({
                where: { id },
                data: { name } // 👈 Solo muta el nombre de la cuenta
            })

            res.status(200).json(updatedAccount)
        } catch (error) {
            console.error(error)
            // Error P2025 es el código de Prisma para "Registro no encontrado"
            if(error instanceof Prisma.PrismaClientKnownRequestError){
                if (error.code === 'P2025') {
                    return res.status(404).json({ error: "Account not found" });
                }
            }
            res.status(500).json({ error: "Error updating account" })
        }
    }
    static deleteAccount = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const { id } = req.params;

            await prisma.account.delete({
                where: {id}
            });

            res.json({ message: "Account deleted successfully" });
        } catch (error) {
            console.error(error)
            // Error P2025 es el código de Prisma para "Registro no encontrado"
            if(error instanceof Prisma.PrismaClientKnownRequestError){
                if (error.code === 'P2025') {
                    return res.status(404).json({ error: "Account not found" });
                }
            }
            res.status(500).json({ error: "Error deleting account" });
        }
    }
}