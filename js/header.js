function iniciarReloj() {
    const reloj = document.getElementById('reloj');
    if (!reloj) return;

    const actualizar = () => {
        const ahora = new Date().toLocaleTimeString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit'
        });
        reloj.textContent = ahora;
    };

    actualizar();
    setInterval(actualizar, 1000);
}

document.addEventListener('DOMContentLoaded', iniciarReloj);


if (window.updates) {

    window.updates.onAvailable(version => {
        alert(`Nueva versión disponible (${version}). Descargando…`);
    });

    window.updates.onProgress(percent => {
        console.log(`Descargando update: ${percent}%`);
    });

    window.updates.onDownloaded(() => {
        const instalar = confirm('Actualización lista. ¿Reiniciar ahora?');
        if (instalar) {
            window.updates.install();
        }
    });

}

