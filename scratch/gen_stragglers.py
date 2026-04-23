import json
import os

def create_def(cat, en_id):
    data = {"id": en_id, "name": {"pt-br": en_id, "en-us": en_id.replace('_', ' ').title()}, "isCustom": False}
    folder = f"database/infodata/{cat}"
    if not os.path.exists(folder): os.makedirs(folder)
    with open(os.path.join(folder, f"{en_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Missing files identified by consistency check
create_def('classes', 'merchant')
create_def('skills/active', 'total_reclusion')
create_def('skills/active', 'nullification')
create_def('skills/active', 'stealth')
create_def('skills/active', 'energy_bow')
create_def('skills/active', 'blocked')
create_def('skills/active', 'curse_water')
create_def('skills/active', 'voo_sombrio')
create_def('skills/active', 'peck')
create_def('skills/active', 'emotional_bond')

print("Final straggler files created.")
