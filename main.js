const fs = require('fs');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');

const createDatabase = require('./modules/db');
const generarReciboConPlantilla = require('./pdf/generatePdfFromTemplate');
const auth = require('./modules/auth');
const logoPath = path.join(app.getPath('userData'), 'logo.png');


const crearEntidades = require('./modules/entidades');
let entidades;

const crearEmpresa = require('./modules/empresa');
let empresa;


let mainWindow;
let splashWindow;
let db;

/* =====================
   SPLASH
===================== */

function createSplash() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        show: true
    });

    splashWindow.loadFile(path.join(__dirname, 'splash/splash.html'));
}

/* =====================
   MAIN WINDOW
===================== */

function createMainWindow() {
    const session = auth.getSession();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    if (session) {
        mainWindow.loadFile('index.html'); // Dashboard
    } else {
        mainWindow.loadFile('views/login.html'); // Login
    }
}

/* =====================
   AUTO UPDATER
===================== */

function configurarAutoUpdate(mainWindow) {

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
        console.log('🔍 Buscando actualizaciones...');
    });

    autoUpdater.on('update-available', (info) => {
        console.log('⬇️ Actualización disponible:', info.version);
        mainWindow.webContents.send('update-available', info.version);
    });

    autoUpdater.on('update-not-available', () => {
        console.log('✅ No hay actualizaciones');
    });

    autoUpdater.on('error', (err) => {
        console.error('❌ Error en auto-update:', err);
    });

    autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send('update-progress', Math.round(progress.percent));
    });

    autoUpdater.on('update-downloaded', () => {
        console.log('✅ Actualización descargada');
        mainWindow.webContents.send('update-downloaded');
    });
}


/* =====================
   APP READY
===================== */

app.whenReady().then(async () => {
    createSplash();
    const start = Date.now();

    // 🔹 Inicializaciones reales
    db = createDatabase();
    entidades = crearEntidades(db);
    empresa = crearEmpresa(db);
    createMainWindow();


    // Esperar que la ventana principal esté lista
    await new Promise(resolve => {
        mainWindow.once('ready-to-show', resolve);
    });

    // 🔹 Garantizar splash mínimo visible
    const MIN_SPLASH_TIME = 2500;
    const elapsed = Date.now() - start;

    if (elapsed < MIN_SPLASH_TIME) {
        await new Promise(r => setTimeout(r, MIN_SPLASH_TIME - elapsed));
    }

    app.whenReady().then(() => {
        createMainWindow();
        configurarAutoUpdate(mainWindow);
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 3000);
    });


    if (splashWindow) splashWindow.close();
    mainWindow.show();
});


/* =====================
   IPC - UPDATES
===================== */

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});



/* =====================
   IPC - AUTH
===================== */

ipcMain.handle('login', (event, email, password) => {
    console.log('LOGIN INTENTO:', email);

    const token = auth.login(email, password);

    if (!token) {
        return {
            success: false,
            message: 'Usuario o contraseña incorrectos'
        };
    }

    return {
        success: true,
        token
    };
});

ipcMain.handle('get-session', () => {
    return auth.getSession();
});

ipcMain.handle('logout', () => {
    auth.logout();
    return true;
});


/* =====================
   IPC - EMPRESA
===================== */

ipcMain.handle('empresa-obtener', () => {
    return empresa.obtener();
});

ipcMain.handle('empresa-guardar', (e, data) => {
    if (!data.nombre) {
        return { success: false, message: 'Nombre obligatorio' };
    }

    empresa.actualizar(data);
    return { success: true };
});

/* =====================
   IPC - EMPRESA LOGO
===================== */

ipcMain.handle('empresa-cambiar-logo', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'PNG Images', extensions: ['png'] }
        ]
    });

    if (canceled || !filePaths.length) {
        return { success: false };
    }

    const origen = filePaths[0];
    const extension = path.extname(origen).toLowerCase();

    // 🔴 VALIDACIÓN REAL
    if (extension !== '.png') {
        return {
            success: false,
            message: 'El logo debe estar en formato PNG'
        };
    }

    const destino = path.join(app.getPath('userData'), 'logo.png');

    try {
        fs.copyFileSync(origen, destino);

        db.prepare(`
            UPDATE empresa
            SET logo = 'logo.png',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `).run();

        return { success: true };

    } catch (err) {
        console.error('❌ ERROR GUARDANDO LOGO:', err);
        return {
            success: false,
            message: 'No se pudo guardar el logo'
        };
    }
});


ipcMain.handle('empresa-logo-path', () => {
    return path.join(app.getPath('userData'), 'logo.png');
});




