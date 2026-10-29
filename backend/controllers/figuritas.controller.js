import Figurita from '../models/figurita.model.js'
import { crearError } from '../middlewares/errorHandler.js'

// Todas las funciones son async y ninguna tiene try/catch: en Express 5, un
// error dentro de una función async (un throw nuestro o un error de Mongoose)
// llega solo al errorHandler. Todas responden { data, error }.

// GET /api/figuritas/resumen → { total, pegadas, faltan, repetidas }
// (Ya viene hecho: es el ejemplo.) countDocuments(filtro) recibe el mismo
// filtro que find, pero en vez de los documentos devuelve cuántos son.
export async function obtenerResumen(req, res) {
  const total = await Figurita.countDocuments()
  const faltan = await Figurita.countDocuments({ cantidad: 0 })
  const repetidas = await Figurita.countDocuments({ cantidad: { $gt: 1 } })

  res.json({ data: { total, pegadas: total - faltan, faltan, repetidas }, error: null })
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 3 · a. GET /api/figuritas
//   ?estado=faltan | pegadas | repetidas   y/o   ?seleccion=Argentina
//
// Los filtros son los mismos objetos que escribiste en mongosh (PASO 2): un
// operador como $gt va en el lugar del valor. Dos condiciones en el mismo
// objeto = AND, así que ?estado=repetidas&seleccion=Argentina se combinan solas.
//
// Armamos el filtro a mano con solo lo que permitimos: si pasáramos req.query
// entero, el cliente podría filtrar por cualquier campo (o mandar operadores).
// ════════════════════════════════════════════════════════════════════════════
export async function listarFiguritas(req, res) {
  const filtro = {}

  if (req.query.seleccion) filtro.seleccion = req.query.seleccion

  if (req.query.estado === 'faltan') filtro.cantidad = 0
  if (req.query.estado === 'pegadas') filtro.cantidad = { $gte: 1 }
  if (req.query.estado === 'repetidas') filtro.cantidad = { $gt: 1 }

  // ➕ PLUS 2 · ?q=mes busca en el nombre del jugador, sin importar mayúsculas.
  if (req.query.q) filtro.jugador = { $regex: req.query.q, $options: 'i' }

  // ➕ PLUS 1 · sort({ numero: 1 }): de menor a mayor (-1 sería al revés). Sin
  // sort, MongoDB no garantiza ningún orden: una figurita agregada después
  // (la 31) aparece donde caiga, normalmente al final.
  const figuritas = await Figurita.find(filtro).sort({ numero: 1 })

  res.json({ data: figuritas, error: null })
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 3 · b. POST /api/figuritas
//
// new Figurita(req.body) arma el documento en memoria (castea '31' a 31, aplica
// trim, pone los default cantidad: 0 y brillante: false y descarta lo que no
// está en el esquema). save() valida y lo inserta. Si algo falla: ValidationError
// → 400 con los mensajes por campo; número repetido → E11000 → 409.
// ════════════════════════════════════════════════════════════════════════════
export async function crearFigurita(req, res) {
  const figurita = new Figurita(req.body)
  await figurita.save()

  res.status(201).json({ data: figurita, error: null })
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 3 · c. PATCH /api/figuritas/:id/sumar   (🎁 me salió en un sobre)
//
// $inc suma sobre el valor que hay EN LA BASE, en una sola operación: no hace
// falta leer la cantidad antes. Si dos personas tocan +1 a la vez, quedan las
// dos sumas (con "leer, sumar 1 y guardar", una pisaría a la otra).
//
// returnDocument: 'after' → devuelve el documento ya actualizado (sin esto,
// devuelve el de antes del cambio). null → el id no existe → 404.
// Un id con forma inválida ('abc') → CastError → 400 en el errorHandler.
// ════════════════════════════════════════════════════════════════════════════
export async function sumarFigurita(req, res) {
  const figurita = await Figurita.findByIdAndUpdate(
    req.params.id,
    { $inc: { cantidad: 1 } },
    { returnDocument: 'after' },
  )

  if (!figurita) {
    throw crearError('No existe esa figurita', 404)
  }

  res.json({ data: figurita, error: null })
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 3 · d. PATCH /api/figuritas/:id/restar   (🔁 la cambié)
//
// No se puede restar una figurita que no tenés (cantidad 0). ¿Por qué no
// alcanza con el min: 0 del esquema? Porque los validadores de update no corren
// con $inc (ni siquiera con runValidators: true): Mongoose solo valida $set,
// $unset, $push, $addToSet, $pull y $pullAll. Con $inc quedaría en -1.
//
// La solución es poner la condición EN EL FILTRO: "la figurita con este _id Y
// con cantidad mayor a 0". Si tiene 0, el filtro no encuentra nada, no se
// modifica nada y devuelve null. Como es un filtro con más de un campo, se usa
// findOneAndUpdate (findByIdAndUpdate solo recibe el id).
// ════════════════════════════════════════════════════════════════════════════
export async function restarFigurita(req, res) {
  const figurita = await Figurita.findOneAndUpdate(
    { _id: req.params.id, cantidad: { $gt: 0 } },
    { $inc: { cantidad: -1 } },
    { returnDocument: 'after' },
  )

  if (!figurita) {
    // ➕ PLUS 3 · null puede ser "no existe" o "existe pero tiene 0".
    // exists() devuelve { _id } o null, sin traer el documento entero.
    const existe = await Figurita.exists({ _id: req.params.id })
    if (!existe) throw crearError('No existe esa figurita', 404)

    throw crearError('No la tenés: no la podés cambiar', 409)
  }

  res.json({ data: figurita, error: null })
}
