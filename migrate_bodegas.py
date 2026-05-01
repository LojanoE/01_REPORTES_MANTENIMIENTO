import openpyxl
from supabase import create_client, Client
from datetime import datetime, time as dt_time
import sys

SUPABASE_URL = "https://dzmhhlsttqygjvfabdxx.supabase.co"
SUPABASE_KEY = "sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK"
EXCEL_PATH = r"BODEGAS\1. Control_Bodegas_V0.xlsm"

BATCH_SIZE = 100

def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def clean(val):
    if val is None:
        return ""
    s = str(val).strip()
    if s in ("-", "nan", "None", "#VALUE!", "#REF!"):
        return ""
    return s

def clean_num(val):
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0

def parse_time(val):
    if val is None:
        return None
    if isinstance(val, dt_time):
        return val.isoformat()
    s = str(val).strip()
    if ":" in s:
        parts = s.split(":")
        try:
            return f"{int(parts[0]):02d}:{int(parts[1]):02d}:00"
        except (ValueError, IndexError):
            return None
    return None

def parse_date(val):
    if val is None:
        return datetime.now().isoformat()[:10]
    if isinstance(val, datetime):
        return val.isoformat()[:10]
    s = str(val).strip()
    if not s or s in ("-", "nan", "None", "#VALUE!", "#REF!"):
        return datetime.now().isoformat()[:10]
    # Intentar DD-MM-YY o DD-MM-YYYY
    for fmt in ("%d-%m-%Y", "%d-%m-%y", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.isoformat()[:10]
        except ValueError:
            continue
    # Fallback: intentar con split manual
    try:
        parts = s.replace("/", "-").split("-")
        if len(parts) == 3:
            if len(parts[2]) == 2:
                parts[2] = "20" + parts[2]
            day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
            dt = datetime(year, month, day)
            return dt.isoformat()[:10]
    except (ValueError, IndexError):
        pass
    # Ultimo recurso: usar los primeros 10 chars o fecha actual
    if len(s) >= 10:
        return s[:10]
    return datetime.now().isoformat()[:10]

def migrate():
    supabase = get_supabase()
    print("Iniciando migracion...")

    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

    # =========================================================================
    # 1. INVENTARIO
    # =========================================================================
    print("\nProcesando INVENTARIO...")
    ws_inv = wb['Inventario']
    # Headers en fila 6, datos desde fila 7
    # Col A(1)=N°, B(2)=Codigo, C(3)=COD_UNICO, D(4)=Nombre, E(5)=Especificaciones,
    # F(6)=Fecha caducidad, G(7)=Unidad, H(8)=Cantidad inicial, I(9)=Ingreso,
    # J(10)=Egreso, K(11)=Stock, L(12)=Ubic.original, M(13)=Ubic.almacen,
    # N(14)=BODEGA, O(15)=Ubic.actual, P(16)=Notas, Q(17)=Notas2

    items = []
    for row_idx in range(7, ws_inv.max_row + 1):
        cod_unico = clean(ws_inv.cell(row_idx, 3).value)
        if not cod_unico or cod_unico == "COD_UNICO":
            continue

        code = clean(ws_inv.cell(row_idx, 2).value)
        if code:
            code = code.split('.')[0]

        description = clean(ws_inv.cell(row_idx, 4).value)
        if not description:
            description = cod_unico

        specifications = clean(ws_inv.cell(row_idx, 5).value)
        unit_raw = clean(ws_inv.cell(row_idx, 7).value)
        unit = unit_raw if unit_raw else "UND"
        initial_stock = clean_num(ws_inv.cell(row_idx, 8).value)
        current_stock = clean_num(ws_inv.cell(row_idx, 11).value)
        bodega = clean(ws_inv.cell(row_idx, 14).value)
        location = clean(ws_inv.cell(row_idx, 15).value)
        notes = clean(ws_inv.cell(row_idx, 16).value) or clean(ws_inv.cell(row_idx, 17).value)

        items.append({
            "excel_unique_id": cod_unico,
            "code": code or cod_unico,
            "description": description,
            "specifications": specifications,
            "unit": unit,
            "initial_stock": initial_stock,
            "current_stock": current_stock,
            "min_stock": 0,
            "bodega": bodega,
            "location": location,
        })

    if items:
        print(f"  Subiendo {len(items)} items de inventario en lotes de {BATCH_SIZE}...")
        for i in range(0, len(items), BATCH_SIZE):
            batch = items[i:i + BATCH_SIZE]
            try:
                supabase.table("bodegas_inventory").upsert(batch, on_conflict="excel_unique_id").execute()
                print(f"  Lote {i // BATCH_SIZE + 1}: {len(batch)} items subidos")
            except Exception as e:
                print(f"  Error en lote {i // BATCH_SIZE + 1}: {e}")
                return

    # Mapeo excel_unique_id -> db_id
    res = supabase.table("bodegas_inventory").select("id, excel_unique_id").execute()
    uid_map = {item['excel_unique_id']: item['id'] for item in res.data}
    print(f"  Mapeo de IDs construido: {len(uid_map)} items")

    # =========================================================================
    # 2. INGRESOS
    # =========================================================================
    print("\nProcesando INGRESOS...")
    ws_in = wb['Ingresos']
    # Headers en fila 6, datos desde fila 7
    # Col B(2)=N°, C(3)=Fecha, D(4)=Hora, E(5)=Codigo, F(6)=BODEGA,
    # G(7)=COD_UNICO, H(8)=Nombre, I(9)=Especificaciones, J(10)=Unidad,
    # K(11)=Cantidad, R(18)=Codigo Vale, U(21)=Recibe conforme,
    # V(22)=Responsable ingreso, W(23)=Ubic.actual, X(24)=Notas

    transactions_in = []
    skipped_in = 0
    for row_idx in range(7, ws_in.max_row + 1):
        cod_unico = clean(ws_in.cell(row_idx, 7).value)
        if not cod_unico or cod_unico not in uid_map:
            skipped_in += 1
            continue

        qty = clean_num(ws_in.cell(row_idx, 11).value)
        if qty <= 0:
            continue

        fecha = parse_date(ws_in.cell(row_idx, 3).value)
        hora = parse_time(ws_in.cell(row_idx, 4).value)
        bodega = clean(ws_in.cell(row_idx, 6).value)
        specifications = clean(ws_in.cell(row_idx, 9).value)
        received_by = clean(ws_in.cell(row_idx, 21).value)
        dispatched_by = clean(ws_in.cell(row_idx, 22).value)
        voucher_code = clean(ws_in.cell(row_idx, 18).value)
        location = clean(ws_in.cell(row_idx, 23).value)
        notes = clean(ws_in.cell(row_idx, 24).value)

        transactions_in.append({
            "item_id": uid_map[cod_unico],
            "type": "IN",
            "quantity": qty,
            "date": fecha,
            "time": hora,
            "bodega": bodega,
            "specifications": specifications,
            "received_by": received_by,
            "dispatched_by": dispatched_by,
            "voucher_code": voucher_code,
            "location": location,
            "notes": notes,
            "created_by_name": dispatched_by or received_by or "Migracion",
        })

    print(f"  {len(transactions_in)} ingresos validos, {skipped_in} omitidos (sin COD_UNICO o sin mapeo)")

    # =========================================================================
    # 3. EGRESOS
    # =========================================================================
    print("\nProcesando EGRESOS...")
    ws_out = wb['Egresos']
    # Headers en fila 5, datos desde fila 6
    # Col A(1)=N°, B(2)=Fecha, C(3)=Hora, D(4)=Codigo, E(5)=BODEGA,
    # F(6)=COD_UNICO, G(7)=Nombre, H(8)=Especificaciones, I(9)=Unidad,
    # J(10)=Cantidad, K(11)=Responsable egreso, L(12)=Responsable despacho,
    # M(13)=Ubic.actual, N(14)=Notas

    transactions_out = []
    skipped_out = 0
    for row_idx in range(6, ws_out.max_row + 1):
        cod_unico = clean(ws_out.cell(row_idx, 6).value)
        if not cod_unico or cod_unico not in uid_map:
            skipped_out += 1
            continue

        qty = clean_num(ws_out.cell(row_idx, 10).value)
        if qty <= 0:
            continue

        fecha = parse_date(ws_out.cell(row_idx, 2).value)
        hora = parse_time(ws_out.cell(row_idx, 3).value)
        bodega = clean(ws_out.cell(row_idx, 5).value)
        specifications = clean(ws_out.cell(row_idx, 8).value)
        received_by = ""
        dispatched_by = clean(ws_out.cell(row_idx, 12).value)
        voucher_code = ""
        location = clean(ws_out.cell(row_idx, 13).value)
        notes = clean(ws_out.cell(row_idx, 14).value)
        responsible = clean(ws_out.cell(row_idx, 11).value)

        transactions_out.append({
            "item_id": uid_map[cod_unico],
            "type": "OUT",
            "quantity": qty,
            "date": fecha,
            "time": hora,
            "bodega": bodega,
            "specifications": specifications,
            "received_by": received_by,
            "dispatched_by": dispatched_by,
            "voucher_code": voucher_code,
            "location": location,
            "notes": notes,
            "created_by_name": responsible,
        })

    print(f"  {len(transactions_out)} egresos validos, {skipped_out} omitidos (sin COD_UNICO o sin mapeo)")

    # =========================================================================
    # 4. SUBIR TRANSACCIONES
    # =========================================================================
    all_trans = transactions_in + transactions_out
    if all_trans:
        print(f"\nSubiendo {len(all_trans)} transacciones en lotes de {BATCH_SIZE}...")
        total_ok = 0
        total_fail = 0
        for i in range(0, len(all_trans), BATCH_SIZE):
            batch = all_trans[i:i + BATCH_SIZE]
            try:
                supabase.table("bodegas_transactions").insert(batch).execute()
                total_ok += len(batch)
                print(f"  Lote {i // BATCH_SIZE + 1}: {len(batch)} transacciones subidas")
            except Exception as e:
                print(f"  Lote {i // BATCH_SIZE + 1} fallo, insertando una por una...")
                for t in batch:
                    try:
                        supabase.table("bodegas_transactions").insert([t]).execute()
                        total_ok += 1
                    except Exception as e2:
                        total_fail += 1
                        if total_fail <= 5:
                            print(f"    Fila omitida: {t.get('type')} {t.get('date')} item_id={t.get('item_id')} error={e2}")
        print(f"  Total OK: {total_ok}, Total omitidas: {total_fail}")

    print(f"\nMIGRACION FINALIZADA EXITOSAMENTE.")
    print(f"  Inventario: {len(items)} items")
    print(f"  Ingresos: {len(transactions_in)}")
    print(f"  Egresos: {len(transactions_out)}")
    print(f"  Total transacciones: {len(all_trans)}")

if __name__ == "__main__":
    migrate()