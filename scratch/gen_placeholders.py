import json
import os
import re

def slugify(text):
    if not text: return ""
    text = str(text).lower().strip()
    replacements = {
        'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u',
        'ç': 'c', 'ñ': 'n'
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    text = re.sub(r'[^a-z0-9_]', '_', text)
    text = re.sub(r'_+', '_', text)
    return text.strip('_')

with open('scratch/master_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

# Materials found in references
materials = [
    "canino_congelante", "canino_flamejante", "carne_assada_de_tuctuc",
    "carne_assada_de_undino", "carne_de_undino", "chifre_de_cornara",
    "couro_de_cornara", "couro_de_equiliz", "couro_de_ganodonte", "couro_de_lobo",
    "garras_vulcanicas", "livro_h_chamas", "livro_h_congelar", "marfim_de_ganodonte",
    "nucleo_medio", "olho_do_rei_undino", "olhos_de_moriu", "osso_de_rei_undino",
    "pena_de_moriu", "pena_de_tuctuc", "pena_de_undino", "presas_de_lobo",
    "sangue_azul", "tromba_de_ganodonte", "canine_congelante", "blood_blue", "medium_core",
    "book_h_freeze", "leather_de_cornara", "horn_de_cornara", "leather_de_wolf", "presas_de_wolf",
    "leather_de_ganodonte", "trunk_de_ganodonte", "ivory_de_ganodonte", "leather_de_equiliz"
]

out_dir = "database/infodata/items/materials"
if not os.path.exists(out_dir): os.makedirs(out_dir)

for mat in materials:
    en_id = mapping.get(mat, mat)
    data = {"id": en_id, "name": {"pt-br": mat.replace('_', ' ').title(), "en-us": en_id.replace('_', ' ').title()}, "category": "materials", "type": "Material", "isCustom": False}
    with open(os.path.join(out_dir, f"{en_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Creature Skills found in missing references
creature_skills = ["carga", "esmagamento", "bite", "bloodhound_sense", "resistance_elemental_ice", "resistance_elemental_fire"]
out_skill_dir = "database/infodata/skills/active"
if not os.path.exists(out_skill_dir): os.makedirs(out_skill_dir)

for s in creature_skills:
    en_id = mapping.get(s, s)
    data = {"id": en_id, "name": {"pt-br": s.replace('_', ' ').title(), "en-us": en_id.replace('_', ' ').title()}, "category": "active", "source": "Creature", "isCustom": False}
    with open(os.path.join(out_skill_dir, f"{en_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

print("Materials and Creature Skills generated.")
