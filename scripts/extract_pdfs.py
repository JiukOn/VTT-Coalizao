import os
from pypdf import PdfReader
import glob

# Path to PDFs
pdf_dir = r"d:\Repositorios\Projeto VTP\Reference\Planilhas"
pdf_files = glob.glob(os.path.join(pdf_dir, "*.pdf"))

for pdf_file in pdf_files:
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    out_file = pdf_file + ".txt"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(text)
    
    print(f"Extracted {pdf_file} to {out_file}")
