import prisma from "../config/db.js"

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export async function isSlugUnique(slug: string): Promise<boolean> {
    const existing = await prisma.tag.findUnique({ where: { slug } })
    return existing === null
}
