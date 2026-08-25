"""
dungeon_gen.py — Gerador Procedural de Masmorras e Mapas com Paredes LoS (Python Engine)
Gera masmorras completas com salas, corredores, tochas e segmentos de paredes para o Canvas 2D.
"""

import random
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

ROOM_THEMES = [
    "Câmara de Entrada da Coalizão", "Depósito de Plasma Energético",
    "Laboratório de Alquimia de Cristal", "Santuário dos Ancestrais",
    "Posto Avançado Militar", "Refeitório Subterrâneo",
    "Arsenal de Armas de Fogo", "Cofre de Relíquias de Éter",
    "Salão do Trono Abandonado", "Câmara de Confinamento",
    "Ninho de Criaturas Silvestres", "Sala de Máquinas de Vapor e Energia"
]

class DungeonGenerateRequest(BaseModel):
    width: int = Field(default=3000, ge=1000, le=5000)
    height: int = Field(default=3000, ge=1000, le=5000)
    grid_size: int = Field(default=50, ge=25, le=100)
    min_rooms: int = Field(default=5, ge=3, le=15)
    max_rooms: int = Field(default=9, ge=5, le=20)
    dungeon_name: str = "Masmorra Subterrânea da Coalizão"

class RoomData(BaseModel):
    id: str
    name: str
    x: int
    y: int
    w: int
    h: int
    center_x: int
    center_y: int

class WallData(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    isDoor: bool = False
    doorState: str = "closed"

class TorchData(BaseModel):
    id: str
    x: int
    y: int
    color: str = "#FFB347"
    radius: int = 8

class SpawnData(BaseModel):
    type: str # "players", "monster"
    x: int
    y: int
    label: str

class DungeonGenerateResponse(BaseModel):
    name: str
    width: int
    height: int
    grid_size: int
    rooms: List[RoomData]
    wallSegments: List[WallData]
    torches: List[TorchData]
    spawns: List[SpawnData]
    total_rooms: int
    total_walls: int

def _rectangles_overlap(r1: Tuple[int, int, int, int], r2: Tuple[int, int, int, int], padding: int = 1) -> bool:
    x1, y1, w1, h1 = r1
    x2, y2, w2, h2 = r2
    return not (x1 + w1 + padding <= x2 or
                x2 + w2 + padding <= x1 or
                y1 + h1 + padding <= y2 or
                y2 + h2 + padding <= y1)

def generate_dungeon(req: DungeonGenerateRequest) -> DungeonGenerateResponse:
    cells_x = req.width // req.grid_size
    cells_y = req.height // req.grid_size

    num_rooms = random.randint(req.min_rooms, req.max_rooms)
    placed_rooms: List[Tuple[int, int, int, int]] = []

    # 1. Posicionamento de salas não sobrepostas
    attempts = 0
    while len(placed_rooms) < num_rooms and attempts < 150:
        attempts += 1
        room_w = random.randint(6, 12)
        room_h = random.randint(6, 12)
        room_x = random.randint(2, cells_x - room_w - 2)
        room_y = random.randint(2, cells_y - room_h - 2)
        candidate = (room_x, room_y, room_w, room_h)

        if not any(_rectangles_overlap(candidate, r, padding=2) for r in placed_rooms):
            placed_rooms.append(candidate)

    # Criar objetos de salas
    rooms_out: List[RoomData] = []
    shuffled_themes = list(ROOM_THEMES)
    random.shuffle(shuffled_themes)

    for i, (rx, ry, rw, rh) in enumerate(placed_rooms):
        name = shuffled_themes[i % len(shuffled_themes)]
        px = rx * req.grid_size
        py = ry * req.grid_size
        pw = rw * req.grid_size
        ph = rh * req.grid_size
        cx = px + pw // 2
        cy = py + ph // 2
        rooms_out.append(RoomData(
            id=f"room_{i+1}",
            name=name,
            x=px, y=py, w=pw, h=ph,
            center_x=cx, center_y=cy
        ))

    # 2. Conectar salas com corredores e criar portas
    walls_out: List[WallData] = []
    doors_positions: List[Tuple[int, int]] = []

    # Criar paredes perimétricas de cada sala
    for room in rooms_out:
        x, y, w, h = room.x, room.y, room.w, room.h

        # Parede Norte
        walls_out.append(WallData(x1=x, y1=y, x2=x + w, y2=y))
        # Parede Sul
        walls_out.append(WallData(x1=x, y1=y + h, x2=x + w, y2=y + h))
        # Parede Oeste
        walls_out.append(WallData(x1=x, y1=y, x2=x, y2=y + h))
        # Parede Leste
        walls_out.append(WallData(x1=x + w, y1=y, x2=x + w, y2=y + h))

    # Conectar salas adjacentes com portas
    for i in range(len(rooms_out) - 1):
        r1 = rooms_out[i]
        r2 = rooms_out[i + 1]

        # Ponto médio do corredor
        door_x = (r1.center_x + r2.center_x) // 2
        door_y = (r1.center_y + r2.center_y) // 2

        # Inserir porta
        walls_out.append(WallData(
            x1=door_x - req.grid_size // 2,
            y1=door_y,
            x2=door_x + req.grid_size // 2,
            y2=door_y,
            isDoor=True,
            doorState="closed"
        ))
        doors_positions.append((door_x, door_y))

    # 3. Gerar Tochas Dinâmicas
    torches_out: List[TorchData] = []
    torch_colors = ["#FFB347", "#60A5FA", "#A78BFA", "#34D399"]

    for i, room in enumerate(rooms_out):
        # Tocha no centro de cada sala
        color = torch_colors[i % len(torch_colors)]
        torches_out.append(TorchData(
            id=f"torch_{i+1}",
            x=room.center_x,
            y=room.center_y,
            color=color,
            radius=random.choice([8, 10, 12])
        ))

    # 4. Definir Spawns de Jogadores e Criaturas
    spawns_out: List[SpawnData] = []
    if rooms_out:
        # Spawn dos Jogadores na primeira sala
        spawns_out.append(SpawnData(
            type="players",
            x=rooms_out[0].center_x,
            y=rooms_out[0].center_y,
            label="Ponto de Entrada dos Heróis"
        ))

        # Spawn de monstros nas outras salas
        for i in range(1, len(rooms_out)):
            spawns_out.append(SpawnData(
                type="monster",
                x=rooms_out[i].center_x,
                y=rooms_out[i].center_y,
                label=f"Guarnição / Encontro {i}"
            ))

    return DungeonGenerateResponse(
        name=req.dungeon_name,
        width=req.width,
        height=req.height,
        grid_size=req.grid_size,
        rooms=rooms_out,
        wallSegments=walls_out,
        torches=torches_out,
        spawns=spawns_out,
        total_rooms=len(rooms_out),
        total_walls=len(walls_out)
    )
