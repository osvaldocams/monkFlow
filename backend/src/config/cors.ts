import { CorsOptions } from "cors"

const whitelist = [
    process.env.FRONTEND_URL, 
    'http://localhost:5173',
].filter(Boolean) as string[]

export const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        // En desarrollo, permitimos peticiones sin 'origin' (como Postman o Server-to-Server)
        if (!origin) {
            return callback(null, true);
        }

        if (whitelist.includes(origin)) {
            return callback(null, true);
        } else {
            // Error descriptivo para debuggear rápido en la terminal
            return callback(new Error(`CORS Error: Origin ${origin} is not allowed by whitelist`));
        }
    },
    optionsSuccessStatus: 200
};
