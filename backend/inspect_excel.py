import pandas as pd
import sys

file_path = "Pointage_materiel_cpb_20260101_20260331_20260407134848984_.xlsx"
try:
    df = pd.read_excel(file_path)
    print("Columns:")
    print(df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head())
    print("\nInfo:")
    print(df.info())
except Exception as e:
    print(f"Error: {e}")
