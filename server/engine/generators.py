"""
generators.py — Geradores Procedurais Oficiais do Coalizão RPG (Python Engine)
Geração procedural de NPCs, encontros táticos balanceados e ganchos narrativos.
"""

import random
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ── Tabelas Canônicas Oficiais da Coalizão ──────────────────────────────────────

SPECIES_LIST = [
    {"id": "humano", "name": "Humano", "bonus": {"vit": 1, "crm": 1, "enr": 1}},
    {"id": "lancax", "name": "Lancax", "bonus": {"dex": 2, "pre": 1, "vit": -1}},
    {"id": "elfo", "name": "Elfo", "bonus": {"int": 2, "dex": 1, "res": -1}},
    {"id": "anao", "name": "Anão", "bonus": {"res": 2, "frc": 1, "dex": -1}},
    {"id": "gran", "name": "Gran", "bonus": {"frc": 2, "vit": 2, "dex": -2}},
    {"id": "yomunkai", "name": "Yomunkai", "bonus": {"pre": 2, "int": 1, "crm": -1}},
    {"id": "ink_king", "name": "Ink King", "bonus": {"crm": 2, "enr": 2, "vit": -2}},
    {"id": "demonio", "name": "Demônio", "bonus": {"frc": 2, "enr": 1, "res": -1}},
    {"id": "anjo", "name": "Anjo", "bonus": {"res": 2, "crm": 1, "frc": -1}},
    {"id": "gigante", "name": "Gigante", "bonus": {"frc": 3, "vit": 2, "dex": -3}},
    {"id": "goblin", "name": "Goblin", "bonus": {"dex": 2, "pre": 1, "frc": -2}},
    {"id": "kobold", "name": "Kobold", "bonus": {"dex": 1, "int": 1, "frc": -1}},
]

CLASSES_LIST = [
    "Guerreiro", "Paladino", "Caçador", "Ladino", "Mago", "Bruxo",
    "Engenheiro", "Atirador", "Baluarte", "Espadachim", "Monge", "Sacerdote",
    "Bardo", "Alquimista", "Guardião", "Infiltrador"
]

TENDENCIES_LIST = [
    "Táticas de Combate", "Armas de Fogo", "Primeiros Socorros",
    "Parkour & Furtividade", "Modificação de Armas", "Feitiçaria Elemental",
    "Diplomacia da Coalizão", "Sobrevivência em Biomas Hostis"
]

PERSONALITIES = [
    "Disciplinado e leal à Coalizão", "Cínico e pragmático",
    "Curioso e obcecado por tecnologia de plasma", "Calmo sob fogo cerrado",
    "Vingativo contra facções rebeldes", "Protetor fervoroso dos inocentes"
]

FIRST_NAMES = [
    "Kael", "Lyra", "Doran", "Vesper", "Thorne", "Zarek", "Aria", "Corin",
    "Mira", "Garrick", "Sariel", "Tarek", "Boran", "Valeria", "Roderick"
]

LAST_NAMES = [
    "Vance", "Blackwood", "Ironclad", "Storm", "Holloway", "Ravencrest",
    "Ashford", "Nightshade", "Silverstein", "Kovacs", "Drake", "Valerius"
]

# ── Modelos de Dados ─────────────────────────────────────────────────────────

class NPCGenerateRequest(BaseModel):
    species_id: Optional[str] = None
    character_class: Optional[str] = None
    level: int = Field(default=1, ge=1, le=20)
    location: Optional[str] = "Posto Avançado da Coalizão"

class NPCResponse(BaseModel):
    id: str
    name: str
    species: str
    character_class: str
    level: int
    hp_max: int
    sp_max: int
    attributes: Dict[str, int]
    attribute_bonuses: Dict[str, int]
    tendency: str
    personality: str
    location: str
    equipment: List[str]
    notes: str

class EncounterBalanceRequest(BaseModel):
    party_size: int = Field(default=4, ge=1, le=16)
    average_level: int = Field(default=1, ge=1, le=20)
    difficulty: str = Field(default="normal") # "easy", "normal", "hard", "deadly"

