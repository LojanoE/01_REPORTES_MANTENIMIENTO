// --- APPLICATION VERSIONING ---
const APP_VERSION = '2.0.0'; // Unified auth system

let levelChartInstance = null;
let currentSession = null;

function initVersion() {
    document.querySelectorAll('.app-version-text').forEach(el => {
        el.innerText = APP_VERSION;
    });
}

function forceUpdate() {
    if (confirm("Se forzará la recarga de la aplicación para obtener la última versión. ¿Continuar?")) {
        window.location.reload(true);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    currentSession = Auth.initPage();
    if (!currentSession) return;
    supabaseClient = Auth.getSupabaseClient();
    Auth.renderUserBar('userBar');
    initVersion();
    applyRolePermissions(currentSession.role);
    loadDataByDate();
});

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://dzmhhlsttqygjvfabdxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK';
let supabaseClient = null;

// Apply role-based tab visibility
function applyRolePermissions(role) {
    const verificacionTab = document.getElementById('verificacion-tab');

    if (verificacionTab) verificacionTab.style.display = 'none';

    if (role === 'admin' || role === 'user') {
        if (verificacionTab) verificacionTab.style.display = 'block';
    }

    let firstVisibleTab = null;
    if (role === 'admin' || role === 'user') {
        firstVisibleTab = document.getElementById('verificacion-tab');
    } else {
        firstVisibleTab = document.getElementById('reportes-tab');
    }
    
    if (firstVisibleTab) {
        const tab = new bootstrap.Tab(firstVisibleTab);
        tab.show();
    }
}

// Checklist Items Data
const checklistItems = [
    {
        zh: "柴油发电机，油罐，油管是否是否有柴油溢出，柴油机内部是否漏油，油罐阀门是否关闭",
        es: "Si el motor diesel, el tanque de aceite y la tubería de aceite tienen fugas de aceite, Si la válvula del tanque diesel está cerrada",
        id: "q1"
    },
    {
        zh: "柴油漏油槽，发电机周围是否有油渍，油渍是否清理",
        es: "Tanque de fugas de aceite diesel, si hay manchas de aceite alrededor del generador and si las manchas de aceite se limpian",
        id: "q2"
    },
    {
        zh: "浮船是否牢靠，是否有浮块散架",
        es: "Si el pontón es confiable and si hay bloques flotantes que se desmoronan",
        id: "q3"
    },
    {
        zh: "2台水泵是否运行正常",
        es: "Funcionan normalmente las 2 bombas",
        id: "q4"
    },
    {
        zh: "道路及边坡是否正常，是否有滑坡现象",
        es: "Si los caminos and pendientes son normales and si hay algún fenómeno de derrumbe",
        id: "q5"
    },
    {
        zh: "垃圾是否进袋，每班次是否带走当班垃圾",
        es: "Si la basura se pone in la bolsa and si la basura de turno se retira en cada turno.",
        id: "q6"
    },
    {
        zh: "排洪井安全设施是否正常（安全网，安全钢绳）",
        es: "Si las instalaciones de seguridad de los pozos de descarga de inundación son normales (red segura, cuerda de acero de seguridad)",
        id: "q7"
    }
];

let currentDayRecords = [];

document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('checklistBody');
    if (tbody) {
        checklistItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="zh-text">${index + 1}. ${item.zh}</span>
                    <span class="es-text">${item.es}</span>
                </td>
                <td>
                    <select class="form-select form-select-sm" name="day_${item.id}">
                        <option value="">-</option>
                        <option value="OK">SI</option>
                        <option value="X">NO</option>
                    </select>
                    <input type="text" class="form-control form-control-sm mt-1" placeholder="Nota..." name="day_note_${item.id}">
                </td>
                <td>
                    <select class="form-select form-select-sm" name="night_${item.id}">
                        <option value="">-</option>
                        <option value="OK">SI</option>
                        <option value="X">NO</option>
                    </select>
                    <input type="text" class="form-control form-control-sm mt-1" placeholder="Nota..." name="night_note_${item.id}">
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
        dateInput.addEventListener('change', loadDataByDate);
    }

    const graficaTabEl = document.getElementById('grafica-tab');
    if (graficaTabEl) {
        graficaTabEl.addEventListener('shown.bs.tab', () => {
            const startInput = document.getElementById('chartStartDate');
            const endInput = document.getElementById('chartEndDate');
            if (startInput && endInput && (!startInput.value || !endInput.value)) {
                const today = new Date();
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(today.getDate() - 14);
                startInput.valueAsDate = twoWeeksAgo;
                endInput.valueAsDate = today;
            }
            renderWaterLevelChart();
        });
    }

    const bombasTabEl = document.getElementById('bombas-tab');
    if (bombasTabEl) {
        bombasTabEl.addEventListener('shown.bs.tab', () => {
            const startInput = document.getElementById('pumpStartDate');
            const endInput = document.getElementById('pumpEndDate');
            if (startInput && endInput && (!startInput.value || !endInput.value)) {
                const today = new Date();
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(today.getDate() - 14);
                startInput.valueAsDate = twoWeeksAgo;
                endInput.valueAsDate = today;
            }
            loadPumpRecordsReport();
        });
    }
});

