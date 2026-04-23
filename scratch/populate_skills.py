import json
import os
import re

# Load mapping
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

def parse_skills(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by categories (UPPERCASE/ followed by newline)
    sections = re.split(r'([A-ZÇÚ ]+)/', content)
    skills = []
    
    category_map = {
        "LEGADO": "legacy",
        "ATIVAS": "active",
        "PASSIVAS": "passive",
        "MITO": "myth",
        "USO ÚNICO": "unique",
        "DESCENDÊNCIA": "lineage"
    }

    # sections[0] is usually empty or header.
    # The rest comes in pairs: [CategoryName, Content]
    for i in range(1, len(sections), 2):
        cat_pt = sections[i].strip()
        cat_content = sections[i+1].strip()
        
        category = category_map.get(cat_pt, "active")
        
        lines = cat_content.split('\n')
        for line in lines:
            if '->' not in line: continue
            
            # Parse line: (Evo X) Name (Source) -> Description
            parts = line.split('->')
            name_part = parts[0].strip()
            desc_part = parts[1].strip()
            
            # Extract Evo, Name, Source
            # (Evo Contrato de Sangue) Pacto de Sangue (Domador)
            evo_source = ""
            source = ""
            name_pt = name_part
            
            # Check for Evo
            evo_match = re.search(r'\(Evo (.*?)\)', name_pt)
            if evo_match:
                evo_pt = evo_match.group(1).strip()
                evo_source = get_english_id(evo_pt)
                name_pt = name_pt.replace(evo_match.group(0), '').strip()
            
            # Check for Source (Class/Origin)
            source_match = re.search(r'\((.*?)\)$', name_pt)
            if source_match:
                source = source_match.group(1).strip()
                name_pt = name_pt.replace(source_match.group(0), '').strip()
            
            skill_id = get_english_id(name_pt)
            
            skill = {
                "id": skill_id,
                "name": {
                    "pt-br": name_pt,
                    "en-us": skill_id.replace('_', ' ').title()
                },
                "category": category,
                "source": source,
                "description": {
                    "pt-br": desc_part,
                    "en-us": "" # Placeholder
                },
                "evolution_of": evo_source,
                "isCustom": False
            }
            
            # Determine subfolder
            out_dir = f"database/infodata/skills/{category}"
            if not os.path.exists(out_dir):
                os.makedirs(out_dir)
            
            file_name = f"{skill_id}.json"
            with open(os.path.join(out_dir, file_name), 'w', encoding='utf-8') as fout:
                json.dump(skill, fout, indent=2, ensure_ascii=False)
            
            skills.append(skill_id)
            
    return skills

skills_created = parse_skills('reference/Doc/Habilidades.txt')
print(f"Created {len(skills_created)} skill files.")