class EncounterBalanceResponse(BaseModel):
    party_size: int
    average_level: int
    difficulty: str
    target_xp: int
    recommended_creature_count: int
    creature_tier_suggestion: str
    environmental_hazard_suggestion: str

# ── Funções de Geração ───────────────────────────────────────────────────────

def generate_npc(req: NPCGenerateRequest) -> NPCResponse:
    species_data = next((s for s in SPECIES_LIST if s["id"] == req.species_id), None)
    if not species_data:
        species_data = random.choice(SPECIES_LIST)

    char_class = req.character_class if req.character_class in CLASSES_LIST else random.choice(CLASSES_LIST)
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

    # Atributos base distribuídos
    base_points = 25 + (req.level - 1) * 3
    attrs = {
        "vit": 10, "dex": 10, "crm": 10, "frc": 10,
        "int": 10, "res": 10, "pre": 10, "enr": 10
    }

    # Aplicar modificadores de espécie
    for attr, mod in species_data.get("bonus", {}).items():
        attrs[attr] = max(5, attrs[attr] + mod)

    # Distribuir pontos adicionais de nível aleatoriamente com viés da classe
    extra_points = max(0, base_points - 80)
    attr_keys = list(attrs.keys())
    for _ in range(extra_points):
        chosen = random.choice(attr_keys)
        attrs[chosen] += 1

    # Bônus = floor(valor / 5)
    bonuses = {k: v // 5 for k, v in attrs.items()}

    # Cálculo canônico de HP e SP
    hp_max = 20 + (bonuses["vit"] * 5) + (req.level * 4)
    sp_max = 10 + (bonuses["res"] * 3)

    return NPCResponse(
        id=f"npc_{random.randint(10000, 99999)}",
        name=name,
        species=species_data["name"],
        character_class=char_class,
        level=req.level,
        hp_max=hp_max,
        sp_max=sp_max,
        attributes=attrs,
        attribute_bonuses=bonuses,
        tendency=random.choice(TENDENCIES_LIST),
        personality=random.choice(PERSONALITIES),
        location=req.location or "Posto Avançado da Coalizão",
        equipment=["Rifle de Pulso Padrão", "Faca Tática de Liga", "Armadura de Proteção Leve", "2x Células de Energia"],
        notes=f"NPC gerado proceduralmente pelo motor Python para o posto {req.location}."
    )

def balance_encounter(req: EncounterBalanceRequest) -> EncounterBalanceResponse:
    multipliers = {
        "easy": 0.6,
        "normal": 1.0,
        "hard": 1.5,
        "deadly": 2.2
    }
    mult = multipliers.get(req.difficulty.lower(), 1.0)
    base_xp_per_player = req.average_level * 150
    target_xp = int(base_xp_per_player * req.party_size * mult)

    if req.difficulty == "easy":
        count = max(1, req.party_size - 1)
        tier = "Lacaios e criaturas menores (1 a 2 níveis abaixo do grupo)"
        hazard = "Terreno desimpedido, iluminação normal"
    elif req.difficulty == "normal":
        count = req.party_size
        tier = "Criaturas padrão do mesmo nível do grupo"
        hazard = "Cobertura parcial e obstáculos leves"
    elif req.difficulty == "hard":
        count = req.party_size + 2
        tier = "Líder de Esquadrão + Escoltas veteranas"
        hazard = "Zona de terreno difícil ou névoa densa"
    else:
        count = max(2, req.party_size // 2 + 1)
        tier = "Chefe Canônico de Encontro com Ação Lendária e Escudos de Plasma"
        hazard = "Clima perigoso (Chuva Ácida / Brasas de Ash Forest) + Cobertura pesada"

    return EncounterBalanceResponse(
        party_size=req.party_size,
        average_level=req.average_level,
        difficulty=req.difficulty,
        target_xp=target_xp,
        recommended_creature_count=count,
        creature_tier_suggestion=tier,
        environmental_hazard_suggestion=hazard
    )
