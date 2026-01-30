// modules/entidades.js
module.exports = (db) => {
    return {
        /* =====================
           CREAR
        ===================== */
        crear(entidad) {
            const stmt = db.prepare(`
                INSERT INTO entidades (nombre, documento, telefono, ciudad)
                VALUES (?, ?, ?, ?)
            `);

            const result = stmt.run(
                entidad.nombre,
                entidad.documento || null,
                entidad.telefono || null,
                entidad.ciudad || null
            );

            return result.lastInsertRowid;
        },

        /* =====================
           LISTAR
        ===================== */
        listar() {
            return db.prepare(`
                SELECT *
                FROM entidades
                ORDER BY nombre ASC
            `).all();
        },

        /* =====================
           ACTUALIZAR ✏️
        ===================== */
        actualizar(id, entidad) {
            db.prepare(`
                UPDATE entidades
                SET
                    nombre = ?,
                    documento = ?,
                    telefono = ?,
                    ciudad = ?
                WHERE id = ?
            `).run(
                entidad.nombre,
                entidad.documento || null,
                entidad.telefono || null,
                entidad.ciudad || null,
                id
            );
        },

        /* =====================
           ELIMINAR 🗑
        ===================== */
        eliminar(id) {
            db.prepare(`
                DELETE FROM entidades
                WHERE id = ?
            `).run(id);
        }
    };
};
