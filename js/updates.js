let updatesInicializado = false;

function activarUpdates() {
    if (updatesInicializado) return;
    updatesInicializado = true;

    const status = document.getElementById('updateStatus');
    const btnCheck = document.getElementById('btnCheck');
    const btnDownload = document.getElementById('btnDownload');
    const btnInstall = document.getElementById('btnInstall');
    const progress = document.getElementById('updateProgress');

    if (!status || !btnCheck) return;

    /* =========================
       HELPERS UI
    ========================= */

    function setStatus(text, type = 'info') {
        status.textContent = text;
        status.className = `update-status ${type}`;
    }

    function resetUI() {
        btnDownload.disabled = true;
        btnInstall.disabled = true;
        progress.style.display = 'none';
        progress.value = 0;
    }

    resetUI();

    /* =========================
       BOTONES
    ========================= */

    btnCheck.onclick = () => {
        resetUI();
        setStatus('Buscando actualizaciones…', 'info');
        window.updates.check();
    };

    btnDownload.onclick = () => {
        setStatus('Descargando actualización…', 'info');
        progress.style.display = 'block';
        window.updates.download();
    };

    btnInstall.onclick = () => {
        setStatus('Instalando actualización…', 'info');
        window.updates.install();
    };

    /* =========================
       EVENTOS DESDE MAIN
    ========================= */

    window.updates.onAvailable(info => {
        setStatus(`Nueva versión disponible: ${info.version}`, 'success');
        btnDownload.disabled = false;
    });

    window.updates.onNotAvailable(() => {
        setStatus('Tu aplicación está actualizada ✅', 'success');
    });

    window.updates.onProgress(p => {
        progress.style.display = 'block';
        progress.value = Math.round(p.percent);
    });

    window.updates.onDownloaded(() => {
        setStatus('Actualización lista para instalar 🚀', 'success');
        btnInstall.disabled = false;
    });

    window.updates.onError(msg => {
        setStatus(`Error: ${msg}`, 'error');
    });
}
