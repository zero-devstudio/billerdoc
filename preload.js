const { contextBridge, ipcRenderer } = require('electron');

/* =====================
   ELECTRON CORE
===================== */

contextBridge.exposeInMainWorld('electron', {
    guardarRecibo: (data) => ipcRenderer.invoke('guardar-recibo', data),
    generarPDF: (data) => ipcRenderer.invoke('generar-pdf', data),
    abrirRecibo: (id, tipo) => ipcRenderer.invoke('abrir-recibo', id, tipo),
    getRecibos: () => ipcRenderer.invoke('get-recibos'),
    exit: () => ipcRenderer.send('exit-app')
});

/* =====================
   AUTH
===================== */

contextBridge.exposeInMainWorld('auth', {
    login: (email, password) => ipcRenderer.invoke('login', email, password),
    getSession: () => ipcRenderer.invoke('get-session'),
    logout: () => ipcRenderer.invoke('logout')
});

/* =====================
   DASHBOARD
===================== */

contextBridge.exposeInMainWorld('dashboard', {
    stats: () => ipcRenderer.invoke('dashboard-stats')
});

/* =====================
   RECIBOS
===================== */

contextBridge.exposeInMainWorld('recibos', {
    listar: () => ipcRenderer.invoke('get-recibos')
});

/* =====================
   ENTIDADES
===================== */

contextBridge.exposeInMainWorld('entidades', {
    listar: () => ipcRenderer.invoke('entidades-listar'),
    crear: (data) => ipcRenderer.invoke('entidades-crear', data)
});

/* =====================
   EMPRESA
===================== */

contextBridge.exposeInMainWorld('empresa', {
    obtener: () => ipcRenderer.invoke('empresa-obtener'),
    guardar: (data) => ipcRenderer.invoke('empresa-guardar', data),
    cambiarLogo: () => ipcRenderer.invoke('empresa-cambiar-logo'),
    logo: () => ipcRenderer.invoke('empresa-logo-path')
});

/* =====================
   UPDATES
===================== */

contextBridge.exposeInMainWorld('updates', {
    // Acciones
    check: () => ipcRenderer.invoke('updates-check'),
    download: () => ipcRenderer.invoke('updates-download'),
    install: () => ipcRenderer.invoke('updates-install'),

    // Eventos (NO borrar listeners)
    onChecking: (cb) =>
        ipcRenderer.on('update-checking', () => cb()),

    onAvailable: (cb) =>
        ipcRenderer.on('update-available', (_, info) => cb(info)),

    onNotAvailable: (cb) =>
        ipcRenderer.on('update-not-available', () => cb()),

    onProgress: (cb) =>
        ipcRenderer.on('update-progress', (_, progress) => cb(progress)),

    onDownloaded: (cb) =>
        ipcRenderer.on('update-downloaded', (_, info) => cb(info)),

    onError: (cb) =>
        ipcRenderer.on('update-error', (_, message) => cb(message))
});
