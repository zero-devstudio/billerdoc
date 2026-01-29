const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

const createDatabase = require('./modules/db');
const generarReciboConPlantilla = require('./pdf/generatePdfFromTemplate');
const auth = require('./modules/auth');

const crearEntidades = require('./modules/entidades');
const crearEmpresa = require('./modules/empresa');

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

    if (session) {
        mainWindow.loadFile('index.html');
    } else {
        mainWindow.loadFile('views/login.html');
    }
}

/* =====================
   AUTO UPDATER
===================== */

function configurarAutoUpdate() {

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
        log.info('🔍 Buscando actualizaciones...');
    });

    autoUpdater.on('update-available', (info) => {
        log.info('⬇️ Actualización disponible:', info.version);
        mainWindow.webContents.send('update-available', info.version);
    });

    autoUpdater.on('update-not-available', () => {
        log.info('✅ No hay actualizaciones');
    });

    autoUpdater.on('error', (err) => {
        log.error('❌ Error en auto-update:', err);
    });

    autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send(
            'update-progress',
            Math.round(progress.percent)
        );
    });

    autoUpdater.on('update-downloaded', () => {
        log.info('✅ Actualización descargada');
        mainWindow.webContents.send('update-downloaded');
    });
}

/* =====================
   APP READY
===================== */

app.whenReady().then(async () => {

    const start = Date.now();
    createSplash();

    // 🔹 Inicializaciones
    db = createDatabase();
    entidades = crearEntidades(db);
    empresa = crearEmpresa(db);

    createMainWindow();
    configurarAutoUpdate();

    // Esperar a que la ventana esté lista
    await new Promise(resolve => {
        mainWindow.once('ready-to-show', resolve);
    });

    // Splash mínimo visible
    const MIN_SPLASH_TIME = 2500;
    const elapsed = Date.now() - start;

    if (elapsed < MIN_SPLASH_TIME) {
        await new Promise(r => setTimeout(r, MIN_SPLASH_TIME - elapsed));
    }

    splashWindow.close();
    mainWindow.show();

    // 🔥 Buscar updates (IMPORTANTE)
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
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
    const token = auth.login(email, password);

    if (!token) {
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    return { success: true, token };
});

ipcMain.handle('get-session', () => auth.getSession());

ipcMain.handle('logout', () => {
    auth.logout();
    return true;
});

/* =====================
   IPC - EMPRESA
===================== */

ipcMain.handle('empresa-obtener', () => empresa.obtener());

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
        filters: [{ name: 'PNG Images', extensions: ['png'] }]
    });

    if (canceled || !filePaths.length) {
        return { success: false };
    }

    const origen = filePaths[0];
    if (path.extname(origen).toLowerCase() !== '.png') {
        return { success: false, message: 'El logo debe ser PNG' };
    }

    const destino = path.join(app.getPath('userData'), 'logo.png');

    fs.copyFileSync(origen, destino);

    db.prepare(`
        UPDATE empresa
        SET logo = 'logo.png',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
    `).run();

    return { success: true };
});

ipcMain.handle('empresa-logo-path', () =>
    path.join(app.getPath('userData'), 'logo.png')
);

/* =====================
   IPC - APP
===================== */

ipcMain.on('exit-app', () => app.quit());

/* =====================
   IPC - PDF
===================== */

ipcMain.handle('generar-pdf', async (event, recibo) => {
    try {
        const empresaData = empresa.obtener();
        const reciboCompleto = { ...recibo, empresa: empresaData };

        const documentsPath = app.getPath('documents');
        const baseFolder = path.join(documentsPath, 'Billerdoc-Recibos');

        const fecha = new Date(recibo.fecha + 'T00:00:00');
        const folderYear = fecha.getFullYear();
        const folderMonth = String(fecha.getMonth() + 1).padStart(2, '0');

        const monthFolder = path.join(baseFolder, `${folderYear}-${folderMonth}`);
        fs.mkdirSync(monthFolder, { recursive: true });

        await generarReciboConPlantilla(reciboCompleto, 'ORIGINAL', monthFolder);
        await generarReciboConPlantilla(reciboCompleto, 'COPIA', monthFolder);

        return { success: true };

    } catch (err) {
        log.error('❌ ERROR PDF:', err);
        return { success: false, message: err.message };
    }
});

/* =====================
   IPC - RECIBOS
===================== */

ipcMain.handle('get-recibos', () => {
    const rows = db.prepare(`
        SELECT id, data
        FROM recibos
        ORDER BY id DESC
    `).all();

    return rows.map(r => {
        const d = JSON.parse(r.data);
        return {
            id: r.id,
            cliente: d.cliente,
            fecha: d.fecha,
            total: d.total
        };
    });
});

/* =====================
   IPC - ABRIR RECIBO
===================== */

ipcMain.handle('abrir-recibo', async (event, id, tipo = 'ORIGINAL') => {
    const baseDir = path.join(app.getPath('documents'), 'Billerdoc-Recibos');
    const sufijo = `-${id}_${tipo}.pdf`;

    let encontrado = null;

    function buscar(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) buscar(full);
            else if (e.name.endsWith(sufijo)) encontrado = full;
        }
    }

    buscar(baseDir);

    if (!encontrado) {
        return { success: false, message: 'PDF no encontrado' };
    }

    await shell.openPath(encontrado);
    return { success: true };
});

/* =====================
   APP QUIT
===================== */

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
