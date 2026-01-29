const { BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const generarHTMLRecibo = require('./receiptTemplate');

async function generarReciboPDF(recibo, tipo, folder) {
    const win = new BrowserWindow({
        show: false,
        webPreferences: { offscreen: true }
    });

    const html = generarHTMLRecibo(recibo, tipo);

    await win.loadURL(
        'data:text/html;charset=utf-8,' +
        encodeURIComponent(html)
    );

    const pdf = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: { width: 5.5, height: 8.5 }
    });

    const fileName = `Recibo_${recibo.id}_${tipo}.pdf`;
    fs.writeFileSync(path.join(folder, fileName), pdf);

    win.destroy();
}

module.exports = generarReciboPDF;
