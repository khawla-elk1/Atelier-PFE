import mysql.connector

try:
    conn = mysql.connector.connect(host='localhost', user='root', password='', database='atelier360_db', port=3306)
    cursor = conn.cursor()
    
    # Check if there is an engin in the db
    cursor.execute("SELECT id_engin, code_materiel, marque FROM engins LIMIT 1")
    row = cursor.fetchone()
    
    if row:
        valid_id = row[0]
        print(f"Using Engin ID {valid_id} ({row[1]} - {row[2]}) to fix orphaned records.")
        
        # Update interventions
        cursor.execute(f"UPDATE interventions SET engin_id = {valid_id} WHERE engin_id IS NULL OR engin_id NOT IN (SELECT id_engin FROM engins)")
        print(f"Fixed {cursor.rowcount} interventions.")
        
        # Update anomalies
        cursor.execute(f"UPDATE anomalies SET engin_id = {valid_id} WHERE engin_id IS NULL OR engin_id NOT IN (SELECT id_engin FROM engins)")
        print(f"Fixed {cursor.rowcount} anomalies.")
        
        conn.commit()
    else:
        print("No engins found in the DB. Cannot fix orphaned records.")
        
except Exception as e:
    print("Database error:", e)
