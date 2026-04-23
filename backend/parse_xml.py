import xml.etree.ElementTree as ET
import os

xml_path = r"xlsx_unzipped\xl\sharedStrings.xml"
try:
    if os.path.exists(xml_path):
        tree = ET.parse(xml_path)
        root = tree.getroot()
        # Namespace for XLSX
        ns = {'n': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        strings = [t.text for t in root.findall('.//n:t', ns)]
        print("First 100 strings:")
        for i, s in enumerate(strings[:100]):
            print(f"{i}: {s}")
    else:
        print("File not found")
except Exception as e:
    print(f"Error: {e}")