async function loadDataByDate() {
    const dateInput = document.getElementById('date');
    const date = dateInput.value;
    if (!date) return;

    try {
        const { data, error } = await supabaseClient
            .from('inspections')
            .select('*')
            .eq('inspection_date', date)
            .order('version', { ascending: false });

        if (error) throw error;
        currentDayRecords = data || [];

        const { data: pumpData, error: pumpError } = await supabaseClient
            .from('pump_records')
            .select('*')
            .eq('inspection_date', date)
            .maybeSingle();

        if (pumpError) console.error(pumpError);
        else loadPumpFields(pumpData);

        if (currentDayRecords.length > 0) loadSpecificVersion(currentDayRecords[0].id);
        else clearFormDataOnly();
    } catch (err) {
        console.error(err);
    }
}

function loadPumpFields(data) {
    const fields = ['day_pump_open', 'day_pump_close', 'day_pump_quantity', 'day_water_level_before', 'day_water_level_after', 'day_mud_level',
        'night_pump_open', 'night_pump_close', 'night_pump_quantity', 'night_water_level_before', 'night_water_level_after', 'night_mud_level'];
    fields.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = (data && data[f]) ? data[f] : '';
    });
}

function loadSpecificVersion(id) {
    const data = currentDayRecords.find(r => r.id == id);
    if (!data) return;
    document.getElementById('currentRecordId').value = data.id;
    document.getElementById('dayShiftPerson').value = data.day_shift_person || '';
    document.getElementById('nightShiftPerson').value = data.night_shift_person || '';
    document.getElementById('dayRemarks').value = data.day_remarks || '';
    document.getElementById('nightRemarks').value = data.night_remarks || '';

    const checklist = data.checklist_data || [];
    checklist.forEach(item => {
        const ds = document.querySelector(`[name="day_${item.id}"]`);
        const dn = document.querySelector(`[name="day_note_${item.id}"]`);
        const ns = document.querySelector(`[name="night_${item.id}"]`);
        const nn = document.querySelector(`[name="night_note_${item.id}"]`);
        if (ds) ds.value = item.day_status || '';
        if (dn) dn.value = item.day_note || '';
        if (ns) ns.value = item.night_status || '';
        if (nn) nn.value = item.night_note || '';
    });
}

function clearFormDataOnly() {
    const crId = document.getElementById('currentRecordId');
    if (crId) crId.value = '';
    document.getElementById('dayShiftPerson').value = '';
    document.getElementById('nightShiftPerson').value = '';
    document.getElementById('dayRemarks').value = '';
    document.getElementById('nightRemarks').value = '';
    document.querySelectorAll('#checklistBody select, #checklistBody input').forEach(el => el.value = '');
    loadPumpFields(null);
}

function clearForm() {
    if (confirm('¿Borrar todo el formulario?')) {
        const form = document.getElementById('inspectionForm');
        if (form) form.reset();
        document.getElementById('date').valueAsDate = new Date();
        loadDataByDate();
    }
}

