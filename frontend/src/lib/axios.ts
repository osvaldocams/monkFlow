import axios from "axios"

const api = axios.create({
    // En desarrollo usa el proxy "/api", en producción usará la variable de entorno real
    baseURL: import.meta.env.PROD ? import.meta.env.VITE_API_URL : "/api"
})

export default api