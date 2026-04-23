import json
import os

# Load existing mapping
with open('scratch/master_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

# Load all references (UTF-16LE)
with open('scratch/all_references.json', 'r', encoding='utf-16') as f:
    refs = json.load(f)

# Collect all unique Portuguese IDs
all_pt_ids = set()
for key, values in refs.items():
    for val in values:
        if val and isinstance(val, str):
            all_pt_ids.add(val)

# Helper to suggest a translation if missing
def suggest_translation(pt_id):
    # Basic rules: keep common gaming terms, translate others
    # Since I don't have a GPT-4 translator tool here, I'll have to do my best with heuristics
    # OR better yet, I'll use the user's edits as much as possible.
    
    # If it's already in mapping, return it
    if pt_id in mapping:
        return mapping[pt_id]
    
    # Heuristics for common words
    suggestions = {
        "lobo": "wolf",
        "espada": "sword",
        "aco": "steel",
        "ferro": "iron",
        "couro": "leather",
        "adaga": "dagger",
        "elmo": "helmet",
        "peitoral": "chestplate",
        "sapato": "shoes",
        "bota": "boots",
        "anel": "ring",
        "colar": "necklace",
        "livro": "book",
        "pocao": "potion",
        "pergaminho": "scroll",
        "carne": "meat",
        "osso": "bone",
        "pena": "feather",
        "sangue": "blood",
        "olho": "eye",
        "garras": "claws",
        "canino": "canine",
        "chifre": "horn",
        "tromba": "trunk",
        "marfim": "ivory",
        "azul": "blue",
        "vermelho": "red",
        "verde": "green",
        "preto": "black",
        "branco": "white",
        "grande": "large",
        "medio": "medium",
        "pequeno": "small",
        "congelar": "freeze",
        "chamas": "flames",
        "fogo": "fire",
        "agua": "water",
        "gelo": "ice",
        "terra": "earth",
        "ar": "air",
        "luz": "light",
        "trevas": "darkness",
        "vazio": "void",
        "cura": "cure",
        "forca": "strength",
        "agilidade": "agility",
        "vitalidade": "vitality",
        "resistencia": "resistance",
        "inteligencia": "intelligence",
        "carisma": "charisma",
        "precisao": "precision",
        "energia": "energy",
        "mestre": "master",
        "aprendiz": "apprentice",
        "guarda": "guard",
        "rei": "king",
        "rainha": "queen",
        "lorde": "lord",
        "viconde": "viscount",
        "barao": "baron",
        "cavaleiro": "knight",
        "sacerdote": "priest",
        "mago": "mage",
        "feiticeiro": "sorcerer",
        "alquimista": "alchemist",
        "bardo": "bard",
        "ladino": "rogue",
        "guerreiro": "warrior",
        "paladino": "paladin",
        "monge": "monk",
        "druida": "druid",
        "cacador": "hunter",
        "atirador": "shooter",
        "assassino": "assassin",
        "sombra": "shadow",
        "bestia": "beast",
        "criatura": "creature",
        "monstro": "monster",
        "demonio": "demon",
        "anjo": "angel",
        "humano": "human",
        "elfo": "elf",
        "anao": "dwarf",
        "gigante": "giant",
        "goblin": "goblin",
        "kobold": "kobold",
        "planta": "plant",
        "madeira": "wood",
        "pedra": "stone",
        "metal": "metal",
        "ouro": "gold",
        "prata": "silver",
        "platina": "platinum",
        "diamante": "diamond",
        "cristal": "crystal",
        "joia": "gem",
        "moeda": "coin",
        "saco": "bag",
        "cesta": "basket",
        "balde": "bucket",
        "garrafa": "bottle",
        "copo": "cup",
        "taca": "glass",
        "caneta": "pen",
        "papel": "paper",
        "pergaminho": "scroll",
        "mapa": "map",
        "chave": "key",
        "bau": "chest",
        "caixa": "box",
        "espelho": "mirror",
        "bussola": "compass",
        "luneta": "spyglass",
        "bestiario": "bestiary",
        "diario": "journal",
        "nota": "note",
        "carta": "letter",
        "selo": "seal",
        "insignia": "badge",
        "trofeu": "trophy"
    }
    
    # Try to translate word by word
    words = pt_id.split('_')
    en_words = []
    for w in words:
        if w in suggestions:
            en_words.append(suggestions[w])
        else:
            en_words.append(w) # Fallback to original word if unknown
    
    return '_'.join(en_words)

# Fill in missing mappings
for pt_id in all_pt_ids:
    if pt_id not in mapping:
        mapping[pt_id] = suggest_translation(pt_id)

# Manual overrides for specific important entries I missed or want to be precise about
overrides = {
    "cidade_dos_porcos": "city_of_pigs",
    "reserva_amortecida": "dampened_reserve",
    "desconhecido": "unknown",
    "nao_classificado": "unclassified",
    "bloqueado": "blocked",
    "indefinido": "undefined",
    "rei_tinta": "ink_king",
    "lancax": "lancax",
    "capanga": "henchman",
    "desclassificada": "unclassified",
    "mercenario": "mercenary",
    "vegetal": "vegetal",
    "bondade": "goodness",
    "cansado": "tired",
    "completamente_cruel": "completely_cruel",
    "confiavel": "reliable",
    "direto": "direct",
    "entusiasta": "enthusiastic",
    "forca_absoluta": "absolute_strength",
    "gentil": "gentle",
    "heroismo": "heroism",
    "humorista": "humorist",
    "inumano": "inhuman",
    "leal": "loyal",
    "mascara_social": "social_mask",
    "nobre": "noble",
    "obediente": "obedient",
    "orgulhoso": "proud",
    "religioso": "religious"
}

mapping.update(overrides)

# Save final mapping
with open('scratch/master_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, indent=2, ensure_ascii=False)

print(f"Master mapping completed with {len(mapping)} entries.")
