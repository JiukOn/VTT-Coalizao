"""
pathfinding.py — Algoritmo A* de Busca de Caminho no Grid (Python Engine)
Calcula rotas ótimas entre coordenadas de tokens desviando de paredes e obstáculos.
"""

import math
import heapq
from typing import List, Tuple, Dict, Set, Optional
from pydantic import BaseModel, Field

class Coordinate(BaseModel):
    x: int
    y: int

class WallSegment(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    is_door: bool = False
    door_state: str = "closed" # "open" or "closed"

class RouteRequest(BaseModel):
    start: Coordinate
    goal: Coordinate
    grid_size: int = Field(default=50, ge=10, le=200)
    map_width: int = Field(default=3000)
    map_height: int = Field(default=3000)
    walls: List[WallSegment] = []
    max_steps: int = Field(default=100)

class RouteResponse(BaseModel):
    path: List[Coordinate]
    total_cost_cells: int
    total_distance_meters: float
    found: bool

def _heuristic(a: Tuple[int, int], b: Tuple[int, int]) -> float:
    # Distância Euclidiana / Diagonal Octile
    dx = abs(a[0] - b[0])
    dy = abs(a[1] - b[1])
    return dx + dy + (math.sqrt(2) - 2) * min(dx, dy)

def _segments_intersect(ax: float, ay: float, bx: float, by: float,
                        cx: float, cy: float, dx: float, dy: float) -> bool:
    d1x, d1y = bx - ax, by - ay
    d2x, d2y = dx - cx, dy - cy
    cross = d1x * d2y - d1y * d2x
    if abs(cross) < 1e-9:
        return False
    t = ((cx - ax) * d2y - (cy - ay) * d2x) / cross
    u = ((cx - ax) * d1y - (cy - ay) * d1x) / cross
    return 0.001 < t < 0.999 and 0.001 < u < 0.999

def _is_blocked(cx1: int, cy1: int, cx2: int, cy2: int, size: int, walls: List[WallSegment]) -> bool:
    # Centro da célula 1 para centro da célula 2
    px1 = (cx1 + 0.5) * size
    py1 = (cy1 + 0.5) * size
    px2 = (cx2 + 0.5) * size
    py2 = (cy2 + 0.5) * size
    for w in walls:
        if w.is_door and w.door_state == "open":
            continue
        if _segments_intersect(px1, py1, px2, py2, w.x1, w.y1, w.x2, w.y2):
            return True
    return False

def find_route(req: RouteRequest) -> RouteResponse:
    start_cell = (req.start.x // req.grid_size, req.start.y // req.grid_size)
    goal_cell = (req.goal.x // req.grid_size, req.goal.y // req.grid_size)

    if start_cell == goal_cell:
        return RouteResponse(
            path=[req.start, req.goal],
            total_cost_cells=0,
            total_distance_meters=0.0,
            found=True
        )

    # A* Priority Queue
    open_set: List[Tuple[float, Tuple[int, int]]] = []
    heapq.heappush(open_set, (0.0, start_cell))

    came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
    g_score: Dict[Tuple[int, int], float] = {start_cell: 0.0}
    f_score: Dict[Tuple[int, int], float] = {start_cell: _heuristic(start_cell, goal_cell)}

    visited_count = 0
    max_cells_x = req.map_width // req.grid_size
    max_cells_y = req.map_height // req.grid_size

    # 8 Direções de movimento
    directions = [
        (1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0),
        (1, 1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (-1, -1, 1.414)
    ]

    while open_set and visited_count < req.max_steps * 8:
        visited_count += 1
        _, current = heapq.heappop(open_set)

        if current == goal_cell:
            # Reconstruir caminho
            path_cells = [current]
            while current in came_from:
                current = came_from[current]
                path_cells.append(current)
            path_cells.reverse()

            path_coords = [
                Coordinate(x=int((c[0] + 0.5) * req.grid_size), y=int((c[1] + 0.5) * req.grid_size))
                for c in path_cells
            ]

            # Converter para metros (1 célula = 1.5 metros no Coalizão RPG)
            total_meters = len(path_cells) * 1.5

            return RouteResponse(
                path=path_coords,
                total_cost_cells=len(path_cells) - 1,
                total_distance_meters=round(total_meters, 1),
                found=True
            )

        for dx, dy, cost in directions:
            neighbor = (current[0] + dx, current[1] + dy)
            if not (0 <= neighbor[0] < max_cells_x and 0 <= neighbor[1] < max_cells_y):
                continue

            if _is_blocked(current[0], current[1], neighbor[0], neighbor[1], req.grid_size, req.walls):
                continue

            tentative_g = g_score[current] + cost
            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + _heuristic(neighbor, goal_cell)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))

    # Fallback linha reta se não encontrar caminho
    return RouteResponse(
        path=[req.start, req.goal],
        total_cost_cells=1,
        total_distance_meters=round(math.hypot(req.goal.x - req.start.x, req.goal.y - req.start.y) / req.grid_size * 1.5, 1),
        found=False
    )
