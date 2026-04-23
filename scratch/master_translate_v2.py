import json
import os

with open('scratch/master_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

# Hardcoded split rules for species
species_splits = {
    "humano_demonio": ("human", "demon"),
    "humano_gran": ("human", "gran"),
    "humano_monstro": ("human", "monster")
}

def translate_value(val):
    if isinstance(val, str) and val in mapping:
        return mapping[val]
    if isinstance(val, dict):
        return {k: translate_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [translate_value(i) for i in val]
    return val

def process_file(file_path):
    # print(f"Processing {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        ref_fields = [
            'class_id', 'specie1_id', 'specie2_id', 'aura_id', 'personality_id',
            'location_id', 'modification_id', 'equipament_id', 'habilities_id',
            'inventory_id', 'item_drops', 'tendencies_id', 'legacyAbility_id',
            'evolved_class', 'item'
        ]

        def translate_recursive(obj):
            if isinstance(obj, dict):
                new_obj = {}
                for k, v in obj.items():
                    # Handle Species Split logic
                    if k == 'specie1_id' and v in species_splits:
                        s1, s2 = species_splits[v]
                        new_obj['specie1_id'] = s1
                        if not obj.get('specie2_id'):
                             new_obj['specie2_id'] = s2
                        else:
                             # If specie2_id existed, we might have a conflict, but usually s2 was part of the compound
                             new_obj['specie2_id'] = obj['specie2_id']
                    
                    elif k.isdigit() and isinstance(v, str):
                        new_obj[k] = mapping.get(v, v)
                    elif k in ref_fields:
                        new_obj[k] = translate_value(v)
                    else:
                        new_obj[k] = translate_recursive(v)
                return new_obj
            elif isinstance(obj, list):
                return [translate_recursive(i) for i in obj]
            return obj

        new_data = translate_recursive(data)
        
        if 'id' in new_data and new_data['id'] in mapping:
             new_data['id'] = mapping[new_data['id']]

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

print("Refined translation and species splitting complete.")
