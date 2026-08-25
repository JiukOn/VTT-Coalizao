# 🌐 Módulo SERVER — Realtime Gateway (Node.js) & Intelligence Engine (Python)

O módulo **SERVER** opera sob uma **Arquitetura Híbrida Ativa**, integrando a velocidade de rede em tempo real do Node.js com o poder de processamento, cálculo geométrico e banco transacional SQLite WAL do Python FastAPI.

---

## 🏛️ Divisão Especializada de Responsabilidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MÓDULO SERVER (HÍBRIDO)                           │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 🟢 Realtime Gateway (Node.js :3001)  │ 🐍 Intelligence Engine (Python :8000)│
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • WebSocket Server para 16+ jogadores │ • Gerador Procedural de Masmorras    │
│ • Broadcast em tempo real (<1ms)     │ • Banco Relacional SQLite em Modo WAL│
│ • Sincronização de mapas e névoa     │ • Assistente de Conexão e Túneis LAN │
│ • Validação Zod & Keepalive          │ • Gravação Atômica (Zero Corrupção)  │
│ • Proxy API transparente             │ • Backups Compactados (.vttpack zip) │
│ • Fallback local automático          │ • Pathfinding A* no Grid de Batalha  │
│ • Sincronização de áudio e dados     │ • Auditoria Estatística da Sessão    │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 📂 Estrutura Interna

```
server/
├── src/                          # 🟢 Realtime Gateway Node.js
│   ├── index.js                  # Ponto de entrada com Express, WS Server e Proxy /api/engine
│   ├── sessionManager.js         # Gerador de códigos de sessão (ex: V4QUMN) e IP LAN
│   ├── masterHandlers.js         # Handlers de mensagens do Mestre
│   ├── playerHandlers.js         # Handlers de mensagens do Jogador
│   ├── serverLogger.js           # Gravador de logs em docs/logs/
│   └── autoSave.js              # Heartbeat periódico de salvamento automático
├── engine/                       # 🐍 Intelligence Engine Python (FastAPI)
│   ├── main.py                   # Ponto de entrada FastAPI com CORS e rotas REST
│   ├── dungeon_gen.py            # 🏰 Gerador procedural de masmorras e paredes LoS
│   ├── db.py                     # 💾 Motor relacional SQLite WAL (database/coalizao.db)
│   ├── tunnel.py                 # 🔗 Assistente de conectividade e links de acesso
│   ├── storage.py                # 🛡️ Gravação atômica segura (anti-corrupção) e backups .zip
│   ├── generators.py             # 🎲 Gerador procedural canônico de NPCs e Encontros
│   ├── pathfinding.py            # 🗺️ Algoritmo A* para movimentação no grid tático
│   ├── analytics.py              # 📊 Auditoria estatística e letalidade de combate
│   └── requirements.txt          # Dependências (fastapi, uvicorn, pydantic)
├── relay/                        # ☁️ Servidor Relay multi-salas para nuvem
│   └── index.js
└── package.json                  # Scripts autônomos
```

---

## 📡 Endpoints do Motor Python (`/api/engine/*`)

| Rota HTTP | Função |
| :--- | :--- |
| `POST /api/engine/map/generate-dungeon` | Gera masmorras completas com salas, corredores, tochas e paredes LoS. |
| `POST /api/engine/db/log-combat` | Registra ações de combate no banco SQLite WAL transacional. |
| `POST /api/engine/db/log-dice` | Registra histórico de rolagens de D20/D4 no SQLite WAL. |
| `GET /api/engine/db/stats/{session_code}` | Consulta estatísticas agregadas e MVP da sessão via SQL. |
| `GET /api/engine/tunnel/status` | Retorna IPs da rede e link de conexão pré-formatado para jogadores. |
| `POST /api/engine/storage/save-entity` | Gravação atômica de JSONs com fsync e checksum SHA-256. |
| `POST /api/engine/storage/backup` | Criação de pacote de backup compactado `.vttpack` em zip. |
| `GET /api/engine/storage/backups` | Listagem dos backups disponíveis com tamanho e data. |
| `POST /api/engine/npc/generate` | Gera NPCs canônicos com atributos, espécies e classes. |
| `POST /api/engine/encounter/balance` | Calcula balanceamento de encontros por nível e jogadores. |
| `POST /api/engine/pathfinding/route` | Calcula a melhor rota A* no grid desviando de paredes. |
| `POST /api/engine/campaign/analytics` | Gera métricas estatísticas e resumo analítico da sessão. |
| `GET /api/engine/health` | Healthcheck do motor Python. |
