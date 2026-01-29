module.exports = (db) => {
    return {
        obtener() {
            return db
                .prepare('SELECT * FROM empresa WHERE id = 1')
                .get();
        },

        actualizar(data) {
            const stmt = db.prepare(`
                UPDATE empresa SET
                    nombre = ?,
                    nit = ?,
                    direccion = ?,
                    telefono = ?,
                    correo = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `);

            stmt.run(
                data.nombre,
                data.nit,
                data.direccion,
                data.telefono,
                data.correo
            );

            return true;
        }

    };
};
