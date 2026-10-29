import { Schema, model } from 'mongoose'

export const SELECCIONES = [
  'Argentina', 'Brasil', 'Uruguay', 'Francia', 'Alemania', 'Italia', 'España', 'Países Bajos', 'Inglaterra',
]

export const POSICIONES = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero']

// ════════════════════════════════════════════════════════════════════════════
// PASO 1 · El esquema de una figurita
//
// cantidad es cuántas TENÉS de esa figurita:
//   0 → te falta · 1 → la tenés pegada · 2 o más → tenés repetidas para cambiar
// ════════════════════════════════════════════════════════════════════════════
const figuritaSchema = new Schema({
  numero: {
    type: Number,
    required: [true, 'El número es obligatorio'],
    min: [1, 'El álbum va de la 1 a la 40'],
    max: [40, 'El álbum va de la 1 a la 40'],
    // unique NO es un validador: crea un índice en MongoDB. Si se repite el
    // número, el error lo tira MongoDB (E11000) y el errorHandler lo pasa a 409.
    unique: true,
  },
  jugador: {
    type: String,
    required: [true, 'El jugador es obligatorio'],
    trim: true,
  },
  seleccion: {
    type: String,
    required: [true, 'La selección es obligatoria'],
    enum: { values: SELECCIONES, message: '"{VALUE}" no está en el álbum' },
  },
  posicion: {
    type: String,
    required: [true, 'La posición es obligatoria'],
    enum: { values: POSICIONES, message: '"{VALUE}" no es una posición válida' },
  },
  cantidad: {
    type: Number,
    min: [0, 'La cantidad no puede ser negativa'],
    default: 0,
  },
  brillante: {
    type: Boolean,
    default: false,
  },
})

// Esta vez no hace falta el tercer argumento: Mongoose pluraliza 'Figurita'
// agregando una s y en minúscula → 'figuritas', que es justo lo que queremos.
export default model('Figurita', figuritaSchema)
