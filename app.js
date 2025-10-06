// ===== CONFIGURACIÓN =====
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxggfLBiUdF6PFBvIiWBBmL9KxKZOBr8IXDGBPSxG_RVUoIM19ybkTIEfSsLgW-5m84/exec';

// Variables globales
let todosLosRegistros = [];
let grafico = null;

// ===== FUNCIONES AUXILIARES =====
function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const date = new Date(fechaStr);
    return isNaN(date) ? fechaStr : date.toLocaleString('es-ES');
}

function extraerFecha(fechaStr) {
    if (!fechaStr) return '';
    const date = new Date(fechaStr);
    return isNaN(date) ? '' : date.toISOString().split('T')[0];
}

function mostrarRegistros(registros) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    if (!registros || registros.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros</td></tr>';
        return;
    }

    const html = registros.map(reg => `
        <tr>
            <td>${formatearFecha(reg['Fecha y Hora'] || reg['fechaHora'])}</td>
            <td>${reg['Responsable'] || reg['responsable'] || ''}</td>
            <td>${reg['Tema / Asunto'] || reg['tema'] || ''}</td>
            <td>${reg['Actividades Realizadas'] || reg['actividades'] || ''}</td>
            <td>${reg['Nº Personas ECSA'] || reg['numeroEcsa'] || 0}</td>
            <td>${reg['Nº Personas Contratista'] || reg['numeroContratista'] || 0}</td>
        </tr>
    `).join('');
    cuerpoTabla.innerHTML = html;
}

function actualizarGrafico(registros) {
    const ctx = document.getElementById('graficoPersonas').getContext('2d');
    
    let totalEcsa = 0;
    let totalContratista = 0;
    registros.forEach(reg => {
        totalEcsa += parseInt(reg['Nº Personas ECSA'] || reg['numeroEcsa'] || 0);
        totalContratista += parseInt(reg['Nº Personas Contratista'] || reg['numeroContratista'] || 0);
    });

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: 'bar',
         {
            labels: ['Personas ECSA', 'Personas Contratista'],
            datasets: [{
                label: 'Número de Personas',
                 [totalEcsa, totalContratista],
                backgroundColor: ['#0d6efd', '#198754'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

function aplicarFiltros() {
    const filtroResp = document.getElementById('filtroResponsable').value.toLowerCase();
    const filtroTema = document.getElementById('filtroTema').value.toLowerCase();
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;

    const filtrados = todosLosRegistros.filter(reg => {
        const responsable = (reg['Responsable'] || reg['responsable'] || '').toLowerCase();
        const tema = (reg['Tema / Asunto'] || reg['tema'] || '').toLowerCase();
        if (!responsable.includes(filtroResp) || !tema.includes(filtroTema)) return false;

        const fechaRegistro = extraerFecha(reg['Fecha y Hora'] || reg['fechaHora']);
        if (fechaDesde && fechaRegistro < fechaDesde) return false;
        if (fechaHasta && fechaRegistro > fechaHasta) return false;

        return true;
    });

    mostrarRegistros(filtrados);
    actualizarGrafico(filtrados);
    return filtrados;
}

async function cargarDatos() {
    const mensajeDiv = document.getElementById('mensajeConsulta');
    mensajeDiv.innerHTML = '<div class="alert alert-info">Cargando datos...</div>';

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();

        if (Array.isArray(data)) {
            todosLosRegistros = data;
            aplicarFiltros();
            mensajeDiv.innerHTML = '';
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error al cargar:', error);
        mensajeDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        document.getElementById('cuerpoTabla').innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar</td></tr>';
    }
}

function exportarAExcel() {
    const registrosFiltrados = aplicarFiltros();

    if (registrosFiltrados.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    const datosExcel = registrosFiltrados.map(reg => ({
        'Fecha y Hora': formatearFecha(reg['Fecha y Hora'] || reg['fechaHora']),
        'Responsable': reg['Responsable'] || reg['responsable'] || '',
        'Tema / Asunto': reg['Tema / Asunto'] || reg['tema'] || '',
        'Actividades Realizadas': reg['Actividades Realizadas'] || reg['actividades'] || '',
        'Nº Personas ECSA': reg['Nº Personas ECSA'] || reg['numeroEcsa'] || 0,
        'Nº Personas Contratista': reg['Nº Personas Contratista'] || reg['numeroContratista'] || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reportes");
    XLSX.writeFile(wb, "Reportes_Mantenimiento.xlsx");
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual en el formulario
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('fechaHora').value = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Eventos de la pestaña de consulta
    document.getElementById('consulta-tab').addEventListener('click', cargarDatos);
    document.getElementById('btnCargar').addEventListener('click', cargarDatos);
    document.getElementById('btnExportar').addEventListener('click', exportarAExcel);

    ['filtroResponsable', 'filtroTema'].forEach(id => {
        document.getElementById(id).addEventListener('input', aplicarFiltros);
    });

    ['fechaDesde', 'fechaHasta'].forEach(id => {
        document.getElementById(id).addEventListener('change', aplicarFiltros);
    });

    // Evento del formulario de registro
    const form = document.getElementById('mantenimientoForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const mensajeDiv = document.getElementById('mensajeRegistro');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        mensajeDiv.innerHTML = '';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data),
            });

            const result = await response.text();

            if (response.ok) {
                mensajeDiv.innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>✅ ¡Registro completado!</strong> Los datos han sido guardados correctamente.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
                    </div>
                `;
                form.reset();
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                document.getElementById('fechaHora').value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else {
                mensajeDiv.innerHTML = `<div class="alert alert-danger">❌ Error: ${result}</div>`;
            }
        } catch (error) {
            console.error('Error:', error);
            mensajeDiv.innerHTML = `<div class="alert alert-warning">⚠️ Error de red: ${error.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar';
        }
    });
});