async function saveToDatabase(silent = false) {
    const btn = document.querySelector('button[onclick="saveToDatabase()"]');
    const originalText = btn ? btn.innerText : '';
    if (btn) { btn.innerText = "Guardando..."; btn.disabled = true; }

    try {
        const checklistData = checklistItems.map(item => ({
            id: item.id,
            question_zh: item.zh,
            question_es: item.es,
            day_status: document.querySelector(`[name="day_${item.id}"]`).value,
            day_note: document.querySelector(`[name="day_note_${item.id}"]`).value,
            night_status: document.querySelector(`[name="night_${item.id}"]`).value,
            night_note: document.querySelector(`[name="night_note_${item.id}"]`).value
        }));

        const inspectionDate = document.getElementById('date').value;
        const currentRecordId = document.getElementById('currentRecordId').value;

        const payload = {
            inspection_date: inspectionDate,
            day_shift_person: document.getElementById('dayShiftPerson').value,
            night_shift_person: document.getElementById('nightShiftPerson').value,
            day_remarks: document.getElementById('dayRemarks').value,
            night_remarks: document.getElementById('nightRemarks').value,
            checklist_data: checklistData,
            created_by_name: currentSession ? currentSession.username : 'Sistema'
        };

        let result;
        // Check if there's an existing record for this date to update instead of inserting new version
        const existingRecord = currentDayRecords[0];
        if (existingRecord) {
            result = await supabaseClient.from('inspections').update(payload).eq('id', existingRecord.id).select();
        } else {
            payload.version = 1;
            result = await supabaseClient.from('inspections').insert([payload]).select();
        }
        if (result.error) throw result.error;

        const pumpPayload = { inspection_date: inspectionDate };
        ['day_pump_open', 'day_pump_close', 'day_pump_quantity', 'day_water_level_before', 'day_water_level_after', 'day_mud_level',
            'night_pump_open', 'night_pump_close', 'night_pump_quantity', 'night_water_level_before', 'night_water_level_after', 'night_mud_level'].forEach(f => {
                const el = document.getElementById(f);
                if (el) {
                    const val = el.value;
                    pumpPayload[f] = val === '' ? null : val;
                }
            });

        const { error: pumpError } = await supabaseClient.from('pump_records').upsert(pumpPayload, { onConflict: 'inspection_date' });
        if (pumpError) throw pumpError;

        if (!silent) alert('¡Datos guardados exitosamente!');
        await loadDataByDate();
        return true;
    } catch (error) {
        console.error(error);
        alert('Error: ' + error.message);
        return false;
    } finally {
        if (btn) { btn.innerText = originalText; btn.disabled = false; }
    }
}

