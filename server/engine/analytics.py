"""
analytics.py — Auditoria e Métricas Estatísticas da Sessão (Python Engine)
Calcula estatísticas de combate, distribuição de dados D20 e resumo de letalidade da campanha.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class DiceRollEntry(BaseModel):
    author: str
    dice_type: str = "d20" # "d20", "d4"
    result: int
    bonus: int = 0
    classification: Optional[str] = None
    timestamp: Optional[str] = None

class SessionAnalyticsRequest(BaseModel):
    session_code: str
    round_count: int = 1
    rolls: List[DiceRollEntry] = []
    total_damage_dealt: int = 0
    total_damage_taken: int = 0
    casualties: int = 0

class SessionAnalyticsResponse(BaseModel):
    session_code: str
    total_rolls: int
    average_d20_result: float
    critical_hits_count: int
    critical_failures_count: int
    mvp_player: str
    combat_lethality_index: str
    summary_text: str

def analyze_session(req: SessionAnalyticsRequest) -> SessionAnalyticsResponse:
    d20_rolls = [r for r in req.rolls if r.dice_type.lower() == "d20"]
    total_d20 = len(d20_rolls)

    if total_d20 > 0:
        avg_d20 = round(sum(r.result for r in d20_rolls) / total_d20, 2)
        crits = sum(1 for r in d20_rolls if r.result == 20)
        fumbles = sum(1 for r in d20_rolls if r.result == 1)
    else:
        avg_d20 = 10.5
        crits = 0
        fumbles = 0

    # Contagem de rolagens por jogador
    player_counts: Dict[str, int] = {}
    for r in req.rolls:
        player_counts[r.author] = player_counts.get(r.author, 0) + 1

    mvp = max(player_counts, key=player_counts.get) if player_counts else "Nenhum"

    # Índice de letalidade
    if req.casualties >= 3 or req.total_damage_taken > req.total_damage_dealt * 1.5:
        lethality = "Extrema / Brutal (Alto Risco de TPK)"
    elif req.casualties >= 1:
        lethality = "Moderada / Desafiadora"
    else:
        lethality = "Controlada / Tática"

    summary = (
        f"Sessão {req.session_code}: {req.round_count} rodadas jogadas com {len(req.rolls)} rolagens registradas. "
        f"Média de D20 em {avg_d20}. Total de {crits} acertos críticos e {fumbles} desastres. "
        f"Dano total causado: {req.total_damage_dealt} | Dano recebido: {req.total_damage_taken}."
    )

    return SessionAnalyticsResponse(
        session_code=req.session_code,
        total_rolls=len(req.rolls),
        average_d20_result=avg_d20,
        critical_hits_count=crits,
        critical_failures_count=fumbles,
        mvp_player=mvp,
        combat_lethality_index=lethality,
        summary_text=summary
    )
