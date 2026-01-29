const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    guardarRecibo: (data) => ipcRenderer.invoke('guardar-recibo', data),
    generarPDF: (data) => ipcRenderer.invoke('generar-pdf', data),
    abrirRecibo: (id, tipo) => ipcRenderer.invoke('abrir-recibo', id, tipo),
    getRecibos: () => ipcRenderer.invoke('get-recibos'),
    exit: () => ipcRenderer.send('exit-app')
});


contextBridge.exposeInMainWorld('auth', {
    login: (email, password) => ipcRenderer.invoke('login', email, password),
    getSession: () => ipcRenderer.invoke('get-session'),
    logout: () => ipcRenderer.invoke('logout')
});

contextBridge.exposeInMainWorld('dashboard', {
    stats: () => ipcRenderer.invoke('dashboard-stats')
});

contextBridge.exposeInMainWorld('recibos', {
    listar: () => ipcRenderer.invoke('get-recibos')
});

contextBridge.exposeInMainWorld('entidades', {
    listar: () => ipcRenderer.invoke('entidades-listar'),
    crear: (data) => ipcRenderer.invoke('entidades-crear', data)
});

contextBridge.exposeInMainWorld('empresa', {
    obtener: () => ipcRenderer.invoke('empresa-obtener'),
    guardar: (data) => ipcRenderer.invoke('empresa-guardar', data),
    cambiarLogo: () => ipcRenderer.invoke('empresa-cambiar-logo'),
    logo: () => ipcRenderer.invoke('empresa-logo-path')
});

contextBridge.exposeInMainWorld('updates', {
    check: () => ipcRenderer.invoke('updates-check'),
    download: () => ipcRenderer.invoke('updates-download'),
    install: () => ipcRenderer.invoke('updates-install'),

    onChecking: cb => ipcRenderer.on('update-checking', cb),
    onAvailable: (cb) => ipcRenderer.on('update-available', (_, info) => cb(info)),
    onNotAvailable: cb => ipcRenderer.on('update-not-available', cb),
    onProgress: (cb) => ipcRenderer.on('update-progress', (_, p) => cb(p)),
    onDownloaded: cb => ipcRenderer.on('update-downloaded', cb),
    onError: (cb) => ipcRenderer.on('update-error', (_, msg) => cb(msg))
});

