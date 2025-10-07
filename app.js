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
    mensajeDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-arrow-repeat me-2"></i>Cargando datos...</div>';

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
                mensajeDiv.innerHTML = `<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Cargados ${registrosProcesados.length} registros</div>`;
            } else {
                mensajeDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay registros en la hoja de cálculo</div>';
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
            mensajeDiv.innerHTML = `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>Cargando ${datosLocales.length} registros locales. No se pudo conectar con Google Apps Script.</div>`;
        } else {
            // Si tampoco hay datos locales, mostrar mensaje de error
            mensajeDiv.innerHTML = `<div class="alert alert-danger"><i class="bi bi-x-circle me-2"></i>Error al cargar los datos: ${error.message}. No hay datos locales disponibles.</div>`;
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
    mensajeDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-file-earmark-arrow-down me-2"></i>✅ Datos exportados exitosamente a Excel.</div>';
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
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="alert alert-success d-inline-block">
                            <i class="bi bi-check-circle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                            <p class="mb-0">${mensaje}</p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-primary" onclick="cerrarModal()">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Cerrar el modal automáticamente después de 5 segundos
    setTimeout(() => {
        cerrarModal();
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
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="alert alert-warning d-inline-block">
                            <i class="bi bi-exclamation-triangle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                            <p class="mb-0">${mensaje}</p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-warning text-dark" onclick="cerrarModal()">Aceptar</button>
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
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="alert alert-danger d-inline-block">
                            <i class="bi bi-x-circle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                            <p class="mb-0">${mensaje}</p>
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-danger" onclick="cerrarModal()">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Función para cerrar modales
function cerrarModal() {
    const modal = document.getElementById('mensajeModal');
    if (modal) {
        modal.remove();
        // Remover la clase que evita el desplazamiento en el body
        document.body.classList.remove('modal-open');
    }
}

// ===== FUNCIONALIDAD DE TRADUCCIÓN =====

// Traducciones de texto
const traducciones = {
    'es': {
        'SISTEMA DE GESTIÓN DE LA CALIDAD': 'SISTEMA DE GESTIÓN DE LA CALIDAD',
        '质量管理体系': '质量管理体系',
        'DEPARTAMENTO DE GESTIÓN DE DEPÓSITOS DE RELAVES': 'DEPARTAMENTO DE GESTIÓN DE DEPÓSITOS DE RELAVES',
        '尾矿库管理部': '尾矿库管理部',
        'Sistema de Mantenimiento': 'Sistema de Mantenimiento',
        '维护系统': '维护系统',
        'Fecha y Hora': 'Fecha y Hora',
        '日期时间': '日期时间',
        'Responsable': 'Responsable',
        '负责人': '负责人',
        'Frente de Trabajo': 'Frente de Trabajo',
        '工作面': '工作面',
        'Tema / Asunto': 'Tema / Asunto',
        '主题 / 事项': '主题 / 事项',
        'Actividades Realizadas': 'Actividades Realizadas',
        '已执行活动': '已执行活动',
        'Nº Personas ECSA': 'Nº Personas ECSA',
        'ECSA人数': 'ECSA人数',
        'Nº Personas Contratista': 'Nº Personas Contratista',
        '承包商人数': '承包商人数',
        'Registrar': 'Registrar',
        '登记': '登记',
        'Registro': 'Registro',
        '登记': '登记',
        'Consulta, Filtro y Gráfico': 'Consulta, Filtro y Gráfico',
        '查询、筛选和图表': '查询、筛选和图表',
        'Responsable': 'Responsable',
        '负责人': '负责人',
        'Tema / Asunto': 'Tema / Asunto',
        '主题 / 事项': '主题 / 事项',
        'Frente de Trabajo': 'Frente de Trabajo',
        '工作面': '工作面',
        'Fecha y Hora': 'Fecha y Hora',
        '日期时间': '日期时间',
        'Actividades Realizadas': 'Actividades Realizadas',
        '已执行活动': '已执行活动',
        'Nº Personas ECSA': 'Nº Personas ECSA',
        'ECSA人数': 'ECSA人数',
        'Nº Personas Contratista': 'Nº Personas Contratista',
        '承包商人数': '承包商人数',
        'Cargar / Actualizar': 'Cargar / Actualizar',
        '加载 / 更新': '加载 / 更新',
        'Exportar a Excel': 'Exportar a Excel',
        '导出到Excel': '导出到Excel',
        'Personas ECSA': 'Personas ECSA',
        'ECSA人员': 'ECSA人员',
        'Personas Contratista': 'Personas Contratista',
        '承包商人员': '承包商人员',
        'Número de Personas': 'Número de Personas',
        '人数': '人数',
        'Ej: DRT, DRQ, LABORATORIO, PISCINA A, PISCINA B': '示例: DRT, DRQ, 实验室, 池A, 池B',
        '✅ ¡Registro completado!': '✅ 登记完成！',
        'Los datos han sido guardados correctamente.': '数据已成功保存。',
        '⚠️ Registro guardado localmente': '⚠️ 数据本地保存',
        'Error al enviar a Google Apps Script.': '发送到 Google Apps Script 时出错。',
        '⚠️ Error de red': '⚠️ 网络错误',
    },
    'cn': {
        'SISTEMA DE GESTIÓN DE LA CALIDAD': '质量管理体系',
        '质量管理体系': 'SISTEMA DE GESTIÓN DE LA CALIDAD',
        'DEPARTAMENTO DE GESTIÓN DE DEPÓSITOS DE RELAVES': '尾矿库管理部',
        '尾矿库管理部': 'DEPARTAMENTO DE GESTIÓN DE DEPÓSITOS DE RELAVES',
        'Sistema de Mantenimiento': '维护系统',
        '维护系统': 'Sistema de Mantenimiento',
        'Fecha y Hora': '日期时间',
        '日期时间': 'Fecha y Hora',
        'Responsable': '负责人',
        '负责人': 'Responsable',
        'Frente de Trabajo': '工作面',
        '工作面': 'Frente de Trabajo',
        'Tema / Asunto': '主题 / 事项',
        '主题 / 事项': 'Tema / Asunto',
        'Actividades Realizadas': '已执行活动',
        '已执行活动': 'Actividades Realizadas',
        'Nº Personas ECSA': 'ECSA人数',
        'ECSA人数': 'Nº Personas ECSA',
        'Nº Personas Contratista': '承包商人数',
        '承包商人数': 'Nº Personas Contratista',
        'Registrar': '登记',
        '登记': 'Registrar',
        'Registro': '登记',
        '登记': 'Registro',
        'Consulta, Filtro y Gráfico': '查询、筛选和图表',
        '查询、筛选和图表': 'Consulta, Filtro y Gráfico',
        'Responsable': '负责人',
        '负责人': 'Responsable',
        'Tema / Asunto': '主题 / 事项',
        '主题 / 事项': 'Tema / Asunto',
        'Frente de Trabajo': '工作面',
        '工作面': 'Frente de Trabajo',
        'Fecha y Hora': '日期时间',
        '日期时间': 'Fecha y Hora',
        'Actividades Realizadas': '已执行活动',
        '已执行活动': 'Actividades Realizadas',
        'Nº Personas ECSA': 'ECSA人数',
        'ECSA人数': 'Nº Personas ECSA',
        'Nº Personas Contratista': '承包商人数',
        '承包商人数': 'Nº Personas Contratista',
        'Cargar / Actualizar': '加载 / 更新',
        '加载 / 更新': 'Cargar / Actualizar',
        'Exportar a Excel': '导出到Excel',
        '导出到Excel': 'Exportar a Excel',
        'Personas ECSA': 'ECSA人员',
        'ECSA人员': 'Personas ECSA',
        'Personas Contratista': '承包商人员',
        '承包商人员': 'Personas Contratista',
        'Número de Personas': '人数',
        '人数': 'Número de Personas',
        'Ej: DRT, DRQ, LABORATORIO, PISCINA A, PISCINA B': '示例: DRT, DRQ, 实验室, 池A, 池B',
        '✅ ¡Registro completado!': '✅ 登记完成！',
        'Los datos han sido guardados correctamente.': '数据已成功保存。',
        '⚠️ Registro guardado localmente': '⚠️ 数据本地保存',
        'Error al enviar a Google Apps Script.': '发送到 Google Apps Script 时出错。',
        '⚠️ Error de red': '⚠️ 网络错误',
    }
};

let idiomaActual = 'es';

// Función para cambiar el idioma
function cambiarIdioma() {
    // Alternar entre idiomas
    idiomaActual = idiomaActual === 'es' ? 'cn' : 'es';
    
    // Actualizar el icono del botón
    const icono = document.getElementById('lang-icon');
    if (icono) {
        icono.textContent = idiomaActual === 'es' ? '🇨🇳' : '🇪🇸';
    }
    
    // Traducir todos los elementos de texto
    const elementos = document.querySelectorAll('div, span, label, th, h1, h2, h3, h4, h5, h6, button, p, a, strong, small');
    elementos.forEach(elemento => {
        if (elemento.children.length === 0 && elemento.textContent.trim() !== '') {
            // Solo traducir si el elemento no tiene hijos (no es un contenedor)
            const textoOriginal = elemento.textContent.trim();
            if (traducciones[idiomaActual][textoOriginal]) {
                elemento.textContent = traducciones[idiomaActual][textoOriginal];
            }
        }
    });
    
    // Actualizar también placeholders
    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach(input => {
        const placeholderOriginal = input.getAttribute('placeholder');
        if (placeholderOriginal && traducciones[idiomaActual][placeholderOriginal]) {
            input.setAttribute('placeholder', traducciones[idiomaActual][placeholderOriginal]);
        }
    });
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

    // Función para establecer fechas diarias por defecto
    function establecerFechasDiarias() {
        const hoy = new Date();
        const fechaFormateada = hoy.toISOString().split('T')[0];
        document.getElementById('fechaDesde').value = fechaFormateada;
        document.getElementById('fechaHasta').value = fechaFormateada;
    }

    // Eventos de la pestaña de consulta
    document.getElementById('consulta-tab').addEventListener('click', function() {
        establecerFechasDiarias();
        cargarDatos();
    });
    document.getElementById('btnCargar').addEventListener('click', function() {
        // Si no hay fechas seleccionadas, usar el día actual como predeterminado
        if (!document.getElementById('fechaDesde').value && !document.getElementById('fechaHasta').value) {
            establecerFechasDiarias();
        }
        cargarDatos();
    });
    document.getElementById('btnExportar').addEventListener('click', exportarAExcel);

    ['filtroResponsable', 'filtroTema', 'filtroFrente'].forEach(id => {
        document.getElementById(id).addEventListener('input', aplicarFiltros);
    });

    ['fechaDesde', 'fechaHasta'].forEach(id => {
        document.getElementById(id).addEventListener('change', aplicarFiltros);
    });

    // Evento para el botón de cambio de idioma
    const btnToggleLang = document.getElementById('btn-toggle-lang');
    if (btnToggleLang) {
        btnToggleLang.addEventListener('click', cambiarIdioma);
    }

    // Evento para el botón de valores comunes
    function llenarValoresComunes(numEcsa, numContratista) {
        document.getElementById('numeroEcsa').value = numEcsa;
        document.getElementById('numeroContratista').value = numContratista;
    }

    // Evento del formulario de registro
    const form = document.getElementById('mantenimientoForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const mensajeDiv = document.getElementById('mensajeRegistro');

    // Funciones para manejar el campo select de frente con opción de entrada manual
    document.getElementById('frenteSelect').addEventListener('change', function() {
        const frenteManual = document.getElementById('frenteManual');
        if (this.value === 'OTRO') {
            frenteManual.style.display = 'block';
            frenteManual.required = true;
        } else {
            frenteManual.style.display = 'none';
            frenteManual.required = false;
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        mensajeDiv.innerHTML = '';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Obtener valor real del frente considerando el campo select y manual
        let frente = '';
        if (data.frenteSelect === 'OTRO' && data.frenteManual) {
            frente = data.frenteManual.toUpperCase();
        } else {
            frente = data.frenteSelect.toUpperCase();
        }
        
        // Datos para envío
        const datosParaEnvio = {
            fechaHora: data.fechaHora,
            responsable: data.responsable.toUpperCase(),
            tema: data.tema.toUpperCase(),
            frente: frente,
            actividades: data.actividades,
            numeroEcsa: data.numeroEcsa,
            numeroContratista: data.numeroContratista
        };
        
        console.log('Datos a enviar:', datosParaEnvio); // Debug log

        try {
            // Crear objeto con los campos esperados por Google Apps Script
            const params = new URLSearchParams(datosParaEnvio);
            
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
                    'Fecha y Hora': datosParaEnvio.fechaHora,
                    'Responsable': datosParaEnvio.responsable,
                    'Tema / Asunto': datosParaEnvio.tema,
                    'Frente de Trabajo': datosParaEnvio.frente,
                    'Actividades Realizadas': datosParaEnvio.actividades,
                    'Nº Personas ECSA': datosParaEnvio.numeroEcsa,
                    'Nº Personas Contratista': datosParaEnvio.numeroContratista
                };
                todosLosRegistros.push(nuevoRegistro);
                guardarDatosLocales();
                
                // Actualizar la vista si estamos en la pestaña de consulta
                if (document.querySelector('#consulta').classList.contains('show')) {
                    aplicarFiltros();
                }
                
                form.reset();
                // Mostrar campo manual del frente como oculto después del reset
                document.getElementById('frenteManual').style.display = 'none';
                
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
                    'Fecha y Hora': datosParaEnvio.fechaHora,
                    'Responsable': datosParaEnvio.responsable,
                    'Tema / Asunto': datosParaEnvio.tema,
                    'Frente de Trabajo': datosParaEnvio.frente,
                    'Actividades Realizadas': datosParaEnvio.actividades,
                    'Nº Personas ECSA': datosParaEnvio.numeroEcsa,
                    'Nº Personas Contratista': datosParaEnvio.numeroContratista
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
            const nuevoRegistro = {
                'Fecha y Hora': datosParaEnvio.fechaHora,
                'Responsable': datosParaEnvio.responsable,
                'Tema / Asunto': datosParaEnvio.tema,
                'Frente de Trabajo': datosParaEnvio.frente,
                'Actividades Realizadas': datosParaEnvio.actividades,
                'Nº Personas ECSA': datosParaEnvio.numeroEcsa,
                'Nº Personas Contratista': datosParaEnvio.numeroContratista
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