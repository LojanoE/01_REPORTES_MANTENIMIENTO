document.addEventListener('DOMContentLoaded', async () => {
    const session = Auth.initPage();
    if (!session) return;

    Auth.renderUserBar('userBar');

    if (session.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    // Cargar todo en paralelo
    try {
        await Promise.all([
            loadBodegasList(),
            loadInventory(),
            loadTransactions()
        ]);
    } catch (err) {
        console.error('Error cargando datos:', err);
    }

    populateBodegas();

    document.getElementById('inventorySearch')?.addEventListener('input', debounce(filterInventory, 300));
    document.getElementById('bodegaFilter')?.addEventListener('change', filterInventory);
    document.getElementById('typeFilter')?.addEventListener('change', filterTransactions);
    document.getElementById('dateFilter')?.addEventListener('change', filterTransactions);
    document.getElementById('transBodegaFilter')?.addEventListener('change', filterTransactions);
    document.getElementById('itemForm')?.addEventListener('submit', handleNewItem);
    document.getElementById('ingresoForm')?.addEventListener('submit', handleNewIngreso);
    document.getElementById('egresoForm')?.addEventListener('submit', handleNewEgreso);
    document.getElementById('bodegaForm')?.addEventListener('submit', handleNewBodega);
    document.getElementById('loadMoreBtn')?.addEventListener('click', loadMoreTransactions);

    document.getElementById('ingresoBodega')?.addEventListener('change', () => {
        filterItemsByBodega('ingresoItem', 'ingresoBodega');
        document.getElementById('ingresoItemInfo').textContent = '';
    });
    document.getElementById('egresoBodega')?.addEventListener('change', () => {
        filterItemsByBodega('egresoItem', 'egresoBodega');
        document.getElementById('egresoItemInfo').textContent = '';
        document.getElementById('egresoStockInfo').textContent = '';
    });
    document.getElementById('ingresoItem')?.addEventListener('change', onIngresoItemChange);
    document.getElementById('egresoItem')?.addEventListener('change', onEgresoItemChange);
});

let inventoryData = [];
let allTransactions = [];
let filteredTransactions = [];
let bodegasList = [];
let transRendered = 0;
let transLoadedAll = false;
const TRANS_BATCH = 100;
const TRANS_INITIAL_LIMIT = 200;

function debounce(fn, ms) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

// ==================== BODEGAS ====================

async function loadBodegasList() {
    try {
        const db = Auth.getSupabaseClient();
        const { data, error } = await db.from('bodegas_list').select('id,name,code').order('name', { ascending: true });
        if (error) throw error;
        bodegasList = data || [];
    } catch (err) {
        console.error('Error al cargar bodegas:', err);
        bodegasList = [];
    }
}

function getBodegasNames() {
    const fromList = bodegasList.map(b => b.name);
    const fromInventory = inventoryData.map(i => i.bodega).filter(Boolean);
    return [...new Set([...fromList, ...fromInventory])].sort();
}

function populateBodegas() {
    const names = getBodegasNames();
    const selects = ['bodegaFilter', 'transBodegaFilter', 'itemBodega', 'ingresoBodega', 'egresoBodega'];

    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const current = el.value;
        el.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = (id === 'bodegaFilter' || id === 'transBodegaFilter') ? 'Todas las bodegas' : 'Seleccionar...';
        el.appendChild(opt);
        names.forEach(b => {
            const o = document.createElement('option');
            o.value = b;
            o.textContent = b;
            el.appendChild(o);
        });
        el.value = current;
    });

    renderBodegasList();
}