/* =====================
   IPC - APP
===================== */

ipcMain.on('exit-app', () => {
    app.quit();
});

ipcMain.handle('guardar-recibo', (event, recibo) => {
    const stmt = db.prepare('INSERT INTO recibos (data) VALUES (?)');
    const result = stmt.run(JSON.stringify(recibo));
    return { id: result.lastInsertRowid };
});

/* =====================
   IPC - PDF GENERATION
===================== */

ipcMain.handle('generar-pdf', async (event, recibo) => {
    try {
        // 🔹 1. Obtener datos de empresa
        const empresaData = empresa.obtener();

        // 🔹 2. Armar recibo completo (recibo + empresa)
        const reciboCompleto = {
            ...recibo,
            empresa: empresaData
        };

        // 🔹 3. Rutas base
        const documentsPath = app.getPath('documents');
        const baseFolder = path.join(documentsPath, 'Billerdoc-Recibos');

        if (!recibo.fecha) {
            throw new Error('El recibo no tiene fecha');
        }

        // YYYY-MM-DD
        const fechaRecibo = new Date(recibo.fecha + 'T00:00:00');

        if (isNaN(fechaRecibo.getTime())) {
            throw new Error('Fecha del recibo inválida');
        }

        const folderYear = fechaRecibo.getFullYear();
        const folderMonth = String(fechaRecibo.getMonth() + 1).padStart(2, '0');

        const monthFolder = path.join(
            baseFolder,
            `${folderYear}-${folderMonth}`
        );

        if (!fs.existsSync(monthFolder)) {
            fs.mkdirSync(monthFolder, { recursive: true });
        }

        // 🔹 4. Generar PDFs
        await generarReciboConPlantilla(reciboCompleto, 'ORIGINAL', monthFolder);
        await generarReciboConPlantilla(reciboCompleto, 'COPIA', monthFolder);

        return {
            success: true,
            folder: monthFolder
        };

    } catch (err) {
        console.error('❌ ERROR GENERANDO PDF:', err);
        return {
            success: false,
            message: err.message
        };
    }
});



/* =====================
   IPC - Obtener RECIBOS
===================== */

ipcMain.handle('get-recibos', () => {
    const rows = db.prepare(`
        SELECT id, data
        FROM recibos
        ORDER BY id DESC
    `).all();

    return rows.map(row => {
        const parsed = JSON.parse(row.data);
        return {
            id: row.id,
            cliente: parsed.cliente,
            fecha: parsed.fecha,
            total: parsed.total
        };
    });
});

/* =====================
   IPC - ABRIR RECIBO
===================== */


ipcMain.handle('abrir-recibo', async (event, id, tipo = 'ORIGINAL') => {
    try {
        const baseDir = path.join(
            app.getPath('documents'),
            'Billerdoc-Recibos'
        );

        if (!fs.existsSync(baseDir)) {
            throw new Error('La carpeta Billerdoc-Recibos no existe');
        }

        let encontrado = null;
        const sufijo = `-${id}_${tipo}.pdf`;

        function buscar(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    buscar(fullPath);
                    if (encontrado) return;
                } else {
                    if (entry.name.endsWith(sufijo)) {
                        encontrado = fullPath;
                        return;
                    }
                }
            }
        }

        buscar(baseDir);

        if (!encontrado) {
            throw new Error(`No se encontró el PDF ${tipo} del recibo ${id}`);
        }

        await shell.openPath(encontrado);
        return { success: true };

    } catch (err) {
        console.error('❌ ERROR ABRIENDO RECIBO:', err);
        return {
            success: false,
            message: err.message
        };
    }
});


ipcMain.handle('entidades-listar', () => {
    return entidades.listar();
});

ipcMain.handle('entidades-crear', (e, data) => {
    if (!data.nombre) {
        return { success: false, message: 'Nombre obligatorio' };
    }

    const id = entidades.crear(data);
    return { success: true, id };
});


/* =====================
   IPC - DASHBOARD CARDS
===================== */

ipcMain.handle('dashboard-stats', () => {

    const totalRecibos = db
        .prepare('SELECT COUNT(*) as total FROM recibos')
        .get().total;

    const ultimoRecibo = db.prepare(`
        SELECT created_at
        FROM recibos
        ORDER BY created_at DESC
        LIMIT 1
    `).get();

    const totalEntidades = db
        .prepare('SELECT COUNT(*) as total FROM entidades')
        .get().total;

    return {
        totalRecibos,
        totalEntidades
    };
});






/* =====================
   APP QUIT
===================== */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

