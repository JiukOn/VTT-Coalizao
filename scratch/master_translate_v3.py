import json
import os
import re

with open('scratch/master_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

def slugify(text):
    if not text: return ""
    text = str(text).lower()
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

species_splits = {
    "humano_demonio": ("human", "demon"),
    "humano_gran": ("human", "gran"),
    "humano_monstro": ("human", "monster")
}

def translate_value(val):
    if isinstance(val, str):
        slug = slugify(val)
        if slug in mapping:
            return mapping[slug]
    if isinstance(val, dict):
        return {k: translate_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [translate_value(i) for i in val]
    return val

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        ref_fields = [
            'class_id', 'specie1_id', 'specie2_id', 'aura_id', 'personality_id',
            'location_id', 'modification_id', 'equipament_id', 'habilities_id',
            'inventory_id', 'item_drops', 'tendencies_id', 'legacyAbility_id',
            'evolved_class', 'item', 'active', 'passive', 'legacy', 'myth', 'unique', 'lineage'
        ]

        def translate_recursive(obj):
            if isinstance(obj, dict):
                new_obj = {}
                for k, v in obj.items():
                    if k == 'specie1_id' and v in species_splits:
                        s1, s2 = species_splits[v]
                        new_obj['specie1_id'] = s1
                        if not obj.get('specie2_id'):
                             new_obj['specie2_id'] = s2
                        else:
                             new_obj['specie2_id'] = obj['specie2_id']
                    elif k.isdigit() and isinstance(v, str):
                        new_obj[k] = translate_value(v)
                    elif k in ref_fields:
                        new_obj[k] = translate_value(v)
                    else:
                        new_obj[k] = translate_recursive(v)
                return new_obj
            elif isinstance(obj, list):
                return [translate_recursive(i) for i in obj]
            return obj

        new_data = translate_recursive(data)
        
        # Finally check main ID
        if 'id' in new_data:
             new_data['id'] = translate_value(new_data['id'])

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

target_dir = 'database/infodata'
for root, dirs, files in os.walk(target_dir):
    if 'Template' in root: continue
    for file in files:
        if file.endswith('.json'):
            process_file(os.path.join(root, file))

print("Final database translation complete.")
