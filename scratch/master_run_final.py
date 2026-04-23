import json
import os
import re

def slugify(text):
    if not text: return ""
    text = str(text).lower().strip()
    replacements = {'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ç': 'c', 'ñ': 'n'}
    for char, replacement in replacements.items(): text = text.replace(char, replacement)
    text = re.sub(r'[^a-z0-9_]', '_', text)
    text = re.sub(r'_+', '_', text)
    return text.strip('_')

with open('scratch/master_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

# Expanded mapping for messy/partially translated IDs
mapping.update({
    "meat_assada_de_tuctuc": "roasted_tuctuc_meat",
    "feather_de_tuctuc": "tuctuc_feather",
    "feather_de_undino": "undino_feather",
    "meat_de_undino": "undino_meat",
    "leather_de_wolf": "wolf_leather",
    "presas_de_wolf": "wolf_fangs",
    "leather_de_equiliz": "equiliz_leather",
    "leather_de_ganodonte": "ganodonte_leather",
    "trunk_de_ganodonte": "ganodonte_trunk",
    "ivory_de_ganodonte": "ganodonte_ivory",
    "leather_de_cornara": "cornara_leather",
    "horn_de_cornara": "cornara_horn",
    "resistencia_elemental_ice": "ice_resistance",
    "resistencia_elemental_fire": "fire_resistance"
})

def create_def(cat, pt_name, en_id):
    data = {"id": en_id, "name": {"pt-br": pt_name, "en-us": en_id.replace('_', ' ').title()}, "description": {"pt-br": "", "en-us": ""}, "isCustom": False}
    folder = f"database/infodata/{cat}"
    if not os.path.exists(folder): os.makedirs(folder)
    with open(os.path.join(folder, f"{en_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def master_run():
    # 1. Categories
    auras = ["caos", "desordem", "harmonia", "inspiracao", "opressor", "revelacao"]
    for a in auras: create_def("auras", a.capitalize(), mapping.get(slugify(a), slugify(a)))
    
    personalities = ["bondade", "cansado", "completamente_cruel", "confiavel", "consciencia", "criatura", "curioso", "descrente", "desencanto", "direto", "entusiasta", "forca_absoluta", "gentil", "heroismo", "humorista", "impeto", "inumano", "jubilo", "leal", "mascara_social", "nobre", "obediente", "orgulhoso", "religioso", "zelo"]
    for p in personalities: create_def("personalities", p.capitalize(), mapping.get(slugify(p), slugify(p)))
    
    tendencies = ["amaldicoar", "armas_de_fogo", "botanica", "calculo", "costura", "cozinha", "criacao_de_estrategias", "criacao_de_instrumentos", "defesa_pessoal", "espiritualidade", "feiticaria", "historia", "labia", "leitura", "linguagem_runica", "linguistica", "luta", "medicina", "mercantilismo", "modificacoes_de_arma", "muay_thai", "nerd", "parkour", "primeiros_socorros", "sistemas", "taticas_de_combate"]
    for t in tendencies: create_def("tendencies", t.capitalize(), mapping.get(slugify(t), slugify(t)))

    locations = ["cidade_dos_porcos", "desconhecido", "reserva_amortecida"]
    for l in locations: create_def("locations", l.capitalize(), mapping.get(slugify(l), slugify(l)))

    # 2. Database Translation
    species_splits = {"humano_demonio": ("human", "demon"), "humano_gran": ("human", "gran"), "humano_monstro": ("human", "monster")}
    ref_fields = ['class_id', 'specie1_id', 'specie2_id', 'aura_id', 'personality_id', 'location_id', 'modification_id', 'equipament_id', 'habilities_id', 'inventory_id', 'item_drops', 'tendencies_id', 'legacyAbility_id', 'evolved_class', 'item', 'active', 'passive', 'legacy', 'myth', 'unique', 'lineage', 'Head', 'Face', 'Chest', 'Right Hand', 'Legs', 'Feet', 'Left Hand', 'Hand Accessories', 'Neck', 'Back']

    def translate_val(val):
        if isinstance(val, str):
            slug = slugify(val)
            return mapping.get(slug, slug)
        return val

    def translate_recursive(obj):
        if isinstance(obj, dict):
            new_obj = {}
            for k, v in obj.items():
                if k == 'specie1_id' and v in species_splits:
                    s1, s2 = species_splits[v]; new_obj['specie1_id'] = s1; new_obj['specie2_id'] = obj.get('specie2_id', s2)
                elif k in ref_fields or k.isdigit():
                    if isinstance(v, str): new_obj[k] = translate_val(v)
                    elif isinstance(v, (dict, list)): new_obj[k] = translate_recursive(v)
                    else: new_obj[k] = v
                else: new_obj[k] = translate_recursive(v)
            return new_obj
        elif isinstance(obj, list): return [translate_recursive(i) for i in obj]
        return obj

    for root, dirs, files in os.walk('database/infodata'):
        if any(x in root for x in ['Template', 'items', 'skills', 'auras', 'personalities', 'tendencies', 'locations', 'species', 'classes']): continue
        for file in files:
            if file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f: data = json.load(f)
                    new_data = translate_recursive(data)
                    if 'id' in new_data: new_data['id'] = translate_val(new_data['id'])
                    with open(path, 'w', encoding='utf-8') as f: json.dump(new_data, f, indent=2, ensure_ascii=False)
                except: pass

if __name__ == "__main__":
    master_run()
    print("Master clean run complete.")