async function exportToPDF() {
    const saved = await saveToDatabase(true);
    if (!saved && !confirm("No se pudo guardar. ¿Generar PDF de todos modos?")) return;

    const record = currentDayRecords[0] || {};
    const date = document.getElementById('date').value;
    const dayPerson = document.getElementById('dayShiftPerson').value || record.day_shift_person || '-';
    const nightPerson = document.getElementById('nightShiftPerson').value || record.night_shift_person || '-';
    const dayRemarks = document.getElementById('dayRemarks').value || record.day_remarks || '-';
    const nightRemarks = document.getElementById('nightRemarks').value || record.night_remarks || '-';

    const fmt = (v) => v === 'OK' ? '√ (SI)' : (v === 'X' ? 'X (NO)' : (v === 'NA' ? 'N/A' : '-'));

    let tableRows = '';
    checklistItems.forEach(item => {
        const ds_el = document.querySelector(`[name="day_${item.id}"]`);
        const dn_el = document.querySelector(`[name="day_note_${item.id}"]`);
        const ns_el = document.querySelector(`[name="night_${item.id}"]`);
        const nn_el = document.querySelector(`[name="night_note_${item.id}"]`);

        let ds = ds_el ? ds_el.value : '';
        let dn = dn_el ? dn_el.value : '';
        let ns = ns_el ? ns_el.value : '';
        let nn = nn_el ? nn_el.value : '';

        if (record.checklist_data) {
            const memItem = record.checklist_data.find(c => c.id === item.id);
            if (memItem) {
                if (!ds) ds = memItem.day_status;
                if (!dn) dn = memItem.day_note;
                if (!ns) ns = memItem.night_status;
                if (!nn) nn = memItem.night_note;
            }
        }

        tableRows += `<tr><td style="border: 1px solid #333; padding: 8px;">${item.zh}<br><b>${item.es}</b></td><td style="border: 1px solid #333; padding: 8px; text-align: center;"><b>${fmt(ds)}</b>${dn ? '<div>' + dn + '</div>' : ''}</td><td style="border: 1px solid #333; padding: 8px; text-align: center;"><b>${fmt(ns)}</b>${nn ? '<div>' + nn + '</div>' : ''}</td></tr>`;
    });

    const htmlContent = `<div style="padding: 20px; font-family: Arial, sans-serif;"><div style="text-align: center; margin-bottom: 20px;"><h2 style="margin: 0;">排洪井安全、环境、排水生产检查表</h2><h3 style="margin: 5px 0 0 0;">Lista de verificación ambiental y de seguridad de pozos de inundación</h3></div><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr><td style="border: 1px solid #333; padding: 8px;"><b>日期Fecha:</b> ${date}</td><td style="border: 1px solid #333; padding: 8px;"><b>白班当班人 Dia:</b> ${dayPerson}</td><td style="border: 1px solid #333; padding: 8px;"><b>夜班当班人 Noche:</b> ${nightPerson}</td></tr></table><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><thead><tr style="background: #ddd;"><th style="border: 1px solid #333; padding: 8px; text-align: left;">检查项目Artículos marcados</th><th style="border: 1px solid #333; padding: 8px; text-align: center;">白班 Día</th><th style="border: 1px solid #333; padding: 8px; text-align: center;">夜班当班人 Noche:</th></tr></thead><tbody>${tableRows}</tbody></table><div style="font-size: 11px;"><div style="margin-bottom: 10px; border: 1px solid #333; padding: 8px;"><b>备注 (白班) Obs. Día:</b> ${dayRemarks}</div><div style="border: 1px solid #333; padding: 8px;"><b>备注 (夜班) Obs. Noche:</b> ${nightRemarks}</div></div></div>`;

    const container = document.getElementById('hiddenCaptureContainer');
    container.innerHTML = htmlContent;
    container.style.display = 'block';

    try {
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Inspeccion_${date}.pdf`,
            html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
        };

        await html2pdf().set(opt).from(container).save().then(() => {
            container.innerHTML = '';
            container.style.display = 'none';
        });
    } catch (err) {
        console.error('PDF Error:', err);
        alert('Error al generar PDF: ' + err.message);
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

async function exportRangeToZip() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const statusDiv = document.getElementById('exportStatus');
    const progressBar = document.getElementById('exportProgressBar');
    const statusText = document.getElementById('exportStatusText');

    if (!start || !end) return alert("Seleccione fechas.");
    statusDiv.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.innerText = "Consultando...";

    try {
        const { data, error } = await supabaseClient.from('inspections').select('*').gte('inspection_date', start).lte('inspection_date', end).order('inspection_date', { ascending: true });
        if (error) throw error;
        if (!data.length) { alert("Sin registros."); statusDiv.style.display = 'none'; return; }

        const zip = new JSZip();
        for (let i = 0; i < data.length; i++) {
            const progress = Math.round(((i) / data.length) * 100);
            progressBar.style.width = `${progress}%`;
            statusText.innerText = `Procesando: ${data[i].inspection_date} (${i + 1}/${data.length})`;
            const pdfBlob = await generatePDFBlob(data[i]);
            zip.file(`Inspeccion_${data[i].inspection_date}.pdf`, pdfBlob);
        }
        statusText.innerText = "Empaquetando ZIP...";
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `Inspecciones_${start}_${end}.zip`);
        statusText.innerText = "¡Listo!";
        setTimeout(() => { statusDiv.style.display = 'none'; }, 2000);
    } catch (err) { console.error(err); alert(err.message); statusDiv.style.display = 'none'; }
}

async function generatePDFBlob(record) {
    const fmt = (v) => v === 'OK' ? '√ (SI)' : (v === 'X' ? 'X (NO)' : (v === 'NA' ? 'N/A' : '-'));
    let tableRows = '';
    (record.checklist_data || []).forEach(item => {
        tableRows += `<tr><td style="border: 1px solid #333; padding: 8px;">${item.question_zh}<br><b>${item.question_es}</b></td><td style="border: 1px solid #333; padding: 8px; text-align: center;"><b>${fmt(item.day_status)}</b>${item.day_note ? '<div>' + item.day_note + '</div>' : ''}</td><td style="border: 1px solid #333; padding: 8px; text-align: center;"><b>${fmt(item.night_status)}</b>${item.night_note ? '<div>' + item.night_note + '</div>' : ''}</td></tr>`;
    });
    const htmlContent = `<div style="padding: 20px; font-family: Arial, sans-serif; width: 100%;"><div style="text-align: center; margin-bottom: 20px;"><h2 style="margin: 0;">排洪井安全、环境、排水生产检查表</h2><h3 style="margin: 5px 0 0 0;">Lista de verificación ambiental y de seguridad de pozos de inundación</h3></div><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tr><td style="border: 1px solid #333; padding: 8px;"><b>Fecha:</b> ${record.inspection_date}</td><td style="border: 1px solid #333; padding: 8px;"><b>白班当班人 Día:</b> ${record.day_shift_person || '-'}</td><td style="border: 1px solid #333; padding: 8px;"><b>夜班当班人 Noche:</b> ${record.night_shift_person || '-'}</td></tr></table><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><thead><tr style="background: #ddd;"><th style="border: 1px solid #333; padding: 8px; text-align: left;">检查项目Artículos marcados</th><th style="border: 1px solid #333; padding: 8px; text-align: center;">白班 Día</th><th style="border: 1px solid #333; padding: 8px; text-align: center;">夜班 Noche</th></tr></thead><tbody>${tableRows}</tbody></table><div style="font-size: 11px;"><div style="margin-bottom: 10px; border: 1px solid #333; padding: 8px;"><b>备注 (白班) Obs. Día:</b> ${record.day_remarks || '-'}</div><div style="border: 1px solid #333; padding: 8px;"><b>备注 (夜班) Obs. Noche:</b> ${record.night_remarks || '-'}</div></div></div>`;

    const container = document.createElement('div');
    container.id = 'pdf-blob-temp';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
        const blob = await html2pdf().set({
            margin: 0,
            html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(container).output('blob');
        document.body.removeChild(container);
        return blob;
    } catch (err) {
        document.body.removeChild(container);
        throw err;
    }
}

async function performQuery() {
    const start = document.getElementById('queryStartDate').value;
    const end = document.getElementById('queryEndDate').value;
    if (!start || !end) return alert("Seleccione fechas.");
    try {
        const { data, error } = await supabaseClient.from('inspections').select('*').gte('inspection_date', start).lte('inspection_date', end).order('inspection_date', { ascending: false });
        if (error) throw error;
        queryResults = data || [];
        const body = document.getElementById('queryResultsBody');
        body.innerHTML = '';
        queryResults.forEach(r => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><input type="checkbox" class="record-checkbox" value="${r.id}"></td><td>${r.inspection_date}</td><td>${r.day_shift_person || '-'}</td><td>${r.night_shift_person || '-'}</td><td><button class="btn btn-sm btn-outline-primary" onclick="loadAndSwitchToVerificacion('${r.id}')">Ver</button></td>`;
            body.appendChild(row);
        });
    } catch (err) { alert(err.message); }
}

