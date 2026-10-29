import express from 'express'
import cors from 'cors'
import { conectarDB } from './config/db.js'
import figuritasRouter from './routes/figuritas.routes.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()

// ════════════════════════════════════════════════════════════════════════════
// PASO 4 · b. CORS
//
// El navegador deja que una página le pida datos a OTRO origen (otro dominio o
// puerto) solo si ese servidor lo autoriza con el header
// Access-Control-Allow-Origin. El front corre en http://localhost:5173 y la API
// en http://localhost:3000: son orígenes distintos. Sin esto, la API responde
// igual, pero el navegador no le deja ver la respuesta al front ("blocked by
// CORS policy" en la consola).
//
// Desde el navegador directo (http://localhost:3000/api/figuritas) o Postman
// anda siempre: CORS es una regla del navegador para pedidos entre orígenes.
//
// origin: solo dejamos entrar a NUESTRO front. La dirección sale del .env:
// http://localhost:5173 en tu compu y la URL de Vercel en Render. (Si la
// variable no existe, cors deja entrar a cualquiera: '*'.)
// ════════════════════════════════════════════════════════════════════════════
app.use(cors({ origin: process.env.FRONTEND_URL }))

app.use(express.json())

// Para probar rápido que la API está viva (en Render, es lo primero que mirás).
app.get('/', (req, res) => {
  res.json({ data: 'API del Álbum de Leyendas ⚽ · probá /api/figuritas', error: null })
})

app.use('/api/figuritas', figuritasRouter)

app.use(errorHandler)

// En Render, PORT lo pone la plataforma: no hay que configurarlo.
const PORT = process.env.PORT ?? 3000

await conectarDB()

app.listen(PORT, () => {
  console.log(`🚀 API en http://localhost:${PORT}/api/figuritas`)
})
