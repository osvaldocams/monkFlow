import { Request, Response } from 'express'
import { generateSlug, isSlugUnique } from '../helpers/index.js'
import prisma from '../config/db.js'
import { Prisma } from '@prisma/client'



interface CreateTagInput {
    name: string,
    color?: string
}
interface UpdateTagInput {
    name?: string,
    color?: string
}

export class TagControllers {

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
    static getTagById = async (req: Request<{ id: string }>, res: Response) => {
        console.log("--> entró a getById coon id", req.params.id)
        try {
            const { id } = req.params
            const tag = await prisma.tag.findUnique({
                where: { id }
            })
            if (!tag) {
                return res.status(404).json({ error: 'Tag not found' })
            }
            res.status(200).json(tag)

        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Error fetching tag' })
        }
    }

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

    static updateTag = async (req: Request<{ id: string }, {}, UpdateTagInput>, res: Response) => {
        try {
            const { id } = req.params
            const { name, color } = req.body

            //1. buscar tag existente verificar que existe
            const existingTag = await prisma.tag.findUnique({ where: { id } })

            if (!existingTag) {
                return res.status(404).json({ error: 'Tag not found' })
            }

            //2. preparar datos para actualización
            const data: { name?: string; slug?: string; color?: string } = {}

            if (name !== undefined) {
                data.name = name
                data.slug = generateSlug(name)
                //verificar unicidad si el slug cambia
                if (data.slug !== existingTag.slug) {
                    if (!(await isSlugUnique(data.slug))) {
                        return res.status(409).json({ error: 'A tag with this name already exist' })
                    }
                }
            }
            if (color !== undefined) {
                data.color = color
            }

            //3. actualizar 
            const updatedTag = await prisma.tag.update({
                where: { id },
                data
            })

            //respuesta
            res.status(200).json(updatedTag)

        } catch (error) {
            console.log(error)
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return res.status(404).json({ error: "Tag not found" })
                }
            }
            res.status(500).json({ error: 'Error updating tag' })
        }
    }
    static deleteTag = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const { id } = req.params

            const tag = await prisma.tag.findUnique({
                where: { id },
                include: {
                    movements: { select: { id: true } }
                }
            })

            if (!tag) {
                return res.status(404).json({ error: 'Tag not found' })
            }

            if (tag.movements.length > 0) {
                return res.status(409).json({
                    error: `Cannot delete tag '${tag.name}' - it is associated with ${tag.movements.length} movement(s)`
                })
            }

            await prisma.tag.delete({
                where: { id }
            })

            res.status(200).json({ message: `Tag '${tag.name}' deleted successfully` })

        } catch (error) {
            console.log(error)
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return res.status(404).json({ error: 'Tag not found' })
                }
            }
            res.status(500).json({ error: 'Error deleting tag' })
        }
    }
}
