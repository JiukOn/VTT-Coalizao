import json
import os
import re

with open('scratch/master_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

def slugify(text):
    if not text: return ""
    text = text.lower()
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

def get_english_id(pt_name):
    slug = slugify(pt_name)
    if slug in mapping:
        return mapping[slug]
    return slug

def parse_itens(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    sections = content.split('**')
    items = []
    current_category = "general"
    category_map = {
        "Armas de Proximidade": "weapons",
        "Armas à Distância": "weapons",
        "Itens de Defesa": "shields",
        "Vestimentas": "vestments",
        "Projéteis": "projectiles",
        "Itens de Controle Mágico": "general",
        "Ferramentas": "general",
        "Consumíveis": "consumables",
        "Venenos": "consumables",
        "Itens Diversos": "general"
    }
    for section in sections:
        lines = section.strip().split('\n')
        if not lines: continue
        header = lines[0].strip('_')
        if header in category_map:
            current_category = category_map[header]
            continue
        for line in lines:
            if '->' not in line: continue
            parts = line.split('->')
            name_part = parts[0].strip()
            desc_part = parts[1].strip()
            match = re.search(r'^(.*?)\s*\((.*?)\)$', name_part)
            if match:
                name_pt = match.group(1).strip()
                type_pt = match.group(2).strip()
            else:
                name_pt = name_part
                type_pt = "Item"
            item_id = get_english_id(name_pt)
            price = 0
            price_match = re.search(r'\((\d+)\s*DP\)', desc_part)
            if price_match:
                price = int(price_match.group(1))
                desc_part = desc_part.replace(price_match.group(0), '').strip()
            stats = {}
            for stat in ['VIT', 'DEX', 'CRM', 'FRC', 'INT', 'RES', 'PRE', 'ENR']:
                stat_match = re.search(fr'([+-]\d+)\s*{stat}', desc_part, re.IGNORECASE)
                if stat_match:
                    stats[stat.lower()] = int(stat_match.group(1))
            damage = ""
            dmg_match = re.search(r'(\d+d\d+\s*([+-]\s*\d+)?)', desc_part)
            if dmg_match:
                damage = dmg_match.group(1).strip()
            item = {
                "id": item_id,
                "name": {"pt-br": name_pt, "en-us": item_id.replace('_', ' ').title()},
                "category": current_category,
                "type": type_pt,
                "description": {"pt-br": desc_part, "en-us": ""},
                "stats": stats, "damage": damage, "price": price,
                "weight": 1, "rarity": "comum", "isCustom": False
            }
            out_dir = f"database/infodata/items/{current_category}"
            if not os.path.exists(out_dir): os.makedirs(out_dir)
            with open(os.path.join(out_dir, f"{item_id}.json"), 'w', encoding='utf-8') as fout:
                json.dump(item, fout, indent=2, ensure_ascii=False)
            items.append(item_id)
    return items

items_created = parse_itens('reference/Doc/Itens.txt')
print(f"Created {len(items_created)} item files.")
