import pandas as pd
from supabase import create_client, Client
import os
import sys

# --- CONFIGURACIÓN ---
SUPABASE_URL = "https://dzmhhlsttqygjvfabdxx.supabase.co"
SUPABASE_KEY = "sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK" 

# Ruta del archivo Excel
EXCEL_PATH = r"BODEGAS\1. Control_Bodegas_V0.xlsm"

def migrate():
    print("🚀 Iniciando migración de datos con mapeo específico...")
    
    # 1. Inicializar Supabase
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"❌ Error al conectar con Supabase: {e}")
        return

    # 2. Leer Excel - Hoja 'Inventario'
    try:
        # skiprows=4 porque la cabecera real está en la fila 5 (índice 4 de pandas)
        # Pero según el head, los datos empiezan en el índice 5 de la lectura original (fila 6 del excel)
        df = pd.read_excel(EXCEL_PATH, sheet_name='Inventario', skiprows=4)
        print(f"✅ Hoja 'Inventario' leída. Filas totales: {len(df)}")
    except Exception as e:
        print(f"❌ Error al leer la hoja 'Inventario': {e}")
        return

    # 3. Mapeo Basado en Análisis (Unnamed columns si no se detectan nombres)
    # Columnas según análisis previo:
    # B (Código) -> Unnamed: 1
    # D (Nombre/Descripción) -> Unnamed: 3
    # L (Bodega/Categoría) -> Unnamed: 11
    # H (Unidad) -> Unnamed: 7
    # K (Stock) -> Unnamed: 10
    
    inventory_items = []
    
    for index, row in df.iterrows():
        # Extraer valores usando índices o nombres si existen
        # El Código de material está en la columna B (segunda columna)
        raw_code = row.iloc[1] 
        raw_desc = row.iloc[3]
        raw_unit = row.iloc[7]
        raw_stock = row.iloc[10]
        raw_cat = row.iloc[11]

        # Validar que sea una fila de datos (el código debe ser un número o texto no nulo)
        if pd.isna(raw_code) or str(raw_code).strip() == "" or str(raw_code).lower() == "código de material":
            continue
            
        try:
            item = {
                "code": str(raw_code).split('.')[0], # Limpiar decimales si vienen del excel
                "description": str(raw_desc).strip(),
                "category": str(raw_cat).strip() if not pd.isna(raw_cat) else "General",
                "unit": str(raw_unit).strip() if not pd.isna(raw_unit) else "UND",
                "current_stock": float(raw_stock) if not pd.isna(raw_stock) else 0.0,
                "min_stock": 0.0 # Por defecto 0 ya que no se vió clara en el head
            }
            inventory_items.append(item)
        except Exception as e:
            print(f"⚠️ Saltando fila {index+5} por error de formato: {e}")

    print(f"📦 Preparados {len(inventory_items)} artículos para subir.")

    # 4. Subir a Supabase en bloques de 100 para evitar límites
    if inventory_items:
        batch_size = 100
        success_count = 0
        
        for i in range(0, len(inventory_items), batch_size):
            batch = inventory_items[i:i + batch_size]
            try:
                supabase.table("bodegas_inventory").upsert(batch, on_conflict="code").execute()
                success_count += len(batch)
                print(f"⏳ Sincronizados {success_count}/{len(inventory_items)}...")
            except Exception as e:
                print(f"❌ Error en lote {i//batch_size + 1}: {e}")

        print(f"\n🎉 ¡Migración finalizada! Total exitoso: {success_count} artículos.")
    else:
        print("❓ No se encontraron artículos válidos para migrar.")

if __name__ == "__main__":
    migrate()
