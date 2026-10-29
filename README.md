# ⚽ Álbum de Leyendas — Solución (docente)

```bash
cd backend && npm install && cp .env.example .env && npm run semilla && npm run dev
cd frontend && npm install && npm run dev
```

Los archivos resueltos tienen comentarios por **PASO** (los mismos de la consigna) con el porqué de cada línea:

- `backend/models/figurita.model.js` → PASO 1.
- `backend/consultas.mongosh.js` → PASO 2, con los resultados esperados.
- `backend/controllers/figuritas.controller.js` → PASO 3 (a–d) y los tres plus (➕).
- `backend/server.js` → PASO 4 · b (CORS). `backend/package.json` suma `cors`.
- `frontend/.env.development` → PASO 4 · a (`API_URL` → `VITE_API_URL`).
- `frontend/src/servicios/api.js` → PASO 4 · c (`respuesta.data` → `respuesta.data.data`).

Todo lo demás es igual que en `inicio/`.

## Cronograma sugerido (40 min)

| Min | Paso |
|---|---|
| 0–3 | Arrancar las dos terminales. Avisar que el álbum va a dar error hasta el PASO 4. |
| 3–11 | PASO 1 · esquema + `npm run semilla` |
| 11–18 | PASO 2 · mongosh |
| 18–30 | PASO 3 · controller (probar en el navegador) |
| 30–38 | PASO 4 · los tres bugs de conexión |
| 38–40 | Ver el álbum andando · presentar `DEPLOY.md` como tarea |

Si el grupo viene lento, el PASO 2 se puede hacer a coro con vos proyectando, y el plus queda para casa.

## Lo que tiene que quedar claro al corregir

| Tema | Dónde se ve |
|---|---|
| Esquema: `required`, `min`/`max`, `enum` con `{VALUE}`, `default`, `trim` con mensajes propios | `figurita.model.js` |
| `unique` no es un validador: es un índice, y el error es E11000 → 409 | modelo + `errorHandler.js` |
| Mongoose pluraliza `Figurita` → `figuritas` (acá no hace falta el tercer argumento) | modelo · `show collections` |
| Los filtros de mongosh y de Mongoose son el mismo objeto (`{ cantidad: { $gt: 1 } }`) | PASO 2 → `listarFiguritas` |
| Armar el filtro a mano desde `req.query` (no pasar `req.query` entero) | `listarFiguritas` |
| `$inc` en vez de leer-sumar-guardar | `sumarFigurita` · `restarFigurita` |
| `returnDocument: 'after'` | `sumarFigurita` · `restarFigurita` |
| `$inc` **no** pasa por los validadores (ni con `runValidators`): la condición va en el filtro | `restarFigurita` |
| `null` → 404/409 (lo tiramos nosotros) vs. id inválido → `CastError` → 400 | controller + `errorHandler.js` |
| Solo las variables `VITE_` llegan al navegador | `.env.development` |
| CORS es del navegador: la API autoriza el origen del front | `server.js` |
| `respuesta.data` de axios es el cuerpo; nuestra API envuelve en `{ data, error }` | `api.js` |
| axios tira error con status ≠ 2xx (fetch no): la respuesta está en `err.response` | `api.js` (ya hecho, vale comentarlo) |

## Errores que vas a ver mientras lo hacen

