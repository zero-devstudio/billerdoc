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
    onAvailable: (callback) => ipcRenderer.on('update-available', (_, v) => callback(v)),
    onProgress: (callback) => ipcRenderer.on('update-progress', (_, p) => callback(p)),
    onDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    install: () => ipcRenderer.send('install-update')
});
