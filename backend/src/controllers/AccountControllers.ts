import { Request, Response } from 'express'

export class AccountControllers {
    static testConnection = async (req: Request, res: Response) => {
        res.json({ msg: 'MVC configurado correctamente!' })
    }
}