| Lo que pasa | Por qué |
|---|---|
| La semilla avisa que se guardaron vacías | Esquema vacío o campos mal escritos: el modo strict descarta lo que no está en el esquema. |
| `?estado=faltan` trae todas | Escribieron `filtro.estado = …` en vez de `filtro.cantidad = …`, o compararon `req.query.estado == 'falta'` (sin n). |
| 🎁 +1 deja el aviso con la cantidad vieja | Falta `returnDocument: 'after'`. |
| 🔁 −1 en Pelé lo deja en −1 | Usaron `findByIdAndUpdate` con `$inc: -1` (con o sin `runValidators`): falta la condición `cantidad: { $gt: 0 }` en el filtro. |
| Usaron `findById` + `figurita.cantidad--` + `save()` | Funciona y valida el `min: 0`, pero son dos operaciones (la carrera de "para pensar 2"). Vale como solución, para charlar. |
| Agregar con todo vacío da 500 | En `crearFigurita` hicieron `Figurita.create()` sin `await`, o atajaron el error con un try/catch que responde 500. |
| *"Eso no es la API: el pedido fue a http://localhost:5173/…"* aun después de renombrar a `VITE_API_URL` | No reiniciaron `npm run dev`, o escribieron `VITE_API_URL = …` con espacios / comillas raras. |
| `Cannot find package 'cors'` | Agregaron el `import` pero no corrieron `npm install cors` en `backend/`. |
| Pusieron `app.use(cors())` debajo de las rutas | Los middlewares corren en orden: tiene que ir antes de `app.use('/api/figuritas', …)`. |
| `cors({ origin: 'http://localhost:5173/' })` sigue bloqueado | La `/` final: el origen no lleva path. |
| Cambiaron `return respuesta.data` por `respuesta.data.data` en **cada** función de abajo | Funciona, pero es repetir: el lugar es `pedir`. |
| *"Cannot read properties of undefined (reading 'map')"* | Pusieron `respuesta.data.data.data`, o tocaron `App.jsx`. |

## Respuestas de "para pensar"

1. Los validadores de update solo corren con `$set`, `$unset`, `$push`, `$addToSet`, `$pull` y `$pullAll`. Con `$inc`, aunque esté `runValidators: true`, Pelé queda en −1 (verificado con Mongoose 9). Por eso la condición va en el filtro: "con este `_id` **y** `cantidad > 0`"; si no la cumple, no se modifica nada y vuelve `null`.
2. Leer-sumar-guardar son dos operaciones: si los dos leen `1` al mismo tiempo, los dos guardan `2` y se pierde una figurita. `$inc` lo hace MongoDB en una sola operación atómica sobre el valor que hay en ese momento: quedan `3`.
3. El filtro lo armamos nosotros (`filtro.cantidad = 0`, un número), y además Mongoose **castea** el filtro según el esquema: `Figurita.find({ cantidad: '0' })` también funcionaría. mongosh habla directo con MongoDB, que no convierte tipos.
4. Todo lo que empieza con `VITE_` termina escrito dentro del JavaScript que se descarga cualquier visitante (`vite build` lo reemplaza por el texto). La URL de la API es pública de todas formas; la contraseña de Atlas tiene que quedar en el servidor (Render), que es el único que habla con la base.
5. No. CORS es una regla **del navegador** para proteger al usuario: evita que una página cualquiera lea, con sus cookies, respuestas de otra web. Postman, curl o un servidor ignoran CORS. Para proteger la API hace falta autenticación (más adelante en la cursada).

## Plus

1. `.sort({ numero: 1 })` en `listarFiguritas`. Sin `sort`, MongoDB no garantiza orden (en la práctica, el de inserción: la 31 aparece al final, aunque se agregue antes que otra).
2. `filtro.jugador = { $regex: req.query.q, $options: 'i' }`. (Para producción convendría escapar el texto del usuario; para el ejercicio, alcanza.)
3. Después del `null`, `Figurita.exists({ _id })` distingue: no existe → 404; existe → 409.

## Deploy

`DEPLOY.md` (el mismo que tienen los alumnos) lleva el ejercicio a Atlas + Render + Vercel. Verificado localmente: `npm start` arranca sin `.env` (`--env-file-if-exists`, Node ≥ 22.9) con las variables de entorno, y `vite build` mete `VITE_API_URL` en el bundle. Lo que más vas a ver: CORS por la `/` final en `FRONTEND_URL`, y `VITE_API_URL` agregada después del primer deploy sin hacer *Redeploy*.
