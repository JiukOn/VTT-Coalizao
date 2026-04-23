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

# PREMIUM LEXICON
lexicon = {
    # Typos / Grammar
    "beserk": "berserk",
    "atwardoar": "stun",
    "atordoar": "stun",
    "atordoado": "stunned",
    "habilities": "abilities",
    "equipament": "equipment",
    "modifications": "modifications", # Just in case
    "modification": "modification",
    
    # Elements & Sizes
    "fogo": "fire",
    "agua": "water",
    "gelo": "ice",
    "relampago": "lightning",
    "raio": "lightning",
    "madeira": "wood",
    "terra": "earth",
    "pedra": "stone",
    "sombra": "shadow",
    "luz": "light",
    "ar": "air",
    "vazio": "void",
    "tempo": "time",
    "caos": "chaos",
    "ordem": "order",
    "desordem": "disorder",
    "neutral": "neutral",
    
    "minusculo": "tiny",
    "pequeno": "small",
    "medio": "medium",
    "grande": "large",
    "colossal": "colossal",
    "mundial": "world",
    
    # Skills / Actions
    "carga": "charge",
    "esmagamento": "crush",
    "enraizar": "root",
    "florescer": "bloom",
    "furtividade": "stealth",
    "furto": "pickpocket",
    "liderar": "leadership",
    "maos_pesadas": "heavy_hands",
    "voo_sombrio": "shadow_flight",
    "atravessar": "traverse",
    "perceber": "perceive",
    "sentir": "sense",
    "bumbum_durinho": "iron_glutes", # RPG Flavor as discussed
    
    # Schema Keys (Values that might be used as IDs)
    "specie": "species",
    "especie": "species",
    "habilities_id": "abilities",
    "equipament_id": "equipment",
    "inventory_id": "inventory",
    "location_id": "location",
    "personality_id": "personality",
    "aura_id": "aura",
    "item_drops": "drops",
    
    # Combined Fixes
    "dobra_de_water": "water_bending",
    "dobra_de_agua": "water_bending",
    "flames_roxas": "purple_flames",
    "chamas_roxas": "purple_flames",
    "purple_fire_flames": "purple_flames",
}

# Add automatic "Element Resistance" pattern fixes
elements = ["fire", "water", "ice", "lightning", "wood", "earth", "stone", "shadow", "light", "air", "void", "time"]
for e in elements:
    lexicon[f"resistencia_elemental_{e}"] = f"{e}_resistance"
    lexicon[f"resistance_elemental_{e}"] = f"{e}_resistance"

# SCHEMA KEY MAPPING
key_map = {
    "habilities_id": "abilities",
    "equipament_id": "equipment",
    "inventory_id": "inventory",
    "item_drops": "drops",
    "specie1_id": "species1",
    "specie2_id": "species2",
    "class_id": "classId",
    "aura_id": "auraId",
    "personality_id": "personalityId",
    "location_id": "locationId",
    "tendencies_id": "tendencies",
    "core_size": "coreSize",
    "stats_value": "attributes",
    "stats_multiplier": "multipliers"
}

def premium_translate(val):
    if isinstance(val, str):
        slug = slugify(val)
        # Try direct match
        if slug in lexicon: return lexicon[slug]
        # Try partial match/replace for elements in complex strings
        for pt_el, en_el in lexicon.items():
            if pt_el in slug:
                slug = slug.replace(pt_el, en_el)
        return lexicon.get(slug, slug)
    return val

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        def transform(obj):
            if isinstance(obj, dict):
                new_obj = {}
                for k, v in obj.items():
                    nk = key_map.get(k, k)
                    # Values cleanup for specific fields
                    if nk in ['id', 'classId', 'species1', 'species2', 'auraId', 'personalityId', 'locationId', 'element', 'size', 'active', 'passive', 'legacy', 'myth', 'unique', 'lineage', 'evolution_of']:
                        nv = premium_translate(v)
                    elif isinstance(v, (dict, list)):
                        nv = transform(v)
                    else:
                        nv = v
                    new_obj[nk] = nv
                return new_obj
            elif isinstance(obj, list):
                return [transform(i) for i in obj]
            return obj

        refined_data = transform(data)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(refined_data, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"Error refining {file_path}: {e}")

# 1. RENAME FILES ON DISK FIRST
# (To prevent references pointing to non-existent renamed files later)
def rename_files():
    target_dirs = [
        'database/infodata/species', 'database/infodata/classes',
        'database/infodata/auras', 'database/infodata/personalities',
        'database/infodata/tendencies', 'database/infodata/locations',
        'database/infodata/items', 'database/infodata/skills'
    ]
    for d in target_dirs:
        if not os.path.exists(d): continue
        for root, dirs, files in os.walk(d):
            for f in files:
                if f.endswith('.json') and f != 'index.js':
                    old_id = f.replace('.json', '')
                    new_id = premium_translate(old_id)
                    if old_id != new_id:
                        old_path = os.path.join(root, f)
                        new_path = os.path.join(root, f"{new_id}.json")
                        if os.path.exists(new_path): # Duplicate cleanup
                            os.remove(old_path)
                        else:
                            os.rename(old_path, new_path)

# 2. APPLY TO ALL ENTITIES
def refine_all():
    for root, dirs, files in os.walk('database/infodata'):
        if 'Template' in root: continue
        for f in files:
            if f.endswith('.json'):
                process_file(os.path.join(root, f))

print("Starting Premium Refinement...")
rename_files()
refine_all()
print("Premium Refinement Complete.")
