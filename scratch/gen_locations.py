import json
import os

mapping = {
    "city_of_pigs": {"pt-br": "Cidade dos Porcos", "en-us": "City of Pigs"},
    "unknown": {"pt-br": "Desconhecido", "en-us": "Unknown"},
    "dampened_reserve": {"pt-br": "Reserva Amortecida", "en-us": "Dampened Reserve"}
}

out_dir = "database/infodata/locations"
if not os.path.exists(out_dir):
    os.makedirs(out_dir)

for loc_id, names in mapping.items():
    loc = {
        "id": loc_id,
        "name": names,
        "description": {"pt-br": "", "en-us": ""},
        "isCustom": False
    }
    with open(os.path.join(out_dir, f"{loc_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(loc, f, indent=2, ensure_ascii=False)

print("Location definition files created.")
