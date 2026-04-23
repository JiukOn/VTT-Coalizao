import json
import os

VALID_IDS = {} # cat -> set(ids)

# Folders to scan for definition files
def_folders = {
    "species": "species",
    "classes": "classes",
    "auras": "auras",
    "personalities": "personalities",
    "tendencies": "tendencies",
    "locations": "locations",
    "items": "items", # Items has subfolders
    "skills": "skills" # Skills has subfolders
}

def collect_ids(path):
    ids = set()
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.endswith('.json') and f != 'index.js':
                ids.add(f.replace('.json', ''))
    return ids

for cat, folder in def_folders.items():
    VALID_IDS[cat] = collect_ids(f"database/infodata/{folder}")

# Also collect combined items and skills for easier checking
ALL_ITEMS = VALID_IDS['items']
ALL_SKILLS = VALID_IDS['skills']
ALL_SPECIES = VALID_IDS['species']
ALL_CLASSES = VALID_IDS['classes']
ALL_AURAS = VALID_IDS['auras']
ALL_PERSONALITIES = VALID_IDS['personalities']
ALL_TENDENCIES = VALID_IDS['tendencies']
ALL_LOCATIONS = VALID_IDS['locations']

MISSING = []

def check_value(field, val, file_path):
    if not val: return
    
    # Mapping field names to categories
    checks = {
        'class_id': ALL_CLASSES,
        'specie1_id': ALL_SPECIES,
        'specie2_id': ALL_SPECIES,
        'aura_id': ALL_AURAS,
        'personality_id': ALL_PERSONALITIES,
        'location_id': ALL_LOCATIONS,
        'item': ALL_ITEMS,
        'item_id': ALL_ITEMS,
        'active': ALL_SKILLS,
        'passive': ALL_SKILLS,
        'legacy': ALL_SKILLS,
        'myth': ALL_SKILLS,
        'unique': ALL_SKILLS,
        'lineage': ALL_SKILLS,
    }
    
    if field in checks:
        if isinstance(val, str):
            if val and val not in checks[field]:
                MISSING.append(f"[{file_path}] Field {field} refers to missing ID '{val}'")
        elif isinstance(val, list):
            for v in val:
                if v and v not in checks[field]:
                    MISSING.append(f"[{file_path}] Field {field} refers to missing ID '{v}'")
        elif isinstance(val, dict):
            for k, v in val.items():
                if v and v not in checks[field]:
                    MISSING.append(f"[{file_path}] Field {field} refers to missing ID '{v}'")

def scan_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        def walk(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    check_value(k, v, file_path)
                    walk(v)
            elif isinstance(obj, list):
                for i in obj:
                    walk(i)
        
        walk(data)
    except:
        pass

# Scan entities
for root, dirs, files in os.walk('database/infodata'):
    if 'Template' in root: continue
    for f in files:
        if f.endswith('.json'):
            scan_file(os.path.join(root, f))

if not MISSING:
    print("CONSISTENCY CHECK: OK! All IDs resolved.")
else:
    print(f"CONSISTENCY CHECK: FAILED! Found {len(MISSING)} missing references.")
    for m in MISSING[:20]: # Show first 20
        print(m)
