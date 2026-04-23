import pandas as pd

def clean_val(val):
    if pd.isna(val):
        return None
    if isinstance(val, str):
        val = val.strip().replace("'", "''")
        return f"'{val}'"
    return str(val)

print("Reading STOCK.xlsx...")
try:
    df = pd.read_excel('STOCK.xlsx', header=None)
    
    with open('insert_stock.sql', 'w', encoding='utf-8') as out:
        out.write("-- AUTO-GENERATED STOCK INSERTS\n")
        out.write("DELETE FROM pieces_rechange;\n\n")

        inserted = 0
        
        # Start iterating from row 3 (which corresponds to index 3 in Python) since rows 0,1,2 are headers
        for idx, row in df.iterrows():
            if idx < 3:
                continue
            
            designation = row[0]
            if pd.isna(designation) or str(designation).strip() == '':
                continue
                
            # Column mapping based on the text file structure:
            # 0: DESIGNATION, 1: ENTRE, 2: SORTIE, 3: STOCK INITIAL, 4: RETOUR, 5: STOCK FINAL, 6: EMPLACEMENT
            stock_final = row[5]
            emplacement = row[6]
            
            designation_sql = clean_val(designation)
            stock_sql = clean_val(stock_final) if not pd.isna(stock_final) else '0'
            emplacement_sql = clean_val(emplacement)
            
            sql = f"INSERT INTO pieces_rechange (designation, quantite_en_stock, emplacement) VALUES ({designation_sql}, {stock_sql}, {emplacement_sql});\n"
            out.write(sql)
            inserted += 1
            
    print(f"DONE - Generated {inserted} inserts in insert_stock.sql")
except Exception as e:
    print(f"Error: {e}")
