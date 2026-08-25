"""
test_python_engine.py — Suíte de Testes Unitários para o Python Intelligence Engine
Testa os geradores procedurais canônicos, o algoritmo A* de grid e o analytics.
"""

import unittest
from server.engine.generators import (
    NPCGenerateRequest, generate_npc,
    EncounterBalanceRequest, balance_encounter
)
from server.engine.pathfinding import (
    Coordinate, WallSegment, RouteRequest, find_route
)
from server.engine.analytics import (
    DiceRollEntry, SessionAnalyticsRequest, analyze_session
)

from server.engine.storage import (
    SaveEntityRequest, save_entity_atomic,
    BackupRequest, create_campaign_backup, list_backups
)
from server.engine.dungeon_gen import (
    DungeonGenerateRequest, generate_dungeon
)
from server.engine.db import (
    CombatLogEntry, DiceLogEntry, log_combat_action, log_dice_roll, get_session_stats
)
from server.engine.tunnel import (
    get_network_status
)

class TestPythonIntelligenceEngine(unittest.TestCase):

    def test_npc_generator_canonical_species(self):
        req = NPCGenerateRequest(species_id="lancax", character_class="Atirador", level=3)
        npc = generate_npc(req)
        self.assertEqual(npc.species, "Lancax")
        self.assertEqual(npc.character_class, "Atirador")
        self.assertEqual(npc.level, 3)
        self.assertGreater(npc.hp_max, 20)
        self.assertIn("vit", npc.attributes)
        self.assertIn("dex", npc.attributes)
        # Bônus = floor(valor / 5)
        self.assertEqual(npc.attribute_bonuses["dex"], npc.attributes["dex"] // 5)

    def test_encounter_balance_calculator(self):
        req = EncounterBalanceRequest(party_size=4, average_level=3, difficulty="normal")
        res = balance_encounter(req)
        self.assertEqual(res.party_size, 4)
        self.assertEqual(res.average_level, 3)
        self.assertGreater(res.target_xp, 0)
        self.assertEqual(res.recommended_creature_count, 4)

    def test_pathfinding_direct_route(self):
        req = RouteRequest(
            start=Coordinate(x=100, y=100),
            goal=Coordinate(x=250, y=250),
            grid_size=50
        )
        res = find_route(req)
        self.assertTrue(res.found)
        self.assertGreaterEqual(len(res.path), 2)
        self.assertGreater(res.total_distance_meters, 0.0)

    def test_pathfinding_blocked_by_wall(self):
        # Parede vertical bloqueando o caminho direto
        walls = [WallSegment(x1=150, y1=50, x2=150, y2=350, is_door=False)]
        req = RouteRequest(
            start=Coordinate(x=50, y=150),
            goal=Coordinate(x=250, y=150),
            grid_size=50,
            walls=walls
        )
        res = find_route(req)
        # Deve encontrar caminho desviando da parede
        self.assertTrue(res.found)
        # O caminho desviado deve ter mais de 2 nós
        self.assertGreater(len(res.path), 2)

    def test_session_analytics_calculation(self):
        rolls = [
            DiceRollEntry(author="Polaris", dice_type="d20", result=20, bonus=3),
            DiceRollEntry(author="Violet", dice_type="d20", result=15, bonus=2),
            DiceRollEntry(author="Polaris", dice_type="d20", result=1, bonus=1),
        ]
        req = SessionAnalyticsRequest(
            session_code="V4QUMN",
            round_count=3,
            rolls=rolls,
            total_damage_dealt=45,
            total_damage_taken=12
        )
        res = analyze_session(req)
        self.assertEqual(res.session_code, "V4QUMN")
        self.assertEqual(res.total_rolls, 3)
        self.assertEqual(res.critical_hits_count, 1)
        self.assertEqual(res.critical_failures_count, 1)
        self.assertEqual(res.mvp_player, "Polaris")

    def test_atomic_storage_and_backup(self):
        # 1. Testar gravação atômica
        save_req = SaveEntityRequest(
            folder="npcs",
            id="npc_test_unitario",
            data={"id": "npc_test_unitario", "name": "NPC de Teste Unitário", "level": 1}
        )
        save_res = save_entity_atomic(save_req)
        self.assertTrue(save_res.success)
        self.assertGreater(save_res.bytes_written, 0)
        self.assertTrue(len(save_res.sha256_checksum) == 64)

        # 2. Testar criação de backup
        backup_req = BackupRequest(campaign_name="Test_Campanha", include_saves=False)
        backup_res = create_campaign_backup(backup_req)
        self.assertTrue(backup_res.success)
        self.assertGreater(backup_res.total_files_archived, 0)
        self.assertGreater(backup_res.file_size_kb, 0.0)

        # 3. Testar listagem de backups
        backups = list_backups()
        self.assertIsInstance(backups, list)

    def test_storage_invalid_folder_protection(self):
        # Testar proteção contra path traversal
        with self.assertRaises(ValueError):
            save_req = SaveEntityRequest(
                folder="pasta_proibida",
                id="malicious_file",
                data={"id": "test"}
            )
            save_entity_atomic(save_req)

    def test_procedural_dungeon_generation(self):
        req = DungeonGenerateRequest(
            width=2000,
            height=2000,
            grid_size=50,
            min_rooms=4,
            max_rooms=6,
            dungeon_name="Masmorra de Teste Unitário"
        )
        res = generate_dungeon(req)
        self.assertEqual(res.name, "Masmorra de Teste Unitário")
        self.assertGreaterEqual(res.total_rooms, 4)
        self.assertGreater(res.total_walls, 0)
        self.assertGreater(len(res.wallSegments), 0)
        self.assertGreater(len(res.torches), 0)
        self.assertGreater(len(res.spawns), 0)

    def test_sqlite_wal_combat_and_dice_logging(self):
        code = "TEST_SESSION_WAL"

        # Registrar combate no SQLite WAL
        c_res = log_combat_action(CombatLogEntry(
            session_code=code,
            round_number=1,
            attacker="Polaris",
            target="Lobo das Sombras",
            action_type="attack",
            dice_result=19,
            damage_dealt=24,
            is_crit=True,
            details="Golpe Crítico com Rifle de Plasma"
        ))
        self.assertTrue(c_res["success"])
        self.assertGreater(c_res["id"], 0)

        # Registrar rolagem de dado
        d_res = log_dice_roll(DiceLogEntry(
            session_code=code,
            author="Polaris",
            dice_type="d20",
            result=19,
            bonus=3,
            total=22,
            classification="Sucesso Extremo"
        ))
        self.assertTrue(d_res["success"])

        # Consultar estatísticas da sessão agregadas via SQL
        stats = get_session_stats(code)
        self.assertEqual(stats.session_code, code)
        self.assertGreaterEqual(stats.total_combat_actions, 1)
        self.assertGreaterEqual(stats.total_damage_dealt, 24)
        self.assertEqual(stats.top_damage_dealer, "Polaris")
        self.assertEqual(stats.top_roller, "Polaris")

    def test_network_tunnel_status(self):
        status = get_network_status(session_code="TEST_CODE")
        self.assertIsNotNone(status.local_ip)
        self.assertIn("TEST_CODE", status.player_lan_url)
        self.assertGreater(len(status.instructions), 0)

if __name__ == "__main__":
    unittest.main()
