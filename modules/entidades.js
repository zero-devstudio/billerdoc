// modules/entidades.js
module.exports = (db) => {
    return {
        crear(entidad) {
            const stmt = db.prepare(`
                INSERT INTO entidades (nombre, documento, telefono, ciudad)
                VALUES (?, ?, ?, ?)
            `);

            const result = stmt.run(
                entidad.nombre,
                entidad.documento,
                entidad.telefono,
                entidad.ciudad
            );

            return result.lastInsertRowid;
        },

        listar() {
            return db.prepare(`
                SELECT * FROM entidades
                ORDER BY nombre DESC
            `).all();
        }
    };
};
