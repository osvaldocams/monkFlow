import { Request, Response } from 'express'
import { generateSlug, isSlugUnique } from '../helpers/index.js'
import prisma from '../config/db.js'



interface CreateTagInput {
    name: string,
    color?: string
}

export class TagControllers {

    static createTag = async (req: Request<{}, {}, CreateTagInput>, res: Response) => {
        try {
            const { name, color } = req.body
            const slug = generateSlug(name)

            if (!(await isSlugUnique(slug))) {
                return res.status(409).json({ error: "A tag with this name already exist" })
            }

            const tag = await prisma.tag.create({
                data: {
                    name,
                    slug,
                    color: color || '#6B7280'
                }
            })
            res.status(201).json(tag)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: "error creating tag" })
        }
    }

    static getAllTags = async (req: Request, res: Response) => {
        try {
            const tags = await prisma.tag.findMany({
                orderBy: {
                    name: 'asc'
                }
            })
            res.status(200).json(tags)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Error fetching tags' })
        }
    }
}
