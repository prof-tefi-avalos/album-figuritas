// PASO 2 · Explorá el álbum con mongosh — RESUELTO
// (Los resultados son los de la semilla recién cargada.)

// 1 · Pararte en la base del álbum y ver qué colecciones tiene.
//   La colección se llama figuritas: el nombre lo eligió Mongoose a partir del
//   modelo 'Figurita' (minúscula + s). La base, album-leyendas, sale de la URI.
use album-leyendas
show collections
// → figuritas

// 2 · ¿Cuántas figuritas tiene el álbum?
db.figuritas.countDocuments()
// → 30

// 3 · ¿Cuáles te faltan? Solo número y jugador (sin _id).
//   cantidad: 0 → igualdad. El segundo argumento es la proyección.
db.figuritas.find({ cantidad: 0 }, { numero: 1, jugador: 1, _id: 0 })
// → 9: Batistuta (5), Messi (6), Pelé (9), Obdulio Varela (11), Henry (15),
//   Beckenbauer (18), Baggio (22), Cruyff (26), Bobby Charlton (29)

// 4 · Las repetidas de Argentina.
//   Dos condiciones en el mismo objeto = AND. $gt: mayor que.
db.figuritas.find({ seleccion: 'Argentina', cantidad: { $gt: 1 } })
// → Emiliano Martínez (cantidad 3) y Mario Kempes (cantidad 2)

// 5 · Las brillantes que te faltan.
db.figuritas.find({ brillante: true, cantidad: 0 }, { jugador: 1, _id: 0 })
// → Messi, Pelé y Cruyff

// 6 · Salió Messi: $inc suma sobre lo que hay en la base, sin leerlo antes.
db.figuritas.updateOne({ numero: 6 }, { $inc: { cantidad: 1 } })
// → matchedCount: 1, modifiedCount: 1 (Messi pasa de 0 a 1)

// 7 · Las de Uruguay: updateMany con el mismo $inc.
db.figuritas.updateMany({ seleccion: 'Uruguay' }, { $inc: { cantidad: 1 } })
// → matchedCount: 3, modifiedCount: 3 (con $inc siempre cambia algo, así que
//   coinciden; con un $set que ya estaba aplicado, modifiedCount sería menor)

// 8 · La trampa.
db.figuritas.find({ cantidad: '0' })
// → Nada. En la base cantidad es el NÚMERO 0 y el filtro compara con el TEXTO
//   '0': MongoDB no convierte tipos, así que no coincide (y no da error).
//   Ojo: en Mongoose, Figurita.find({ cantidad: '0' }) SÍ trae las que faltan, porque
//   Mongoose castea el filtro según el esquema (cantidad es Number). Por eso
//   req.query, que siempre trae strings, funciona en los filtros de la API.