function renderBodegasList() {
    const tbody = document.getElementById('bodegasTableBody');
    if (!tbody) return;

    if (bodegasList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center">No hay bodegas registradas</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();
    bodegasList.forEach(b => {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        td1.innerHTML = '<strong>' + b.name + '</strong>';
        const td2 = document.createElement('td');
        td2.textContent = b.code || '-';
        tr.appendChild(td1);
        tr.appendChild(td2);
        fragment.appendChild(tr);
    });
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

async function handleNewBodega(e) {
    e.preventDefault();
    if (!Auth.isAdmin()) return alert('Solo administradores pueden realizar esta accion');

    const name = document.getElementById('bodegaName').value.trim();
    const code = document.getElementById('bodegaCode').value.trim();

    if (!name) return alert('El nombre de la bodega es obligatorio');

    try {
        const db = Auth.getSupabaseClient();
        const { error } = await db.from('bodegas_list').insert([{ name, code: code || null }]);
        if (error) {
            if (error.code === '23505') return alert('Ya existe una bodega con ese nombre');
            throw error;
        }

        alert('Bodega agregada correctamente');
        e.target.reset();
        await loadBodegasList();
        populateBodegas();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ==================== ITEMS ====================

function filterItemsByBodega(selectId, bodegaSelectId) {
    const bodega = document.getElementById(bodegaSelectId).value;
    const select = document.getElementById(selectId);
    if (!select) return;

    const items = bodega
        ? inventoryData.filter(i => i.bodega === bodega)
        : inventoryData;

    const fragment = document.createDocumentFragment();

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = items.length > 0
        ? 'Seleccione (' + items.length + ' items)...'
        : 'No hay items en esta bodega';
    fragment.appendChild(defaultOpt);

    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = '[' + item.code + '] ' + item.description + ' (' + (item.current_stock || 0) + ' ' + (item.unit || 'und') + ')';
        fragment.appendChild(opt);
    });

    select.innerHTML = '';
    select.appendChild(fragment);
}

function onIngresoItemChange() {
    const itemId = document.getElementById('ingresoItem').value;
    const item = inventoryData.find(i => i.id == itemId);
    const info = document.getElementById('ingresoItemInfo');

    if (item) {
        info.textContent = item.description + (item.specifications ? ' | ' + item.specifications.substring(0, 50) : '') + ' | Stock: ' + item.current_stock + ' ' + (item.unit || 'UND') + ' | Bodega: ' + (item.bodega || '-');
        const bodegaSelect = document.getElementById('ingresoBodega');
        if (!bodegaSelect.value && item.bodega) {
            bodegaSelect.value = item.bodega;
        }
    } else {
        info.textContent = '';
    }
}

function onEgresoItemChange() {
    const itemId = document.getElementById('egresoItem').value;
    const item = inventoryData.find(i => i.id == itemId);
    const infoEl = document.getElementById('egresoItemInfo');
    const stockEl = document.getElementById('egresoStockInfo');

    if (item) {
        const stock = parseFloat(item.current_stock) || 0;
        const min = parseFloat(item.min_stock) || 0;
        const statusText = stock <= 0 ? 'SIN STOCK' : stock <= min ? 'STOCK BAJO' : 'OK';

        infoEl.textContent = (item.specifications ? item.specifications.substring(0, 40) + ' | ' : '') + 'Bodega: ' + (item.bodega || '-') + ' | Ubicacion: ' + (item.location || '-');
        stockEl.textContent = 'Stock: ' + stock + ' ' + (item.unit || 'UND') + ' ' + statusText;

        const bodegaSelect = document.getElementById('egresoBodega');
        if (!bodegaSelect.value && item.bodega) {
            bodegaSelect.value = item.bodega;
        }
    } else {
        infoEl.textContent = '';
        stockEl.textContent = '';
    }
}

// ==================== INVENTARIO ====================

async function loadInventory() {
    try {
        const db = Auth.getSupabaseClient();
        const { data, error } = await db
            .from('bodegas_inventory')
            .select('*')
            .order('description', { ascending: true });

        if (error) throw error;
        inventoryData = data || [];
        renderInventory(inventoryData);
    } catch (err) {
        console.error('Error al cargar inventario:', err);
    }
}

function renderInventory(items) {
    const tbody = document.getElementById('inventoryTableBody');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No se encontraron articulos</td></tr>';
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const stock = parseFloat(item.current_stock) || 0;
        const min = parseFloat(item.min_stock) || 0;
        const statusText = stock <= 0 ? 'Sin Stock' : stock <= min ? 'Stock Bajo' : 'Normal';
        const statusClass = stock <= 0 ? 'bg-danger' : stock <= min ? 'bg-warning text-dark' : 'bg-success';
        const specShort = (item.specifications || '').length > 30 ? item.specifications.substring(0, 30) + '...' : (item.specifications || '-');

        const tr = document.createElement('tr');
        tr.innerHTML = '<td><code>' + item.code + '</code></td>' +
            '<td><strong>' + item.description + '</strong></td>' +
            '<td class="hide-mobile"><small>' + specShort + '</small></td>' +
            '<td><small>' + (item.bodega || '-') + '</small></td>' +
            '<td class="hide-mobile">' + item.unit + '</td>' +
            '<td class="text-center hide-mobile">' + (parseFloat(item.initial_stock) || 0) + '</td>' +
            '<td class="text-center"><strong>' + stock + '</strong></td>' +
            '<td class="text-center hide-mobile">' + min + '</td>' +
            '<td class="hide-mobile"><small>' + (item.location || '-') + '</small></td>' +
            '<td class="text-center"><span class="badge ' + statusClass + '">' + statusText + '</span></td>';
        fragment.appendChild(tr);
    });

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

function filterInventory() {
    const search = document.getElementById('inventorySearch').value.toLowerCase();
    const bodega = document.getElementById('bodegaFilter').value;

    const filtered = inventoryData.filter(item => {
        const matchesSearch = item.code.toLowerCase().includes(search) ||
                              item.description.toLowerCase().includes(search) ||
                              (item.specifications || '').toLowerCase().includes(search);
        const matchesBodega = bodega === "" || item.bodega === bodega;
        return matchesSearch && matchesBodega;
    });

    renderInventory(filtered);
}

// ==================== MOVIMIENTOS ====================

async function loadTransactions() {
    try {
        const db = Auth.getSupabaseClient();
        const { data, error } = await db
            .from('bodegas_transactions')
            .select('id,date,time,type,quantity,bodega,received_by,dispatched_by,voucher_code,location,notes,created_by_name,created_at,bodegas_inventory(code,description,bodega,unit)')
            .order('created_at', { ascending: false })
            .limit(TRANS_INITIAL_LIMIT);

        if (error) throw error;
        allTransactions = (data || []).map(preFormatTransaction);
        transLoadedAll = (data || []).length < TRANS_INITIAL_LIMIT;
        transRendered = 0;
        filterTransactions();
    } catch (err) {
        console.error('Error al cargar movimientos:', err);
    }
}

function preFormatTransaction(t) {
    const timeStr = t.time ? t.time.substring(0, 5) : '';
    const dateStr = t.date ? t.date.substring(0, 10) : '';
    t._dateStr = dateStr.split('-').reverse().join('/');
    t._timeStr = timeStr;
    return t;
}

async function loadMoreTransactions() {
    if (transLoadedAll) {
        renderTransactionsBatch();
        return;
    }

    const lastDate = allTransactions.length > 0 ? allTransactions[allTransactions.length - 1].created_at : null;
    if (!lastDate) {
        renderTransactionsBatch();
        return;
    }

    try {
        const db = Auth.getSupabaseClient();
        const { data, error } = await db
            .from('bodegas_transactions')
            .select('id,date,time,type,quantity,bodega,received_by,dispatched_by,voucher_code,location,notes,created_by_name,created_at,bodegas_inventory(code,description,bodega,unit)')
            .lt('created_at', lastDate)
            .order('created_at', { ascending: false })
            .limit(TRANS_BATCH);

        if (error) throw error;

        const newTrans = (data || []).map(preFormatTransaction);
        allTransactions = allTransactions.concat(newTrans);
        transLoadedAll = newTrans.length < TRANS_BATCH;

        // Re-apply filters
        filterTransactions();
    } catch (err) {
        console.error('Error cargando mas movimientos:', err);
        renderTransactionsBatch();
    }
}

function filterTransactions() {
    const type = document.getElementById('typeFilter').value;
    const date = document.getElementById('dateFilter').value;
    const bodega = document.getElementById('transBodegaFilter').value;

    filteredTransactions = allTransactions.filter(t => {
        const matchesType = type === "" || t.type === type;
        const matchesDate = date === "" || (t.date && t.date.startsWith(date));
        const matchesBodega = bodega === "" || t.bodega === bodega || t.bodegas_inventory?.bodega === bodega;
        return matchesType && matchesDate && matchesBodega;
    });

    transRendered = 0;
    renderTransactionsBatch();
}

function renderTransactionsBatch() {
    const tbody = document.getElementById('transactionsTableBody');
    const end = Math.min(transRendered + TRANS_BATCH, filteredTransactions.length);
    const batch = filteredTransactions.slice(transRendered, end);

    const fragment = document.createDocumentFragment();

    batch.forEach(t => {
        const typeBadge = t.type === 'IN' ? '\u2191 INGRESO' : '\u2193 EGRESO';
        const typeClass = t.type === 'IN' ? 'text-success' : 'text-danger';

        const tr = document.createElement('tr');
        tr.innerHTML = '<td>' + t._dateStr + '</td>' +
            '<td class="hide-mobile">' + (t._timeStr || '-') + '</td>' +
            '<td><div class="small text-secondary">' + (t.bodegas_inventory?.code || '-') + '</div><div>' + (t.bodegas_inventory?.description || '-') + '</div></td>' +
            '<td><small>' + (t.bodega || t.bodegas_inventory?.bodega || '-') + '</small></td>' +
            '<td class="' + typeClass + '">' + typeBadge + '</td>' +
            '<td class="text-center"><strong>' + t.quantity + '</strong></td>' +
            '<td class="hide-mobile"><small>' + (t.received_by || '-') + '</small></td>' +
            '<td class="hide-mobile"><small>' + (t.dispatched_by || '-') + '</small></td>' +
            '<td class="hide-mobile"><small>' + (t.voucher_code || '-') + '</small></td>' +
            '<td class="hide-mobile"><small>' + (t.location || '-') + '</small></td>' +
            '<td class="hide-mobile"><small>' + (t.notes || '-') + '</small></td>';
        fragment.appendChild(tr);
    });

    if (transRendered === 0) {
        tbody.innerHTML = '';
    }
    tbody.appendChild(fragment);
    transRendered = end;

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const transCount = document.getElementById('transCount');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = transRendered < filteredTransactions.length ? 'block' : 'none';
    }
    if (transCount) {
        transCount.textContent = 'Mostrando ' + transRendered + ' de ' + filteredTransactions.length + ' movimientos';
    }
}

