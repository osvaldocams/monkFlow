import { Request, Response } from 'express'

export class TagControllers {

    static getAllTags = async (req: Request, res: Response) => {
        res.json({ message: "tags hello world" })
    }
}
