import { PrismaClient } from '@prisma/client'
import colors from 'colors'

// Tipamos el objeto global de Node para que TypeScript no se queje
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Si ya existe una instancia global, la reutilizamos; si no, creamos una nueva
export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function connectDB() {
    try {
        await prisma.$connect()
        console.log(colors.blue.bold('✅ Conexión exitosa a la Base de Datos (Neon Postgres)'))
    } catch (error) {
        console.error(colors.red.bold('❌ Error al conectar a la Base de Datos:'), error)
        process.exit(1) // Detiene por completo la ejecución del servidor
    }
}

export default prisma