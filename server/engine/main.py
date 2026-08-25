"""
main.py — FastAPI Application Entry Point (VTT Coalizão Intelligence Engine)
Servidor de inteligência, geração procedural e pathfinding assíncrono.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .generators import (
    NPCGenerateRequest, NPCResponse, generate_npc,
    EncounterBalanceRequest, EncounterBalanceResponse, balance_encounter
)
from .pathfinding import RouteRequest, RouteResponse, find_route
from .analytics import SessionAnalyticsRequest, SessionAnalyticsResponse, analyze_session
from .storage import (
    SaveEntityRequest, SaveEntityResponse, save_entity_atomic,
    BackupRequest, BackupResponse, create_campaign_backup, list_backups
)
from .dungeon_gen import (
    DungeonGenerateRequest, DungeonGenerateResponse, generate_dungeon
)
from .db import (
    CombatLogEntry, DiceLogEntry, SessionStatsResponse,
    log_combat_action, log_dice_roll, get_session_stats
)
from .tunnel import (
    NetworkStatusResponse, get_network_status
)

app = FastAPI(
    title="VTT Coalizão Intelligence Engine",
    description="Motor assíncrono de inteligência, geração procedural e pathfinding para o VTT Coalizão RPG.",
    version="8.0.0"
)

# ── Habilitar CORS para o frontend Vite e o Gateway Node ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "engine": "Python FastAPI",
        "version": "8.0.0",
        "system": "Coalizão RPG Official Rules Engine"
    }

@app.post("/npc/generate", response_model=NPCResponse)
def api_generate_npc(req: NPCGenerateRequest):
    try:
        return generate_npc(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na geração de NPC: {str(e)}")

@app.post("/encounter/balance", response_model=EncounterBalanceResponse)
def api_balance_encounter(req: EncounterBalanceRequest):
    try:
        return balance_encounter(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no balanceamento de encontro: {str(e)}")

@app.post("/pathfinding/route", response_model=RouteResponse)
def api_find_route(req: RouteRequest):
    try:
        return find_route(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no cálculo de rota: {str(e)}")

@app.post("/campaign/analytics", response_model=SessionAnalyticsResponse)
def api_analyze_session(req: SessionAnalyticsRequest):
    try:
        return analyze_session(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise estatística: {str(e)}")

@app.post("/storage/save-entity", response_model=SaveEntityResponse)
def api_save_entity_atomic(req: SaveEntityRequest):
    try:
        return save_entity_atomic(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na gravação atômica: {str(e)}")

@app.post("/storage/backup", response_model=BackupResponse)
def api_create_backup(req: BackupRequest):
    try:
        return create_campaign_backup(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {str(e)}")

@app.get("/storage/backups")
def api_list_backups():
    try:
        return list_backups()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar backups: {str(e)}")

@app.post("/map/generate-dungeon", response_model=DungeonGenerateResponse)
def api_generate_dungeon(req: DungeonGenerateRequest):
    try:
        return generate_dungeon(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na geração procedural de masmorra: {str(e)}")

@app.post("/db/log-combat")
def api_log_combat(entry: CombatLogEntry):
    try:
        return log_combat_action(entry)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao registrar combate no SQLite: {str(e)}")

@app.post("/db/log-dice")
def api_log_dice(entry: DiceLogEntry):
    try:
        return log_dice_roll(entry)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao registrar dado no SQLite: {str(e)}")

@app.get("/db/stats/{session_code}", response_model=SessionStatsResponse)
def api_get_session_stats(session_code: str):
    try:
        return get_session_stats(session_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas da sessão: {str(e)}")

@app.get("/tunnel/status", response_model=NetworkStatusResponse)
def api_get_tunnel_status(code: str = "V4QUMN"):
    try:
        return get_network_status(session_code=code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter status de rede: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
