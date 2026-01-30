/* =========================
   ESTADO
========================= */
let recibosCache = [];
let recibosFiltrados = [];

const PAGE_SIZE = 20;
let paginaActual = 1;

/* =========================
   UTILIDADES
========================= */

function parsearFecha(fechaStr) {
    if (!fechaStr) return null;
    if (fechaStr.includes(' ')) {
        fechaStr = fechaStr.replace(' ', 'T');
    }
    const fecha = new Date(fechaStr + 'T00:00:00');
    return isNaN(fecha) ? null : fecha;
}

function formatearFecha(fechaStr) {
    const fecha = parsearFecha(fechaStr);
    return fecha ? fecha.toLocaleDateString('es-CO') : 'Fecha inválida';
}

function obtenerMesClave(fechaStr) {
    const fecha = parsearFecha(fechaStr);
    if (!fecha) return 'Sin fecha';

    const mes = fecha.toLocaleString('es-CO', { month: 'long' });
    const año = fecha.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`;
}

/* =========================
   PAGINACIÓN
========================= */

function obtenerPagina(data, pagina) {
    const start = (pagina - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return data.slice(start, end);
}

/* =========================
   AGRUPAR POR MES
========================= */

function agruparPorMes(recibos) {
    const grupos = {};

    recibos.forEach(recibo => {
        const fecha = parsearFecha(recibo.fecha);
        if (!fecha) return;

        const clave = obtenerMesClave(recibo.fecha);
        if (!grupos[clave]) grupos[clave] = [];
        grupos[clave].push(recibo);
    });

    return grupos;
}

/* =========================
   RENDER
========================= */

function renderEmitidos(recibosPagina) {
    const container = document.getElementById('emitidos-list');
    container.innerHTML = '';

    if (!recibosPagina.length) {
        container.innerHTML = '<p>No hay recibos que coincidan</p>';
        return;
    }

    recibosPagina.sort((a, b) => {
        const fa = parsearFecha(a.fecha);
        const fb = parsearFecha(b.fecha);
        return fb - fa;
    });

    const agrupados = agruparPorMes(recibosPagina);

    Object.keys(agrupados).forEach(mes => {
        const title = document.createElement('div');
        title.className = 'emitidos-mes';
        title.textContent = mes;
        container.appendChild(title);

        agrupados[mes].forEach(recibo => {
            const row = document.createElement('div');
            row.className = 'emitido-row';

            row.innerHTML = `
                <div class="emitido-id">${recibo.id}</div>
                <div>${formatearFecha(recibo.fecha)}</div>
                <div>${recibo.cliente}</div>
                <div>$ ${Number(recibo.total).toLocaleString('es-CO')}</div>
                <div class="emitido-actions">
                    <button class="btn-original">
                        <svg width="41" height="34" viewBox="0 0 41 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.7 30C2.6825 30 1.81177 29.6331 1.0878 28.8994C0.363833 28.1656 0.00123333 27.2825 0 26.25V3.75C0 2.71875 0.3626 1.83625 1.0878 1.1025C1.813 0.36875 2.68373 0.00125 3.7 0H14.8L18.5 3.75H33.3C34.3175 3.75 35.1888 4.1175 35.914 4.8525C36.6392 5.5875 37.0012 6.47 37 7.5V26.25C37 27.2812 36.638 28.1644 35.914 28.8994C35.1901 29.6344 34.3187 30.0012 33.3 30H3.7Z" fill="url(#paint0_linear_97_58)"/>
                            <path d="M41 26C41 30.4183 37.4183 34 33 34C28.5817 34 25 30.4183 25 26C25 21.5817 28.5817 18 33 18C37.4183 18 41 21.5817 41 26Z" fill="#2BF05C"/>
                            <defs>
                            <linearGradient id="paint0_linear_97_58" x1="24.3784" y1="17" x2="7.93667" y2="33.6301" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#FFE32D"/>
                            <stop offset="1" stop-color="#FFD151"/>
                            </linearGradient>
                            </defs>
                        </svg>

                    </button>
                    <button class="btn-copia">
                        <svg width="43" height="35" viewBox="0 0 43 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.7 30C2.6825 30 1.81177 29.6331 1.0878 28.8994C0.363833 28.1656 0.00123333 27.2825 0 26.25V3.75C0 2.71875 0.3626 1.83625 1.0878 1.1025C1.813 0.36875 2.68373 0.00125 3.7 0H14.8L18.5 3.75H33.3C34.3175 3.75 35.1888 4.1175 35.914 4.8525C36.6392 5.5875 37.0012 6.47 37 7.5V26.25C37 27.2812 36.638 28.1644 35.914 28.8994C35.1901 29.6344 34.3187 30.0012 33.3 30H3.7Z" fill="url(#paint0_linear_97_61)"/>
                            <path d="M33.7501 34.2998C28.4251 34.2998 24.9751 30.5998 24.9751 24.8748C24.9751 19.1998 28.5501 15.4248 33.9001 15.4248C38.2251 15.4248 41.4501 17.9498 42.0751 21.8748H38.7001C38.0751 19.7498 36.2501 18.4998 33.8251 18.4998C30.4501 18.4998 28.3251 20.9498 28.3251 24.8498C28.3251 28.7248 30.4751 31.2248 33.8251 31.2248C36.3001 31.2248 38.2001 29.9248 38.8001 27.8998H42.1251C41.4251 31.7498 38.0751 34.2998 33.7501 34.2998Z" fill="#3780FF"/>
                            <defs>
                            <linearGradient id="paint0_linear_97_61" x1="25.0474" y1="17.1499" x2="8.4669" y2="34.2299" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#FFE32D"/>
                            <stop offset="1" stop-color="#FFD151"/>
                            </linearGradient>
                            </defs>
                        </svg>

                    </button>
                </div>
            `;

            row.querySelector('.btn-original').onclick = () =>
                window.electron.abrirRecibo(recibo.id, 'ORIGINAL');

            row.querySelector('.btn-copia').onclick = () =>
                window.electron.abrirRecibo(recibo.id, 'COPIA');

            container.appendChild(row);
        });
    });
}

/* =========================
   PAGINACIÓN UI
========================= */

function actualizarPaginacion() {
    const totalPaginas = Math.ceil(recibosFiltrados.length / PAGE_SIZE);

    const info = document.getElementById('pageInfo');
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');

    if (!info || !prev || !next) return;

    info.textContent = `Página ${paginaActual} de ${totalPaginas || 1}`;

    prev.disabled = paginaActual <= 1;
    next.disabled = paginaActual >= totalPaginas;

    prev.onclick = () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderEmitidos(obtenerPagina(recibosFiltrados, paginaActual));
            actualizarPaginacion();
        }
    };

    next.onclick = () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderEmitidos(obtenerPagina(recibosFiltrados, paginaActual));
            actualizarPaginacion();
        }
    };
}

/* =========================
   FILTROS
========================= */

function aplicarFiltrosEmitidos() {
    const nombre = document.getElementById('searchNombre')?.value.toLowerCase() || '';
    const desde = document.getElementById('searchDesde')?.value;
    const hasta = document.getElementById('searchHasta')?.value;

    recibosFiltrados = recibosCache.filter(r => {
        if (nombre && !r.cliente.toLowerCase().includes(nombre)) return false;
        if (desde && r.fecha < desde) return false;
        if (hasta && r.fecha > hasta) return false;
        return true;
    });

    paginaActual = 1;
    renderEmitidos(obtenerPagina(recibosFiltrados, paginaActual));
    actualizarPaginacion();
    actualizarEstadoBotonLimpiar();
}

/* =========================
   BOTÓN LIMPIAR
========================= */

function actualizarEstadoBotonLimpiar() {
    const desde = document.getElementById('searchDesde')?.value;
    const hasta = document.getElementById('searchHasta')?.value;
    const btn = document.getElementById('btnClearFilters');

    if (!btn) return;

    if (desde || hasta) btn.classList.add('show');
    else btn.classList.remove('show');
}

function limpiarFiltrosEmitidos() {
    const nombre = document.getElementById('searchNombre');
    const desde = document.getElementById('searchDesde');
    const hasta = document.getElementById('searchHasta');

    if (nombre) nombre.value = '';
    if (desde) desde.value = '';
    if (hasta) hasta.value = '';

    recibosFiltrados = [...recibosCache];
    paginaActual = 1;

    renderEmitidos(obtenerPagina(recibosFiltrados, paginaActual));
    actualizarPaginacion();
    actualizarEstadoBotonLimpiar();
}

/* =========================
   BUSCADORES
========================= */

function activarBuscadoresEmitidos() {
    ['searchNombre', 'searchDesde', 'searchHasta'].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        input.oninput = aplicarFiltrosEmitidos;
    });

    const btnClear = document.getElementById('btnClearFilters');
    if (btnClear) btnClear.onclick = limpiarFiltrosEmitidos;
}

/* =========================
   ACTIVAR EMITIDOS
========================= */

async function activarEmitidos() {
    const container = document.getElementById('emitidos-list');
    if (!container) return;

    try {
        recibosCache = await window.electron.getRecibos();
        recibosFiltrados = [...recibosCache];
        paginaActual = 1;

        activarBuscadoresEmitidos();
        renderEmitidos(obtenerPagina(recibosFiltrados, paginaActual));
        actualizarPaginacion();
        actualizarEstadoBotonLimpiar();

    } catch (err) {
        console.error('❌ ERROR EMITIDOS:', err);
        container.innerHTML =
            '<p style="color:#999">No se pudieron cargar los recibos</p>';
    }
}