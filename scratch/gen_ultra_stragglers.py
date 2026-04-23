import json
import os

def create_def(cat, en_id):
    data = {"id": en_id, "name": {"pt-br": en_id, "en-us": en_id.replace('_', ' ').title()}, "isCustom": False}
    folder = f"database/infodata/{cat}"
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, f"{en_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

stragglers = [
    ('items/general', 'flute_cleaner'),
    ('items/general', 'mara_almonds'),
    ('items/general', 'panguar_teeth'),
    ('items/weapons', 'twin_daggers_water'),
    ('items/weapons', 'twin_daggers_fire'),
    ('items/vestments', 'cornara_glove'),
    ('items/vestments', 'inoue_leather_pants'),
    ('items/vestments', 'crocohog_shoes'),
    ('items/general', 'teleport_scroll'),
    ('items/general', 'black_market_coin'),
    ('skills/active', 'juntos_somos_mais'), 
    ('skills/active', 'amaldicoar_agua'),
    ('skills/active', 'arte_maos_livres'),
]

for cat, pid in stragglers: 
    create_def(cat, pid)
    
print("Ultra-final straggler files created.")
