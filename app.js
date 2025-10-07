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

// Función de utilidad para debug que puedes usar temporalmente
function debugDatos() {
    console.log('=== DEBUG DATOS ===');
    console.log('Todos los registros:', todosLosRegistros);
    if (todosLosRegistros.length > 0) {
        console.log('Primer registro:', todosLosRegistros[0]);
        console.log('Claves del primer registro:', Object.keys(todosLosRegistros[0]));
    }
    console.log('==================');
}

// Función para guardar datos en localStorage como respaldo
function guardarDatosLocales() {
    localStorage.setItem('registrosMantenimiento', JSON.stringify(todosLosRegistros));
}

// Función para cargar datos desde localStorage
function cargarDatosLocales() {
    const datosGuardados = localStorage.getItem('registrosMantenimiento');
    if (datosGuardados) {
        try {
            return JSON.parse(datosGuardados);
        } catch (error) {
            console.error('Error al parsear datos locales:', error);
            return [];
        }
    }
    return [];
}

function mostrarRegistros(registros) {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    if (!registros || registros.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="7" class="text-center">No hay registros</td></tr>';
        return;
    }

    const html = registros.map(reg => {
        // Manejar diferentes posibles nombres de columnas
        const fecha = formatearFecha(
            reg['Fecha y Hora'] || 
            reg['fechaHora'] || 
            reg['fecha_y_hora'] || 
            reg['date'] || 
            reg[0] || '' // Por si los datos vienen como array
        );
        
        const responsable = 
            reg['Responsable'] || 
            reg['responsable'] || 
            reg['nombre_responsable'] || 
            reg['name'] || 
            reg[1] || '';
            
        const tema = 
            reg['Tema / Asunto'] || 
            reg['tema'] || 
            reg['asunto'] || 
            reg['subject'] || 
            reg[2] || '';

        const frente = 
            reg['Frente de Trabajo'] || 
            reg['frente'] || 
            reg['frente_de_trabajo'] || 
            reg[6] || '';
            
        const actividades = 
            reg['Actividades Realizadas'] || 
            reg['actividades'] || 
            reg['descripcion'] || 
            reg['description'] || 
            reg[3] || '';
            
        const numeroEcsa = 
            reg['Nº Personas ECSA'] || 
            reg['numeroEcsa'] || 
            reg['personas_ecsa'] || 
            reg['ecsa_count'] || 
            reg[4] || 0;
            
        const numeroContratista = 
            reg['Nº Personas Contratista'] || 
            reg['numeroContratista'] || 
            reg['personas_contratista'] || 
            reg['contractor_count'] || 
            reg[5] || 0;

        return `
            <tr>
                <td>${fecha}</td>
                <td>${responsable}</td>
                <td>${tema}</td>
                <td>${frente}</td>
                <td>${actividades}</td>
                <td>${numeroEcsa}</td>
                <td>${numeroContratista}</td>
            </tr>
        `;
    }).join('');
    cuerpoTabla.innerHTML = html;
}

