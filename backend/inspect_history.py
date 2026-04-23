import openpyxl
import os

file_path = "Pointage_materiel_cpb_20260101_20260331_20260407134848984_.xlsx"
try:
    wb = openpyxl.load_workbook(file_path, data_only=True, read_only=True)
    sheet = wb.active
    # Let's find a machine that appears multiple times
    data = []
    for row in sheet.iter_rows(min_row=2, max_row=500, values_only=True):
        if row[1] and row[6]: # Code and Compteur Fin
            data.append({"date": row[0], "code": row[1], "h_fin": row[6], "total": row[7]})
    
    # Sort by code and date
    data.sort(key=lambda x: (str(x['code']), str(x['date'])))
    
    # Print first few machines history
    current_code = None
    for d in data[:50]:
        if d['code'] != current_code:
            print(f"\nMachine: {d['code']}")
            current_code = d['code']
        print(f"  Date: {d['date']} | H_Fin: {d['h_fin']} | Worked: {d['total']}")
except Exception as e:
    print(f"Error: {e}")
