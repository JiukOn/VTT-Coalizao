"""
db.py — Motor Relacional SQLite em Modo WAL (Python Engine)
Banco de dados transacional ACID ultrarrápido para histórico de combate, rolagens e campanhas.
"""

import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = ROOT_DIR / "database" / "coalizao.db"

class CombatLogEntry(BaseModel):
    session_code: str
    round_number: int = 1
    attacker: str
    target: Optional[str] = None
    action_type: str = "attack" # "attack", "spell", "heal", "condition"
    dice_result: Optional[int] = None
    damage_dealt: int = 0
    is_crit: bool = False
    details: Optional[str] = None

class DiceLogEntry(BaseModel):
    session_code: str
    author: str
    dice_type: str = "d20" # "d20", "d4"
    result: int
    bonus: int = 0
    total: int
    classification: Optional[str] = None

class SessionStatsResponse(BaseModel):
    session_code: str
    total_combat_actions: int
    total_damage_dealt: int
    total_crits: int
    total_dice_rolls: int
    avg_d20: float
    top_damage_dealer: str
    top_roller: str
    history_logs: List[Dict[str, Any]]

def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=15.0)
    conn.row_factory = sqlite3.Row
    # Habilitar modo WAL para alta concorrência de leitura e escrita
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_sqlite_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_code TEXT PRIMARY KEY,
        master_name TEXT DEFAULT 'Mestre',
        status TEXT DEFAULT 'active',
        created_at TEXT,
        updated_at TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS combat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_code TEXT,
        round_number INTEGER,
        attacker TEXT,
        target TEXT,
        action_type TEXT,
        dice_result INTEGER,
        damage_dealt INTEGER DEFAULT 0,
        is_crit INTEGER DEFAULT 0,
        details TEXT,
        timestamp TEXT,
        FOREIGN KEY(session_code) REFERENCES sessions(session_code)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dice_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_code TEXT,
        author TEXT,
        dice_type TEXT,
        result INTEGER,
        bonus INTEGER DEFAULT 0,
        total INTEGER,
        classification TEXT,
        timestamp TEXT,
        FOREIGN KEY(session_code) REFERENCES sessions(session_code)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_combat_session ON combat_logs(session_code);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dice_session ON dice_history(session_code);")

    conn.commit()
    conn.close()

# Inicializar no import
init_sqlite_db()

def log_combat_action(entry: CombatLogEntry) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()

    # Garantir sessão existente
    cursor.execute("""
    INSERT OR IGNORE INTO sessions (session_code, created_at, updated_at)
    VALUES (?, ?, ?)
    """, (entry.session_code, now_str, now_str))

    cursor.execute("""
    INSERT INTO combat_logs (session_code, round_number, attacker, target, action_type, dice_result, damage_dealt, is_crit, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        entry.session_code, entry.round_number, entry.attacker, entry.target,
        entry.action_type, entry.dice_result, entry.damage_dealt,
        1 if entry.is_crit else 0, entry.details, now_str
    ))

    log_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"success": True, "id": log_id, "session_code": entry.session_code, "timestamp": now_str}

def log_dice_roll(entry: DiceLogEntry) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()

    # Garantir sessão existente
    cursor.execute("""
    INSERT OR IGNORE INTO sessions (session_code, created_at, updated_at)
    VALUES (?, ?, ?)
    """, (entry.session_code, now_str, now_str))

    cursor.execute("""
    INSERT INTO dice_history (session_code, author, dice_type, result, bonus, total, classification, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        entry.session_code, entry.author, entry.dice_type, entry.result,
        entry.bonus, entry.total, entry.classification, now_str
    ))

    roll_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"success": True, "id": roll_id, "session_code": entry.session_code, "timestamp": now_str}

def get_session_stats(session_code: str) -> SessionStatsResponse:
    conn = get_connection()
    cursor = conn.cursor()

    # Métricas de combate
    cursor.execute("""
    SELECT COUNT(*) as total_actions, SUM(damage_dealt) as total_dmg, SUM(is_crit) as crits
    FROM combat_logs WHERE session_code = ?
    """, (session_code,))
    c_row = cursor.fetchone()
    total_actions = c_row["total_actions"] if c_row and c_row["total_actions"] else 0
    total_dmg = c_row["total_dmg"] if c_row and c_row["total_dmg"] else 0
    total_crits = c_row["crits"] if c_row and c_row["crits"] else 0

    # Top damage dealer
    cursor.execute("""
    SELECT attacker, SUM(damage_dealt) as dmg
    FROM combat_logs WHERE session_code = ?
    GROUP BY attacker ORDER BY dmg DESC LIMIT 1
    """, (session_code,))
    top_dmg_row = cursor.fetchone()
    top_dmg_dealer = top_dmg_row["attacker"] if top_dmg_row else "Nenhum"

    # Métricas de dados
    cursor.execute("""
    SELECT COUNT(*) as total_rolls, AVG(result) as avg_res
    FROM dice_history WHERE session_code = ? AND LOWER(dice_type) = 'd20'
    """, (session_code,))
    d_row = cursor.fetchone()
    total_rolls = d_row["total_rolls"] if d_row and d_row["total_rolls"] else 0
    avg_d20 = round(d_row["avg_res"], 2) if d_row and d_row["avg_res"] else 10.5

    # Top roller
    cursor.execute("""
    SELECT author, COUNT(*) as c
    FROM dice_history WHERE session_code = ?
    GROUP BY author ORDER BY c DESC LIMIT 1
    """, (session_code,))
    top_roller_row = cursor.fetchone()
    top_roller = top_roller_row["author"] if top_roller_row else "Nenhum"

    # Últimos 20 logs
    cursor.execute("""
    SELECT round_number, attacker, target, damage_dealt, action_type, timestamp
    FROM combat_logs WHERE session_code = ?
    ORDER BY id DESC LIMIT 20
    """, (session_code,))
    recent_logs = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return SessionStatsResponse(
        session_code=session_code,
        total_combat_actions=total_actions,
        total_damage_dealt=total_dmg,
        total_crits=total_crits,
        total_dice_rolls=total_rolls,
        avg_d20=avg_d20,
        top_damage_dealer=top_dmg_dealer,
        top_roller=top_roller,
        history_logs=recent_logs
    )
