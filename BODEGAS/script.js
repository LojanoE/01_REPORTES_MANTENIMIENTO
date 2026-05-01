document.addEventListener('DOMContentLoaded', async () => {
    const session = Auth.initPage();
    if (!session) return;

    Auth.renderUserBar('userBar');

    if (session.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    await loadInventory();
    await loadTransactions();
    updateItemSelects();
    populateBodegas();

    document.getElementById('inventorySearch').addEventListener('input', filterInventory);
    document.getElementById('bodegaFilter').addEventListener('change', filterInventory);
    document.getElementById('typeFilter').addEventListener('change', filterTransactions);
    document.getElementById('dateFilter').addEventListener('change', filterTransactions);
    document.getElementById('transBodegaFilter').addEventListener('change', filterTransactions);
    document.getElementById('itemForm')?.addEventListener('submit', handleNewItem);
    document.getElementById('ingresoForm')?.addEventListener('submit', handleNewIngreso);
    document.getElementById('egresoForm')?.addEventListener('submit', handleNewEgreso);

    document.getElementById('ingresoItem')?.addEventListener('change', onIngresoItemChange);
    document.getElementById('egresoItem')?.addEventListener('change', onEgresoItemChange);
});

let inventoryData = [];
let transactionsData = [];

const BODEGAS = [
    'Bodega GDR 1 (MV)',
    'Bodega GDR 1 (M&OPTAC #2)',
    'Bodega GDR 1 (OMV)',
    'Bodega GDR 2 (LSM & QC)',
    'Bodega GDR 2 (C/QC&LSM)',
    'Bodega GDR 2 (OMV)',
    'Bodega GDR 3 (M)',
    'Bodega GDR 3 (PTAC #2)',
    'Bodega GDR 3 (MV)',
    'Bodega GDR 4 (Container PTAC #2)',
    'Bodega GDR 5 (M&OPTAC #2)',
    'Bodega GDR 5 (MV)',
    'Sala de Induccion de GDR 6',
    'Unidad de Monitoreo',
    'Unidad de Operacion, Mantenimiento y Vigilancia',
    'Unidad de Construccion, Control de Calidad & Laboratorio'
];

function populateBodegas() {
    const selects = ['bodegaFilter', 'transBodegaFilter', 'itemBodega', 'ingresoBodega', 'egresoBodega'];
    const combinedBodegas = [...new Set([...BODEGAS, ...inventoryData.map(i => i.bodega).filter(Boolean)])].sort();

    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = (id === 'bodegaFilter' || id === 'transBodegaFilter') ? 'Todas las bodegas' : 'Seleccionar...';
        el.appendChild(opt);
        combinedBodegas.forEach(b => {
            const o = document.createElement('option');
            o.value = b;
            o.textContent = b;
            el.appendChild(o);
        });
    });
}

function updateItemSelects() {
    const byBodega = {};
    inventoryData.forEach(item => {
        const key = item.bodega || 'Sin bodega';
        if (!byBodega[key]) byBodega[key] = [];
        byBodega[key].push(item);
    });

    const bodegaOrder = Object.keys(byBodega).sort();

    ['ingresoItem', 'egresoItem'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un articulo...</option>';

        bodegaOrder.forEach(bodega => {
            const group = document.createElement('optgroup');
            group.label = bodega;
            byBodega[bodega].forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = `[${item.code}] ${item.description} (${item.current_stock || 0} ${item.unit || 'und'})`;
                group.appendChild(opt);
            });
            select.appendChild(group);
        });
    });
}