function toggleSelectAll() {
    const master = document.getElementById('selectAll');
    document.querySelectorAll('.record-checkbox').forEach(cb => cb.checked = master.checked);
}

function loadAndSwitchToVerificacion(id) {
    const r = queryResults.find(x => x.id == id);
    if (!r) return;
    document.getElementById('date').value = r.inspection_date;
    loadDataByDate().then(() => {
        loadSpecificVersion(r.id);
        const tabEl = document.querySelector('#verificacion-tab');
        const tab = new bootstrap.Tab(tabEl);
        tab.show();
    });
}

async function loadPumpRecordsReport() {
    const start = document.getElementById('pumpStartDate').value;
    const end = document.getElementById('pumpEndDate').value;
    const body = document.getElementById('pumpReportBody');
    if (!start || !end) return alert("Seleccione fechas.");

    body.innerHTML = '<tr><td colspan="13" class="text-center">Buscando...</td></tr>';
    try {
        const { data, error } = await supabaseClient.from('pump_records').select('*').gte('inspection_date', start).lte('inspection_date', end).order('inspection_date', { ascending: false });
        if (error) throw error;
        body.innerHTML = '';
        if (!data.length) body.innerHTML = '<tr><td colspan="13" class="text-center">Sin datos</td></tr>';
        else data.forEach(r => {
            const row = document.createElement('tr');
            row.innerHTML = `<td class="text-center fw-bold">${r.inspection_date}</td><td>${r.day_pump_open || '-'}</td><td>${r.day_pump_close || '-'}</td><td>${r.day_pump_quantity || '-'}</td><td>${r.day_water_level_before || '-'}</td><td>${r.day_water_level_after || '-'}</td><td>${r.day_mud_level || '-'}</td><td class="bg-dark text-white">${r.night_pump_open || '-'}</td><td class="bg-dark text-white">${r.night_pump_close || '-'}</td><td class="bg-dark text-white">${r.night_pump_quantity || '-'}</td><td class="bg-dark text-white">${r.night_water_level_before || '-'}</td><td class="bg-dark text-white">${r.night_water_level_after || '-'}</td><td class="bg-dark text-white">${r.night_mud_level || '-'}</td>`;
            body.appendChild(row);
        });
        // Store data for export
        window.currentPumpData = data;
    } catch (err) { alert(err.message); }
}

