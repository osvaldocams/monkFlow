import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import Router from './router.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Router />
    </StrictMode>,
)
