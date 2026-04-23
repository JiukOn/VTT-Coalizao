import json
import os
import re

def slugify(text):
    if not text: return ""
    text = text.lower()
    # Manual accent removal for PT-BR
    replacements = {
        'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u',
        'ç': 'c',
        'ñ': 'n'
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    text = re.sub(r'[^a-z0-9_]', '_', text)
    text = re.sub(r'_+', '_', text)
    return text.strip('_')

# Step 1: Fix mapping
with open('scratch/master_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

# Ensure all keys in mapping are correctly slugified
new_mapping = {}
for k, v in mapping.items():
    new_mapping[slugify(k)] = v
mapping = new_mapping

# Step 2: Load all references and add missing slugified entries
with open('scratch/all_references.json', 'r', encoding='utf-16') as f:
    refs = json.load(f)

for vals in refs.values():
    for v in vals:
        if v:
            slug = slugify(v)
            if slug not in mapping:
                # Heuristic translation
                mapping[slug] = slug # Fallback, can be manual refined if needed

# Refine mapping again with the corrected slugs
refinements = {
    "olfato_sanguinario": "bloodhound_sense",
    "protecao_fisica": "physical_protection",
    "resistencia_fisica": "physical_resistance",
    "elmo_de_ossos": "bone_helmet",
    "peitoral_de_ossos": "bone_chestplate",
    "couro_de_lobo": "wolf_leather",
    "couro_de_cornara": "cornara_leather",
    "chifre_de_cornara": "cornara_horn",
    "leather_de_cornara": "cornara_leather", # Fix for previous bad runs
    "horn_de_cornara": "cornara_horn"
}
mapping.update(refinements)

with open('scratch/master_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, indent=2, ensure_ascii=False)

print(f"Mapping fixed and updated. Total entries: {len(mapping)}")