// Export pump records to Excel
function exportPumpToExcel() {
    const start = document.getElementById('pumpStartDate').value;
    const end = document.getElementById('pumpEndDate').value;
    
    if (!start || !end) return alert("Seleccione fechas primero.");
    if (!window.currentPumpData || window.currentPumpData.length === 0) return alert("No hay datos para exportar. Realice una búsqueda primero.");

    // Prepare data for Excel
    const excelData = window.currentPumpData.map(r => ({
        'Fecha': r.inspection_date,
        'Día - Apertura': r.day_pump_open || '-',
        'Día - Cierre': r.day_pump_close || '-',
        'Día - Cantidad': r.day_pump_quantity || '-',
        'Día - Nivel Agua (Antes)': r.day_water_level_before || '-',
        'Día - Nivel Agua (Después)': r.day_water_level_after || '-',
        'Día - Lodo': r.day_mud_level || '-',
        'Noche - Apertura': r.night_pump_open || '-',
        'Noche - Cierre': r.night_pump_close || '-',
        'Noche - Cantidad': r.night_pump_quantity || '-',
        'Noche - Nivel Agua (Antes)': r.night_water_level_before || '-',
        'Noche - Nivel Agua (Después)': r.night_water_level_after || '-',
        'Noche - Lodo': r.night_mud_level || '-'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 12 }, // Día - Apertura
        { wch: 12 }, // Día - Cierre
        { wch: 10 }, // Día - Cantidad
        { wch: 18 }, // Día - Nivel Agua (Antes)
        { wch: 18 }, // Día - Nivel Agua (Después)
        { wch: 10 }, // Día - Lodo
        { wch: 12 }, // Noche - Apertura
        { wch: 12 }, // Noche - Cierre
        { wch: 10 }, // Noche - Cantidad
        { wch: 18 }, // Noche - Nivel Agua (Antes)
        { wch: 18 }, // Noche - Nivel Agua (Después)
        { wch: 10 }  // Noche - Lodo
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Registro de Bombas");

    // Generate filename with date range
    const filename = `Reporte_Bombas_${start}_al_${end}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
}

async function renderWaterLevelChart() {
    const start = document.getElementById('chartStartDate').value;
    const end = document.getElementById('chartEndDate').value;
    const canvas = document.getElementById('waterLevelChart');
    if (!start || !end || !canvas) return alert("Seleccione fechas.");
    const ctx = canvas.getContext('2d');
    try {
        const { data, error } = await supabaseClient.from('pump_records').select('inspection_date, day_water_level_after, night_water_level_after').gte('inspection_date', start).lte('inspection_date', end).order('inspection_date', { ascending: true });
        if (error) throw error;
        if (!data.length) return alert("Sin datos.");
        const labels = data.map(r => r.inspection_date);
        const dayLevels = data.map(r => r.day_water_level_after);
        const nightLevels = data.map(r => r.night_water_level_after);
        if (levelChartInstance) levelChartInstance.destroy();
        levelChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Nivel Día (m)', data: dayLevels, borderColor: '#0dcaf0', backgroundColor: 'rgba(13, 202, 240, 0.1)', borderWidth: 2, tension: 0.3, fill: true, spanGaps: true }, { label: 'Nivel Noche (m)', data: nightLevels, borderColor: '#212529', backgroundColor: 'rgba(33, 37, 41, 0.05)', borderWidth: 2, tension: 0.3, fill: true, spanGaps: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: { display: true, text: 'Elevación (m)' } }, x: { title: { display: true, text: 'Fecha' } } } } });
    } catch (err) { console.error(err); alert(err.message); }
}

document.addEventListener('DOMContentLoaded', () => {
    const bombasTabEl = document.getElementById('bombas-tab');
    if (bombasTabEl) {
        bombasTabEl.addEventListener('shown.bs.tab', () => {
            const startInput = document.getElementById('pumpStartDate');
            const endInput = document.getElementById('pumpEndDate');
            if (startInput && endInput && (!startInput.value || !endInput.value)) {
                const today = new Date();
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(today.getDate() - 14);
                startInput.valueAsDate = twoWeeksAgo;
                endInput.valueAsDate = today;
            }
            loadPumpRecordsReport();
        });
    }
});
