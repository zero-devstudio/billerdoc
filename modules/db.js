const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

function createDatabase() {
    const dbPath = path.join(app.getPath('userData'), 'recibos.db');
    const db = new Database(dbPath);

    /* =========================
       RECIBOS
    ========================= */
    db.prepare(`
        CREATE TABLE IF NOT EXISTS recibos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    /* =========================
       ENTIDADES (CLIENTES)
    ========================= */
    db.prepare(`
        CREATE TABLE IF NOT EXISTS entidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            documento TEXT,
            telefono TEXT,
            ciudad TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    /* =========================
       EMPRESA (CUENTA)
    ========================= */
    db.prepare(`
        CREATE TABLE IF NOT EXISTS empresa (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            nombre TEXT NOT NULL,
            nit TEXT,
            direccion TEXT,
            telefono TEXT,
            correo TEXT,
            logo TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    /* =========================
       INSERT INICIAL EMPRESA
    ========================= */
    const existeEmpresa = db
        .prepare('SELECT COUNT(*) as total FROM empresa')
        .get().total;

    if (!existeEmpresa) {
        db.prepare(`
            INSERT INTO empresa (id, nombre)
            VALUES (1, 'Mi Empresa')
        `).run();
    }

    return db;
}

module.exports = createDatabase;