function onIngresoItemChange() {
    const itemId = document.getElementById('ingresoItem').value;
    const item = inventoryData.find(i => i.id == itemId);
    const info = document.getElementById('ingresoItemInfo');

    if (item) {
        info.innerHTML = `<strong>${item.description}</strong> ${item.specifications ? '| ' + item.specifications.substring(0, 50) : ''} | Stock: ${item.current_stock} ${item.unit || 'UND'} | Bodega: ${item.bodega || '-'}`;
        if (item.bodega) {
            document.getElementById('ingresoBodega').value = item.bodega;
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
        let badge = '';
        if (stock <= 0) badge = '<span class="badge bg-danger">SIN STOCK</span>';
        else if (stock <= min) badge = '<span class="badge bg-warning text-dark">STOCK BAJO</span>';
        else badge = '<span class="badge bg-success">OK</span>';

        infoEl.innerHTML = `${item.specifications ? item.specifications.substring(0, 50) + ' | ' : ''}Bodega: ${item.bodega || '-'} | Ubicaci\u00f3n: ${item.location || '-'}`;
        stockEl.innerHTML = `Stock: <strong>${stock}</strong> ${item.unit || 'UND'} ${badge}`;

        if (item.bodega) {
            document.getElementById('egresoBodega').value = item.bodega;
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
        populateBodegas();
    } catch (err) {
        console.error('Error al cargar inventario:', err);
    }
}

function renderInventory(items) {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No se encontraron articulos</td></tr>';
        return;
    }

    items.forEach(item => {
        let statusBadge = '';
        const stock = parseFloat(item.current_stock) || 0;
        const min = parseFloat(item.min_stock) || 0;

        if (stock <= 0) {
            statusBadge = '<span class="badge bg-danger">Sin Stock</span>';
        } else if (stock <= min) {
            statusBadge = '<span class="badge bg-warning text-dark">Stock Bajo</span>';
        } else {
            statusBadge = '<span class="badge bg-success">Normal</span>';
        }

        const specShort = (item.specifications || '').length > 30
            ? item.specifications.substring(0, 30) + '...'
            : (item.specifications || '-');

        const row = `
            <tr>
                <td><code>${item.code}</code></td>
                <td><strong>${item.description}</strong></td>
                <td><small>${specShort}</small></td>
                <td><span class="badge bg-info text-dark">${item.bodega || '-'}</span></td>
                <td>${item.unit}</td>
                <td class="text-center">${parseFloat(item.initial_stock) || 0}</td>
                <td class="text-center"><strong>${stock}</strong></td>
                <td class="text-center text-secondary">${min}</td>
                <td><small>${item.location || '-'}</small></td>
                <td class="text-center">${statusBadge}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
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
            .select(`
                *,
                bodegas_inventory (code, description, bodega, unit)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        transactionsData = data || [];
        renderTransactions(transactionsData);
    } catch (err) {
        console.error('Error al cargar movimientos:', err);
    }
}

function renderTransactions(trans) {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = '';

    trans.forEach(t => {
        const typeBadge = t.type === 'IN' ?
            '<span class="text-success">&#8593; INGRESO</span>' :
            '<span class="text-danger">&#8595; EGRESO</span>';

        const timeStr = t.time ? ` ${t.time}` : '';
        const dateStr = t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString() : new Date(t.created_at).toLocaleDateString();

        const row = `
            <tr>
                <td>${dateStr}</td>
                <td>${timeStr || '-'}</td>
                <td>
                    <div class="small text-secondary">${t.bodegas_inventory?.code || '-'}</div>
                    <div>${t.bodegas_inventory?.description || '-'}</div>
                </td>
                <td><small>${t.bodega || t.bodegas_inventory?.bodega || '-'}</small></td>
                <td>${typeBadge}</td>
                <td class="text-center"><strong>${t.quantity}</strong></td>
                <td><small>${t.received_by || '-'}</small></td>
                <td><small>${t.dispatched_by || '-'}</small></td>
                <td><small>${t.voucher_code || '-'}</small></td>
                <td><small>${t.location || '-'}</small></td>
                <td><small>${t.notes || '-'}</small></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterTransactions() {
    const type = document.getElementById('typeFilter').value;
    const date = document.getElementById('dateFilter').value;
    const bodega = document.getElementById('transBodegaFilter').value;

    const filtered = transactionsData.filter(t => {
        const matchesType = type === "" || t.type === type;
        const matchesDate = date === "" || (t.date && t.date.startsWith(date));
        const matchesBodega = bodega === "" || t.bodega === bodega;
        return matchesType && matchesDate && matchesBodega;
    });

    renderTransactions(filtered);
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
        excel_unique_id: code + bodega,
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
        updateItemSelects();
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
        await loadInventory();
        await loadTransactions();
        updateItemSelects();
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
            if (!confirm(`Stock insuficiente en ${item.bodega || 'bodega'} (${stock} ${item.unit || 'UND'}). Desea continuar de todos modos?`)) return;
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
        await loadInventory();
        await loadTransactions();
        updateItemSelects();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ==================== EXPORTAR ====================

function exportToExcel() {
    if (transactionsData.length === 0) return alert('No hay datos para exportar');

    const dataToExport = transactionsData.map(t => ({
        Fecha: t.date || '',
        Hora: t.time || '',
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
    XLSX.writeFile(wb, `Reporte_Bodegas_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    XLSX.writeFile(wb, `Inventario_Bodegas_${new Date().toISOString().split('T')[0]}.xlsx`);
}