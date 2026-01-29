const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

app.disableHardwareAcceleration();

/* =====================
   IMPORTS
===================== */

const createDatabase = require('./modules/db');
const generarReciboConPlantilla = require('./pdf/generatePdfFromTemplate');
const auth = require('./modules/auth');

const crearEntidades = require('./modules/entidades');
const crearEmpresa = require('./modules/empresa');

/* =====================
   GLOBAL STATE
===================== */

let mainWindow;
let splashWindow;
let db;
let entidades;
let empresa;

/* =====================
   AUTO UPDATER LOGGER
===================== */

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

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

    mainWindow.loadFile(session ? 'index.html' : 'views/login.html');
}

/* =====================
   AUTO UPDATE
===================== */

function configurarAutoUpdate() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    autoUpdater.on('checking-for-update', () => {
        mainWindow.webContents.send('update-checking');
    });

    autoUpdater.on('update-available', info => {
        mainWindow.webContents.send('update-available', info);
    });

    autoUpdater.on('update-not-available', () => {
        mainWindow.webContents.send('update-not-available');
    });

    autoUpdater.on('download-progress', progress => {
        mainWindow.webContents.send('update-progress', {
            percent: Math.round(progress.percent)
        });
    });

    autoUpdater.on('update-downloaded', info => {
        mainWindow.webContents.send('update-downloaded', info);
    });

    autoUpdater.on('error', err => {
        mainWindow.webContents.send('update-error', err.message);
    });
}

/* =====================
   APP READY (UNA SOLA VEZ)
===================== */

app.whenReady().then(async () => {

    createSplash();
    const start = Date.now();

    // 🔹 DB + módulos (ANTES de IPC)
    db = createDatabase();
    entidades = crearEntidades(db);
    empresa = crearEmpresa(db);

    // 🔹 Ventana
    createMainWindow();
    configurarAutoUpdate();

    await new Promise(resolve => {
        mainWindow.once('ready-to-show', resolve);
    });

    // 🔹 Tiempo mínimo splash
    const MIN_SPLASH = 2500;
    const elapsed = Date.now() - start;
    if (elapsed < MIN_SPLASH) {
        await new Promise(r => setTimeout(r, MIN_SPLASH - elapsed));
    }

    splashWindow?.close();
    mainWindow.show();

    /*if (app.isPackaged) {
        setTimeout(() => autoUpdater.checkForUpdates(), 3000);
    }*/
});

/* =====================
   IPC – AUTH
===================== */

ipcMain.handle('login', (_, email, password) => {
    const token = auth.login(email, password);
    return token
        ? { success: true, token }
        : { success: false, message: 'Usuario o contraseña incorrectos' };
});

ipcMain.handle('get-session', () => auth.getSession());

ipcMain.handle('logout', () => {
    auth.logout();
    return true;
});

/* =====================
   IPC – EMPRESA
===================== */

ipcMain.handle('empresa-obtener', () => empresa.obtener());

ipcMain.handle('empresa-guardar', (_, data) => {
    if (!data.nombre) return { success: false, message: 'Nombre obligatorio' };
    empresa.actualizar(data);
    return { success: true };
});

ipcMain.handle('empresa-cambiar-logo', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'PNG Images', extensions: ['png'] }]
    });

    if (canceled || !filePaths.length) return { success: false };

    const origen = filePaths[0];
    if (path.extname(origen).toLowerCase() !== '.png') {
        return { success: false, message: 'El logo debe ser PNG' };
    }

    const destino = path.join(app.getPath('userData'), 'logo.png');
    fs.copyFileSync(origen, destino);

    db.prepare(`
        UPDATE empresa
        SET logo = 'logo.png', updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
    `).run();

    return { success: true };
});

ipcMain.handle('empresa-logo-path', () =>
    path.join(app.getPath('userData'), 'logo.png')
);


/* =====================
   IPC - guardar recibo
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
   IPC – ENTIDADES
===================== */

ipcMain.handle('entidades-listar', () => entidades.listar());

ipcMain.handle('entidades-crear', (_, data) => {
    if (!data.nombre) return { success: false };
    const id = entidades.crear(data);
    return { success: true, id };
});

/* =====================
   IPC – DASHBOARD
===================== */

ipcMain.handle('dashboard-stats', () => {
    const totalRecibos = db.prepare('SELECT COUNT(*) as total FROM recibos').get().total;
    const totalEntidades = db.prepare('SELECT COUNT(*) as total FROM entidades').get().total;
    return { totalRecibos, totalEntidades };
});

/* =====================
   IPC – PDF
===================== */

ipcMain.handle('generar-pdf', async (_, recibo) => {
    try {
        const empresaData = empresa.obtener();
        const reciboCompleto = { ...recibo, empresa: empresaData };

        const base = path.join(app.getPath('documents'), 'Billerdoc-Recibos');
        const fecha = new Date(recibo.fecha + 'T00:00:00');
        const folder = path.join(
            base,
            `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        );

        fs.mkdirSync(folder, { recursive: true });

        await generarReciboConPlantilla(reciboCompleto, 'ORIGINAL', folder);
        await generarReciboConPlantilla(reciboCompleto, 'COPIA', folder);

        return { success: true };

    } catch (err) {
        log.error(err);
        return { success: false, message: err.message };
    }
});

/* =====================
   IPC – RECIBOS
===================== */

ipcMain.handle('get-recibos', () => {
    const rows = db.prepare(`
        SELECT id, data FROM recibos ORDER BY id DESC
    `).all();

    return rows.map(r => {
        const d = JSON.parse(r.data);
        return { id: r.id, cliente: d.cliente, fecha: d.fecha, total: d.total };
    });
});

/* =====================
   IPC – ABRIR RECIBO
===================== */

ipcMain.handle('abrir-recibo', async (_, id, tipo = 'ORIGINAL') => {
    const baseDir = path.join(app.getPath('documents'), 'Billerdoc-Recibos');
    const sufijo = `-${id}_${tipo}.pdf`;
    let encontrado = null;

    const buscar = dir => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) buscar(full);
            else if (e.name.endsWith(sufijo)) encontrado = full;
        }
    };

    buscar(baseDir);

    if (!encontrado) return { success: false, message: 'PDF no encontrado' };

    await shell.openPath(encontrado);
    return { success: true };
});

/* =====================
   IPC – UPDATES
===================== */

ipcMain.handle('updates-check', async () => {
    if (!app.isPackaged) {
        return { skipped: true, reason: 'dev-mode' };
    }

    try {
        return await autoUpdater.checkForUpdates();
    } catch (err) {
        log.error('Update check error:', err);
        throw err;
    }
});

ipcMain.handle('updates-download', async () => {
    try {
        return await autoUpdater.downloadUpdate();
    } catch (err) {
        log.error('Update download error:', err);
        throw err;
    }
});

ipcMain.handle('updates-install', () => {
    autoUpdater.quitAndInstall(false, true);
});


/* =====================
   EXIT
===================== */

ipcMain.on('exit-app', () => app.quit());

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});