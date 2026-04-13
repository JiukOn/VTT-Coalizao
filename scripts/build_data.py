import os
import json
import re

base_dir = r"d:\Repositorios\Projeto VTP"
ref_dir = os.path.join(base_dir, "Reference", "Doc")
out_dir = os.path.join(base_dir, "src", "data")
os.makedirs(out_dir, exist_ok=True)

# 1. Parse Monstros
def parse_monstros():
    path = os.path.join(ref_dir, "Monstros.txt")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    creatures = []
    # Lines look like: Areat -> É um crustáceo terrestre...
    for line in content.split("\n"):
        if "->" in line:
            parts = line.split("->", 1)
            name = parts[0].strip()
            desc = parts[1].strip()
            creatures.append({"id": name.lower().replace(" ", "_"), "name": name, "description": desc, "type": "Monstro"})
    
    with open(os.path.join(out_dir, "creatures.json"), "w", encoding="utf-8") as f:
        json.dump(creatures, f, indent=2, ensure_ascii=False)

# 2. Parse Habilidades
def parse_habs():
    path = os.path.join(ref_dir, "Habilidades.txt")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    habs = []
    current_category = "Geral"
    for line in content.split("\n"):
        line = line.strip()
        if not line: continue
        if line.endswith("/"):
            current_category = line[:-1]
            continue
        if "->" in line:
            parts = line.split("->", 1)
            name_part = parts[0].strip() # e.g. Acorde (Bardo)
            desc = parts[1].strip()
            
            # Extract class/req if in parentheses
            cls_match = re.search(r'\((.*?)\)', name_part)
            req_class = cls_match.group(1) if cls_match else "Geral"
            name = re.sub(r'\(.*?\)', '', name_part).strip()
            
            habs.append({
                "id": name.lower().replace(" ", "_"),
                "name": name,
                "category": current_category,
                "class": req_class,
                "description": desc
            })
    with open(os.path.join(out_dir, "abilities.json"), "w", encoding="utf-8") as f:
        json.dump(habs, f, indent=2, ensure_ascii=False)

# 3. Parse Items
def parse_items():
    path = os.path.join(ref_dir, "Itens.txt")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    items = []
    current_category = "Geral"
    for line in content.split("\n"):
        line = line.strip()
        if not line: continue
        if line.startswith("**") and line.endswith("**"):
            current_category = line.strip("*_ ")
            continue
        if "->" in line:
            parts = line.split("->", 1)
            name_part = parts[0].strip()
            desc = parts[1].strip()
            
            items.append({
                "id": name_part.lower().replace(" ", "_").replace("(", "").replace(")", ""),
                "name": name_part,
                "category": current_category,
                "description": desc
            })
    with open(os.path.join(out_dir, "items.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

# 4. Parse NPCs
def parse_npcs():
    path = os.path.join(ref_dir, "NPC.txt")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    npcs = []
    current_loc = "Desconhecido"
    for line in content.split("\n"):
        line = line.strip()
        if not line: continue
        if line.endswith(":"):
            current_loc = line[:-1].strip()
            continue
        if "-" in line:
            parts = line.split("-", 1)
            name = parts[0].strip()
            desc = parts[1].strip()
            npcs.append({
                "id": name.lower().replace(" ", "_").replace(",", ""),
                "name": name,
                "location": current_loc,
                "description": desc
            })
    with open(os.path.join(out_dir, "npcs.json"), "w", encoding="utf-8") as f:
        json.dump(npcs, f, indent=2, ensure_ascii=False)

parse_monstros()
parse_habs()
parse_items()
parse_npcs()
print("Base data JSONs created successfully.")