// ==================== GESTION ====================

async function handleNewItem(e) {
    e.preventDefault();
    if (!Auth.isAdmin()) return alert('Solo administradores pueden realizar esta accion');

    const code = document.getElementById('itemCode').value.trim();
    const bodega = document.getElementById('itemBodega').value;

    if (!bodega) return alert('Seleccione una bodega');

    const newItem = {
        code: code,
        description: document.getElementById('itemDescription').value.trim(),
        specifications: document.getElementById('itemSpecifications').value.trim(),
        bodega: bodega,
        unit: document.getElementById('itemUnit').value.trim() || 'UND',
        min_stock: parseFloat(document.getElementById('itemMinStock').value) || 0,
        location: document.getElementById('itemLocation').value.trim(),
        excel_unique_id: code + '-' + bodega,
        initial_stock: 0,
        current_stock: 0
    };

    try {
        const db = Auth.getSupabaseClient();
        const { error } = await db.from('bodegas_inventory').insert([newItem]);
        if (error) throw error;

        alert('Articulo registrado con exito en ' + bodega);
        e.target.reset();
        await loadInventory();
        populateBodegas();
        filterItemsByBodega('ingresoItem', 'ingresoBodega');
        filterItemsByBodega('egresoItem', 'egresoBodega');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function handleNewIngreso(e) {
    e.preventDefault();
    if (!Auth.isAdmin()) return alert('Solo administradores pueden realizar esta accion');

    const itemId = document.getElementById('ingresoItem').value;
    const qty = parseFloat(document.getElementById('ingresoQty').value);
    const bodega = document.getElementById('ingresoBodega').value;
    if (!itemId || !qty) return alert('Complete los campos requeridos');
    if (!bodega) return alert('Seleccione la bodega');

    const session = Auth.getSession();

    try {
        const db = Auth.getSupabaseClient();
        const { error } = await db.from('bodegas_transactions').insert([{
            item_id: itemId,
            type: 'IN',
            quantity: qty,
            bodega: bodega,
            received_by: document.getElementById('ingresoReceivedBy').value.trim(),
            dispatched_by: document.getElementById('ingresoDispatchedBy').value.trim(),
            voucher_code: document.getElementById('ingresoVoucher').value.trim(),
            location: document.getElementById('ingresoLocation').value.trim(),
            notes: document.getElementById('ingresoReason').value.trim(),
            created_by_name: session.username
        }]);

        if (error) throw error;

        alert('Ingreso registrado correctamente en ' + bodega);
        e.target.reset();
        document.getElementById('ingresoItemInfo').textContent = '';
        await Promise.all([loadInventory(), loadTransactions()]);
        filterItemsByBodega('ingresoItem', 'ingresoBodega');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function handleNewEgreso(e) {
    e.preventDefault();
    if (!Auth.isAdmin()) return alert('Solo administradores pueden realizar esta accion');

    const itemId = document.getElementById('egresoItem').value;
    const qty = parseFloat(document.getElementById('egresoQty').value);
    const bodega = document.getElementById('egresoBodega').value;
    if (!itemId || !qty) return alert('Complete los campos requeridos');
    if (!bodega) return alert('Seleccione la bodega');

    const item = inventoryData.find(i => i.id == itemId);
    if (item) {
        const stock = parseFloat(item.current_stock) || 0;
        if (stock < qty) {
            if (!confirm('Stock insuficiente en ' + (item.bodega || 'bodega') + ' (' + stock + ' ' + (item.unit || 'UND') + '). Desea continuar de todos modos?')) return;
        }
    }

    const session = Auth.getSession();

    try {
        const db = Auth.getSupabaseClient();
        const { error } = await db.from('bodegas_transactions').insert([{
            item_id: itemId,
            type: 'OUT',
            quantity: qty,
            bodega: bodega,
            dispatched_by: document.getElementById('egresoDispatchedBy').value.trim(),
            location: document.getElementById('egresoLocation').value.trim(),
            notes: document.getElementById('egresoReason').value.trim(),
            created_by_name: document.getElementById('egresoResponsible').value.trim() || session.username
        }]);

        if (error) throw error;

        alert('Egreso registrado correctamente de ' + bodega);
        e.target.reset();
        document.getElementById('egresoItemInfo').textContent = '';
        document.getElementById('egresoStockInfo').textContent = '';
        await Promise.all([loadInventory(), loadTransactions()]);
        filterItemsByBodega('egresoItem', 'egresoBodega');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ==================== EXPORTAR ====================

function exportToExcel() {
    if (filteredTransactions.length === 0) return alert('No hay datos para exportar');

    const dataToExport = filteredTransactions.map(t => ({
        Fecha: t._dateStr || '',
        Hora: t._timeStr || '',
        Codigo: t.bodegas_inventory?.code || '',
        Descripcion: t.bodegas_inventory?.description || '',
        Bodega: t.bodega || '',
        Tipo: t.type === 'IN' ? 'INGRESO' : 'EGRESO',
        Cantidad: t.quantity,
        Recibido_por: t.received_by || '',
        Despachado_por: t.dispatched_by || '',
        Vale: t.voucher_code || '',
        Ubicacion: t.location || '',
        Notas: t.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, 'Reporte_Bodegas_' + new Date().toISOString().split('T')[0] + '.xlsx');
}

function exportInventory() {
    if (inventoryData.length === 0) return alert('No hay datos para exportar');

    const dataToExport = inventoryData.map(item => ({
        Codigo: item.code,
        COD_UNICO: item.excel_unique_id || '',
        Descripcion: item.description,
        Especificaciones: item.specifications || '',
        Bodega: item.bodega || '',
        Unidad: item.unit,
        Stock_Inicial: item.initial_stock || 0,
        Stock_Actual: item.current_stock || 0,
        Stock_Min: item.min_stock || 0,
        Ubicacion: item.location || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, 'Inventario_Bodegas_' + new Date().toISOString().split('T')[0] + '.xlsx');
}