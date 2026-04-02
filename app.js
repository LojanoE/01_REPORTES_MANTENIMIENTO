// ===== CONFIGURACIÓN SUPABASE =====
const SUPABASE_URL = 'https://dzmhhlsttqygjvfabdxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
        const fecha = formatearFecha(reg.fecha_hora);
        const responsable = reg.responsable || '';
        const tema = reg.tema || '';
        const frente = reg.frente || '';
        const actividades = reg.actividades || '';
            
        const actividadesHtml = actividades.includes('\n')
            ? '<ul>' + actividades.split('\n').filter(line => line.trim() !== '').map(linea => `<li>${linea}</li>`).join('') + '</ul>'
            : actividades;
            
        const numeroEcsa = reg.numero_ecsa || 0;
        const numeroContratista = reg.numero_contratista || 0;

        return `
            <tr>
                <td>${fecha}</td>
                <td>${responsable}</td>
                <td>${tema}</td>
                <td>${frente}</td>
                <td>${actividadesHtml}</td>
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
        totalEcsa += parseInt(reg.numero_ecsa) || 0;
        totalContratista += parseInt(reg.numero_contratista) || 0;
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
        const responsable = (reg.responsable || '').toLowerCase();
        const tema = (reg.tema || '').toLowerCase();
        const frente = (reg.frente || '').toLowerCase();
        
        if (filtroResp && !responsable.includes(filtroResp)) return false;
        if (filtroTema && !tema.includes(filtroTema)) return false;
        if (filtroFrente && !frente.includes(filtroFrente)) return false;

        const fechaRegistro = extraerFecha(reg.fecha_hora);
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
    mensajeDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-arrow-repeat me-2"></i>Cargando datos desde Supabase...</div>';

    try {
        const { data, error } = await _supabase
            .from('mantenimiento')
            .select('*')
            .order('fecha_hora', { ascending: false });

        if (error) throw error;
        
        todosLosRegistros = data || [];
        guardarDatosLocales();
        
        if (todosLosRegistros.length > 0) {
            mensajeDiv.innerHTML = `<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Cargados ${todosLosRegistros.length} registros</div>`;
        } else {
            mensajeDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay registros en la base de datos</div>';
        }
    } catch (error) {
        console.error('Error al cargar desde Supabase:', error);
        const datosLocales = cargarDatosLocales();
        if (datosLocales.length > 0) {
            todosLosRegistros = datosLocales;
            mensajeDiv.innerHTML = `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>Cargando ${datosLocales.length} registros locales. Error: ${error.message}</div>`;
        } else {
            mensajeDiv.innerHTML = `<div class="alert alert-danger"><i class="bi bi-x-circle me-2"></i>Error al cargar los datos: ${error.message}</div>`;
            todosLosRegistros = [];
        }
    }

    aplicarFiltros();
    setTimeout(() => {
        if (!mensajeDiv.innerHTML.includes('alert-danger')) mensajeDiv.innerHTML = '';
    }, 3000);
}

function exportarAExcel() {
    const registrosFiltrados = aplicarFiltros();

    if (registrosFiltrados.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    const datosExcel = registrosFiltrados.map(reg => ({
        'Fecha y Hora': formatearFecha(reg.fecha_hora),
        'Responsable': reg.responsable || '',
        'Tema / Asunto': reg.tema || '',
        'Frente de Trabajo': reg.frente || '',
        'Actividades Realizadas': reg.actividades || '',
        'Nº Personas ECSA': reg.numero_ecsa || 0,
        'Nº Personas Contratista': reg.numero_contratista || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reportes");
    XLSX.writeFile(wb, "Reportes_Mantenimiento.xlsx");
    
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

    // Lógica para auto-viñetas en el campo de actividades
    const actividadesTextarea = document.getElementById('actividades');
    actividadesTextarea.addEventListener('focus', function() {
        if (this.value === '') {
            this.value = '• ';
        }
    });
    actividadesTextarea.addEventListener('keydown', function(e) {
        const start = this.selectionStart;
        const end = this.selectionEnd;

        if (e.key === 'Enter') {
            e.preventDefault();
            this.value = this.value.substring(0, start) + '\n• ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 3;
            return;
        }

        // Prevenir borrar la viñeta con la tecla Backspace solo si la línea tiene texto
        if (e.key === 'Backspace' && start === end) {
            const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
            
            // Si el cursor está justo después de la viñeta ('• ')
            if (start === lineStart + 2 && this.value.substring(lineStart, start) === '• ') {
                
                // Revisa si hay texto en el resto de la línea
                let lineEnd = this.value.indexOf('\n', start);
                if (lineEnd === -1) {
                    lineEnd = this.value.length;
                }
                const lineContent = this.value.substring(start, lineEnd);

                // Si la línea tiene contenido (no solo espacios), protege la viñeta
                if (lineContent.trim() !== '') {
                    e.preventDefault(); // Prevenir el borrado
                }
                // Si la línea está vacía, permite que el usuario borre la viñeta.
            }
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
        
        // Limpiar viñetas de las actividades antes de enviar
        const actividadesSinVinetas = data.actividades.split('\n')
            .map(line => line.replace(/^•\s*/, '').trim())
            .filter(line => line)
            .join('\n');

        // Datos para envío a Supabase (usando snake_case para las columnas)
        const datosParaEnvio = {
            fecha_hora: data.fechaHora,
            responsable: data.responsable.toUpperCase(),
            tema: data.tema.toUpperCase(),
            frente: frente,
            actividades: actividadesSinVinetas,
            numero_ecsa: parseInt(data.numeroEcsa) || 0,
            numero_contratista: parseInt(data.numeroContratista) || 0
        };
        
        console.log('Datos a enviar a Supabase:', datosParaEnvio);

        try {
            const { data: result, error } = await _supabase
                .from('mantenimiento')
                .insert([datosParaEnvio])
                .select();

            if (error) throw error;
            
            console.log('Respuesta de Supabase:', result);

            // Mostrar mensaje de éxito
            mostrarModalExito("✅ ¡Registro completado!", "Los datos han sido guardados correctamente en Supabase.");
            
            // Agregar el registro a la lista local
            todosLosRegistros.unshift(result[0]); // Agregarlo al inicio
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

        } catch (error) {
            console.error('Error al enviar a Supabase:', error);
            
            // En caso de error, guardar localmente como respaldo
            todosLosRegistros.unshift(datosParaEnvio);
            guardarDatosLocales();
            
            if (document.querySelector('#consulta').classList.contains('show')) {
                aplicarFiltros();
            }
            
            mostrarModalError("⚠️ Error al guardar", `Se guardó localmente, pero no se pudo sincronizar con Supabase: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar';
        }
    });
});