function actualizarGrafico(registros) {
    const ctx = document.getElementById('graficoPersonas').getContext('2d');
    
    let totalEcsa = 0;
    let totalContratista = 0;
    registros.forEach(reg => {
        // Manejar diferentes posibles nombres de columnas
        const ecsaValue = 
            reg['Nº Personas ECSA'] || 
            reg['numeroEcsa'] || 
            reg['personas_ecsa'] || 
            reg['ecsa_count'] || 
            reg[4] || 0;
            
        const contratistaValue = 
            reg['Nº Personas Contratista'] || 
            reg['numeroContratista'] || 
            reg['personas_contratista'] || 
            reg['contractor_count'] || 
            reg[5] || 0;
            
        totalEcsa += parseInt(ecsaValue) || 0;
        totalContratista += parseInt(contratistaValue) || 0;
    });

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Personas ECSA', 'Personas Contratista'],
            datasets: [{
                label: 'Número de Personas',
                data: [totalEcsa, totalContratista],
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
    const filtroResp = document.getElementById('filtroResponsable').value.toLowerCase().trim();
    const filtroTema = document.getElementById('filtroTema').value.toLowerCase().trim();
    const filtroFrente = document.getElementById('filtroFrente').value.toLowerCase().trim();
    const fechaDesde = document.getElementById('fechaDesde').value;
    const fechaHasta = document.getElementById('fechaHasta').value;

    const filtrados = todosLosRegistros.filter(reg => {
        // Manejar diferentes posibles nombres de columnas
        const responsable = (
            reg['Responsable'] || 
            reg['responsable'] || 
            reg['nombre_responsable'] || 
            reg['name'] || 
            reg[1] || ''
        ).toLowerCase();
        
        const tema = (
            reg['Tema / Asunto'] || 
            reg['tema'] || 
            reg['asunto'] || 
            reg['subject'] || 
            reg[2] || ''
        ).toLowerCase();

        const frente = (
            reg['Frente de Trabajo'] || 
            reg['frente'] || 
            reg['frente_de_trabajo'] || 
            reg[6] || ''
        ).toLowerCase();
        
        // Aplicar filtros si hay texto en los campos
        if (filtroResp && !responsable.includes(filtroResp)) return false;
        if (filtroTema && !tema.includes(filtroTema)) return false;
        if (filtroFrente && !frente.includes(filtroFrente)) return false;

        // Filtrar por fechas si están especificadas
        const fechaRegistro = extraerFecha(
            reg['Fecha y Hora'] || 
            reg['fechaHora'] || 
            reg['fecha_y_hora'] || 
            reg['date'] || 
            reg[0] || ''
        );
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
        // Intentar cargar desde Google Apps Script
        const response = await fetch(SCRIPT_URL, { method: 'GET', mode: 'cors' });
        const data = await response.json();

        console.log('Datos recibidos de Google Apps Script:', data); // Debug log
        
        if (Array.isArray(data)) {
            // Procesar los datos recibidos para manejar posibles diferencias de estructura
            let registrosProcesados = [];
            
            if (data.length > 0) {
                // Verificar si el primer elemento parece ser un encabezado
                const primerElemento = data[0];
                
                // Si el primer elemento es un array, significa que no hay encabezados definidos en Google Sheets
                // y necesitamos crear objetos con propiedades basadas en índices
                if (Array.isArray(primerElemento)) {
                    registrosProcesados = data.map(row => {
                        if (Array.isArray(row)) {
                            return {
                                'Fecha y Hora': row[0] || '',
                                'Responsable': row[1] || '',
                                'Tema / Asunto': row[2] || '',
                                'Actividades Realizadas': row[3] || '',
                                'Nº Personas ECSA': row[4] || 0,
                                'Nº Personas Contratista': row[5] || 0,
                                'Frente de Trabajo': row[6] || ''
                            };
                        }
                        return row;
                    });
                } else {
                    // Si el primer elemento es un objeto, ya tiene las propiedades con nombres
                    registrosProcesados = data;
                }
            }
            
            todosLosRegistros = registrosProcesados;
            // Guardar en localStorage como respaldo
            guardarDatosLocales();
            
            // Mostrar mensaje si hay datos
            if (registrosProcesados.length > 0) {
                console.log('Primer registro recibido:', registrosProcesados[0]); // Debug log
                mensajeDiv.innerHTML = `<div class="alert alert-success">✅ Cargados ${registrosProcesados.length} registros</div>`;
            } else {
                mensajeDiv.innerHTML = '<div class="alert alert-info">No hay registros en la hoja de cálculo</div>';
            }
        } else {
            throw new Error(data.error || 'Formato de datos incorrecto');
        }
    } catch (error) {
        console.error('Error al cargar desde Google Apps Script:', error);
        // Si falla, intentar cargar desde localStorage
        const datosLocales = cargarDatosLocales();
        if (datosLocales.length > 0) {
            todosLosRegistros = datosLocales;
            mensajeDiv.innerHTML = `<div class="alert alert-warning">Cargando ${datosLocales.length} registros locales. No se pudo conectar con Google Apps Script.</div>`;
        } else {
            // Si tampoco hay datos locales, mostrar mensaje de error
            mensajeDiv.innerHTML = `<div class="alert alert-danger">Error al cargar los datos: ${error.message}. No hay datos locales disponibles.</div>`;
            todosLosRegistros = [];
        }
    }

    aplicarFiltros();
    
    // Ocultar mensaje después de 3 segundos si no es un error
    if (!mensajeDiv.innerHTML.includes('alert-danger')) {
        setTimeout(() => {
            mensajeDiv.innerHTML = '';
        }, 3000);
    }
}

function exportarAExcel() {
    const registrosFiltrados = aplicarFiltros();

    if (registrosFiltrados.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    const datosExcel = registrosFiltrados.map(reg => ({
        'Fecha y Hora': formatearFecha(
            reg['Fecha y Hora'] || 
            reg['fechaHora'] || 
            reg['fecha_y_hora'] || 
            reg['date'] || 
            reg[0] || ''
        ),
        'Responsable': 
            reg['Responsable'] || 
            reg['responsable'] || 
            reg['nombre_responsable'] || 
            reg['name'] || 
            reg[1] || '',
        'Tema / Asunto': 
            reg['Tema / Asunto'] || 
            reg['tema'] || 
            reg['asunto'] || 
            reg['subject'] || 
            reg[2] || '',
        'Frente de Trabajo':
            reg['Frente de Trabajo'] ||
            reg['frente'] ||
            reg['frente_de_trabajo'] ||
            reg[6] || '',
        'Actividades Realizadas': 
            reg['Actividades Realizadas'] || 
            reg['actividades'] || 
            reg['descripcion'] || 
            reg['description'] || 
            reg[3] || '',
        'Nº Personas ECSA': 
            reg['Nº Personas ECSA'] || 
            reg['numeroEcsa'] || 
            reg['personas_ecsa'] || 
            reg['ecsa_count'] || 
            reg[4] || 0,
        'Nº Personas Contratista': 
            reg['Nº Personas Contratista'] || 
            reg['numeroContratista'] || 
            reg['personas_contratista'] || 
            reg['contractor_count'] || 
            reg[5] || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reportes");
    XLSX.writeFile(wb, "Reportes_Mantenimiento.xlsx");
    
    // Mostrar mensaje de éxito
    const mensajeDiv = document.getElementById('mensajeConsulta');
    mensajeDiv.innerHTML = '<div class="alert alert-success">✅ Datos exportados exitosamente a Excel.</div>';
    setTimeout(() => {
        mensajeDiv.innerHTML = '';
    }, 3000);
}

// ===== FUNCIONES PARA MODALES VISTOSOS =====
function mostrarModalExito(titulo, mensaje) {
    // Remover cualquier modal existente
    const modalesExistentes = document.querySelectorAll('.mensaje-modal');
    modalesExistentes.forEach(modal => modal.remove());
    
    const modalHtml = `
        <div class="mensaje-modal modal fade show d-block" id="mensajeModal" tabindex="-1" style="display: block; background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content card">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title fw-bold"><i class="bi bi-check-circle-fill me-2"></i>${titulo}</h5>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="alert alert-success d-inline-block">
                            <i class="bi bi-check-circle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                            <p class="mb-0">${mensaje}</p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Cerrar el modal automáticamente después de 5 segundos
    setTimeout(() => {
        const modal = document.getElementById('mensajeModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
            bsModal.hide();
        }
    }, 5000);
}

function mostrarModalAdvertencia(titulo, mensaje) {
    // Remover cualquier modal existente
    const modalesExistentes = document.querySelectorAll('.mensaje-modal');
    modalesExistentes.forEach(modal => modal.remove());
    
    const modalHtml = `
        <div class="mensaje-modal modal fade show d-block" id="mensajeModal" tabindex="-1" style="display: block; background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content card">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>${titulo}</h5>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="alert alert-warning d-inline-block">
                            <i class="bi bi-exclamation-triangle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                            <p class="mb-0">${mensaje}</p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-warning text-dark" data-bs-dismiss="modal">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function mostrarModalError(titulo, mensaje) {
    // Remover cualquier modal existente
    const modalesExistentes = document.querySelectorAll('.mensaje-modal');
    modalesExistentes.forEach(modal => modal.remove());
    
    const modalHtml = `
        <div class="mensaje-modal modal fade show d-block" id="mensajeModal" tabindex="-1" style="display: block; background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content card">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title fw-bold"><i class="bi bi-x-circle-fill me-2"></i>${titulo}</h5>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="alert alert-danger d-inline-block">
                            <i class="bi bi-x-circle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                            <p class="mb-0">${mensaje}</p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
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

    ['filtroResponsable', 'filtroTema', 'filtroFrente'].forEach(id => {
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
        
        console.log('Datos a enviar:', data); // Debug log

        try {
            // Crear objeto con los campos esperados por Google Apps Script
            // Convertir a mayúsculas los campos específicos
            const params = new URLSearchParams({
                'fechaHora': data.fechaHora,
                'responsable': data.responsable.toUpperCase(),
                'tema': data.tema.toUpperCase(),
                'frente': data.frente.toUpperCase(),  // Agregar el campo 'frente' al envío
                'actividades': data.actividades,
                'numeroEcsa': data.numeroEcsa,
                'numeroContratista': data.numeroContratista
            });
            
            console.log('Parámetros a enviar:', params.toString()); // Debug log
            
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params,
            });

            const result = await response.text();
            
            console.log('Respuesta de Google Apps Script:', result); // Debug log

            if (response.ok) {
                // Mostrar mensaje de éxito en una ventana modal más vistosa
                mostrarModalExito("✅ ¡Registro completado!", "Los datos han sido guardados correctamente.");
                const nuevoRegistro = {
                    'Fecha y Hora': data.fechaHora,
                    'Responsable': data.responsable.toUpperCase(),
                    'Tema / Asunto': data.tema.toUpperCase(),
                    'Frente de Trabajo': data.frente.toUpperCase(),
                    'Actividades Realizadas': data.actividades,
                    'Nº Personas ECSA': data.numeroEcsa,
                    'Nº Personas Contratista': data.numeroContratista
                };
                todosLosRegistros.push(nuevoRegistro);
                guardarDatosLocales();
                
                // Actualizar la vista si estamos en la pestaña de consulta
                if (document.querySelector('#consulta').classList.contains('show')) {
                    aplicarFiltros();
                }
                
                form.reset();
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                document.getElementById('fechaHora').value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else {
                // Si falla el envío a Google Apps Script, guardar localmente
                console.warn('Fallo envío a Google Apps Script, guardando localmente:', result);
                
                // Agregar el registro a la lista local de todas formas
                const nuevoRegistro = {
                    'Fecha y Hora': data.fechaHora,
                    'Responsable': data.responsable.toUpperCase(),
                    'Tema / Asunto': data.tema.toUpperCase(),
                    'Frente de Trabajo': data.frente.toUpperCase(),
                    'Actividades Realizadas': data.actividades,
                    'Nº Personas ECSA': data.numeroEcsa,
                    'Nº Personas Contratista': data.numeroContratista
                };
                todosLosRegistros.push(nuevoRegistro);
                guardarDatosLocales();
                
                // Actualizar la vista si estamos en la pestaña de consulta
                if (document.querySelector('#consulta').classList.contains('show')) {
                    aplicarFiltros();
                }
                
                mostrarModalAdvertencia("⚠️ Registro guardado localmente", "Error al enviar a Google Apps Script.");
            }
        } catch (error) {
            console.error('Error:', error);
            // En caso de error de red, guardar localmente
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            const nuevoRegistro = {
                'Fecha y Hora': data.fechaHora,
                'Responsable': data.responsable.toUpperCase(),
                'Tema / Asunto': data.tema.toUpperCase(),
                'Frente de Trabajo': data.frente.toUpperCase(),
                'Actividades Realizadas': data.actividades,
                'Nº Personas ECSA': data.numeroEcsa,
                'Nº Personas Contratista': data.numeroContratista
            };
            todosLosRegistros.push(nuevoRegistro);
            guardarDatosLocales();
            
            // Actualizar la vista si estamos en la pestaña de consulta
            if (document.querySelector('#consulta').classList.contains('show')) {
                aplicarFiltros();
            }
            
            mostrarModalError("⚠️ Error de red", `Registro guardado localmente: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar';
        }
    });
});