# ⚔️ VTT COALIZÃO — Virtual Tabletop Tático

> **Plataforma Completa de RPG de Mesa Virtual** desenvolvida especificamente para o sistema de RPG **Coalizão** (D20 + D4), com arquitetura híbrida de altíssimo desempenho, inteligência procedural, banco de dados relacional e comunicação em tempo real.

---

## 🏛️ Arquitetura do Sistema: Híbrida Ativa

O **VTT Coalizão** adota uma **Arquitetura Híbrida Ativa**, combinando o melhor do ecossistema **Node.js** para sinalização de rede ultrarrápida com o poder analítico e procedural do **Python**:

```
                              ┌────────────────────────┐
                              │    🌐 NAVEGADORES      │
                              │  Mestre & Jogadores    │
                              └───────────┬────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │                                               │
       ⚡ HTTP / Assets (:5173)                       🔌 WebSocket (<1ms) (:3001)
                  │                                               │
                  ▼                                               ▼
      ┌───────────────────────┐                       ┌───────────────────────┐
      │     FRONTEND VITE     │                       │  🟢 GATEWAY NODE.JS   │
      │  React 19 + Canvas 2D │                       │  Broadcast & Salas    │
      └───────────────────────┘                       └───────────┬───────────┘
                                                                  │
                                                        Proxy Transparente
                                                        /api/engine/*
                                                                  │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │  🐍 PYTHON ENGINE     │
                                                      │  FastAPI (Porta 8000) │
                                                      └───────────┬───────────┘
                                                                  │
                                             ┌────────────────────┴────────────────────┐
                                             ▼                                         ▼
                                   ┌───────────────────┐                     ┌───────────────────┐
                                   │  💾 ARMAZENAMENTO │                     │  🗄️ BANCO RELAC.  │
                                   │  Gravação Atômica │                     │  SQLite Modo WAL  │
                                   │  & Backups ZIP    │                     │  (coalizao.db)    │
                                   └───────────────────┘                     └───────────────────┘
```

### 1. 🟢 Gateway Node.js (`server/src/` — Porta 3001)
- **Comunicação em Tempo Real**: WebSocket de baixa latência (<1ms) para sincronização de tokens, iniciativa, dados e pings.
- **Proxy Integrado**: Redirecionamento transparente de `/api/engine/*` para o motor Python com fallback inteligente.
- **Sinalização WebRTC / Áudio**: Broadcast de estados de voz, efeitos sonoros (SFX) e chat com sussurros (`/whisper`).

### 2. 🐍 Python Intelligence Engine (`server/engine/` — Porta 8000)
- **🏰 Geração Procedural de Masmorras (`dungeon_gen.py`)**: Geração de salas temáticas, corredores, tochas e paredes de Linha de Visão (LoS) automáticas.
- **🧭 Pathfinding Tático A\* (`pathfinding.py`)**: Cálculo da menor rota desviando de cantos, portas e obstáculos no grid.
- **🗄️ Motor Relacional SQLite WAL (`db.py`)**: Banco relacional em `database/coalizao.db` com Write-Ahead Logging para histórico de combates e rolagens.
- **💾 Gravação Atômica Anti-Corrupção (`storage.py`)**: Gravação segura com `tempfile` + `os.replace` + checksum SHA-256 e criação de backups `.vttpack` em ZIP.
- **📡 Assistente de Conectividade (`tunnel.py`)**: Detecção de IP local (Wi-Fi/LAN) e IP público com geração de QR Code para smartphones.

### 3. ⚡ Frontend Modular (`master/` & `player/` — Porta 5173)
- **👑 Interface do Mestre (`master/`)**: Controle total de combate, mapas com camadas, névoa de guerra, marcadores secretos, clima dinâmico, criador de masmorras LoS e painel analítico.
- **🛡️ Interface do Jogador (`player/`)**: HUD tático com névoa de exploração 3-Tier, Laser Ping, medidor de latência em milissegundos, ficha dinâmica e lançamento rápido de habilidades com consumo de Energia (ENR).

---

## 📁 Organização Modular do Repositório

O projeto é estruturado em diretórios canônicos e modulares:

```
Projeto VTT/
├── master/             # 👑 Frontend e interface exclusiva do Mestre de Jogo
├── player/             # 🛡️ Frontend e interface exclusiva dos Jogadores
├── server/             # 🟢 Gateway Node.js (:3001) & 🐍 Python FastAPI Engine (:8000)
│   ├── src/            # Gateway WebSocket e rotas REST Node.js
│   └── engine/         # Inteligência procedural, masmorras, SQLite WAL e storage Python
├── database/           # 🗄️ Dados canônicos (758 JSONs), SQLite WAL (coalizao.db) e backups
├── shared/             # 📦 Componentes, hooks, schemas Zod, utilitários e assets públicos
├── infra/              # ⚙️ Scripts de automação (CLI, launcher, validação) e testes
└── docs/               # 📚 Manuais, relatórios de campanha e documentação técnica
```

---

## ⌨️ Comandos da CLI Oficial (`vtt`)

O projeto inclui a ferramenta de linha de comando **`vtt`**, que unifica todas as operações da mesa com comandos simples:

| Comando | Atalho npm | Descrição |
| :--- | :--- | :--- |
| **`.\vtt init`** | `npm run vtt:init` | 🚀 **Prepara o Ambiente**: Cria diretórios, instala dependências (Node + Python) e valida o banco. |
| **`.\vtt start`** | `npm run vtt:start` | ⚔️ **Inicia a Mesa Completa**: Sobe Node (:3001), Python (:8000), Vite (:5173) e abre o navegador. |
| **`.\vtt log`** | `npm run vtt:log` | 📊 **Gera Métricas de Sessão**: Cria o relatório analítico em Markdown em `docs/session_reports/`. |
| **`.\vtt test`** | `npm run vtt:test` | 🧪 **Executa Testes**: Roda Python unittest (10/10) + JavaScript Vitest (216/216) + ESLint. |
| **`.\vtt backup`** | `npm run vtt:backup` | 💾 **Snapshot com 1 Clique**: Gera um arquivo `.vttpack` com checksum SHA-256 em `database/backups/`. |
| **`.\vtt check`** | `npm run vtt:check` | 🔍 **Auditor Canônico**: Valida 100% dos 758 arquivos JSON de regras e dados. |
| **`.\vtt status`** | `npm run vtt:status` | 📡 **Monitor de Saúde**: Verifica o status das portas de rede (3001, 8000, 5173). |

---

## 🌟 Principais Funcionalidades

### 🗺️ Mapa Tático & Linha de Visão (Canvas 2D)
- **Névoa de Guerra em 3 Camadas (3-Tier Fog)**: Área visível em tempo real (100% clara), área já explorada (Shroud 50% cinza) e escuridão total (0%).
- **🏰 Gerador de Masmorras LoS**: O motor Python gera a masmorra e injeta as paredes e portas no Canvas com 1 clique.
- **🧭 Pathfinding Tático A\***: Cálculo visual de rota contornando paredes com medição precisa em metros.
- **📍 Laser Pointer & Ping**: Mestre e Jogadores podem apontar pontos no mapa com anéis luminosos sincronizados.
- **🌧️ Clima Dinâmico**: Chuva de plasma, tempestade de areia, neve e cinzas vulcânicas renderizadas no Canvas.
- **📐 Áreas de Efeito (AoE)**: Modelos geométricos de magias (Círculo, Cone e Linha) com detecção de tokens atingidos.

### ⚔️ Combate e Resolução de Regras (Coalizão)
- **Regras Oficiais Integradas**:
  - *Corpo a Corpo*: $1\text{d}20 + \text{FRC}$ vs $1\text{d}20 + \text{FRC}$
  - *Distância*: $1\text{d}20 + \text{PRE}$ vs $1\text{d}20 + \text{DEX}$
  - *Mágico*: Formação ($1\text{d}20 + \text{PRE} \ge 12$) seguido de $1\text{d}20 + \text{ENR}$ vs $1\text{d}20 + \text{RES}$
  - *Dano Base*: $1\text{d}4$ + Bônus
- **Baralho de Iniciativa Dinâmico**: Cartas de iniciativa táticas com controle de rodadas.
- **Auras e Condições**: Emissão visual de auras e gerenciamento de condições persistentes.
- **Sintetizador Procedural de Áudio (SFX)**: Efeitos sonoros gerados via Web Audio API para dados, acertos, erros e turnos.

### 📊 Telemetria e Analytics em Tempo Real
- **Registro no SQLite WAL**: Cada rolagem e ataque é salvo transacionalmente em `database/coalizao.db`.
- **Painel de Métricas da Sessão**: Acompanhamento de Dano Total, Acertos Críticos, Média de D20 e MVP da Mesa.
- **Exportação de Relatórios**: Geração de relatórios analíticos de campanha em Markdown com 1 clique.

---

## 🚀 Instalação e Execução

### Pré-requisitos
- **Node.js** v18 ou superior.
- **Python** 3.10 ou superior.

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/JiukOn/VTT-Coalizao.git
cd "VTT-Coalizao"
```

### Passo 2: Inicializar o Ambiente
```bash
# Executa a preparação completa (instala Node, Python e valida o banco)
.\vtt init
```

### Passo 3: Iniciar a Mesa
```bash
# Sobe todos os servidores e abre o navegador automaticamente
.\vtt start
```

---

## 🧪 Qualidade de Código e Testes Automatizados

O repositório possui garantia rigorosa de integridade e cobertura de testes:

| Suíte de Testes | Escopo | Resultado |
| :--- | :--- | :---: |
| **Python Unittest** (`infra/tests/test_python_engine.py`) | Storage, Geradores, Masmorras, SQLite WAL, Tunnel | ✅ **10/10 Testes (100%)** |
| **JavaScript Vitest** (`infra/tests/*.test.js`) | Regras, Combate, Fichas, WebSocket, Pathfinding, Backups | ✅ **216/216 Testes (100%)** |
| **Auditoria Canônica** (`infra/scripts/validate_db.py`) | Validação dos 758 arquivos JSON de regras e dados | ✅ **758/758 Arquivos (100%)** |
| **ESLint** (`eslint .`) | Qualidade estática e regras de React | ✅ **0 Erros, 0 Avisos** |
| **Compilação de Produção** (`vite build`) | Build dos clientes Mestre e Jogador | ✅ **Sucesso (~400ms)** |

---

## 📜 Licença

Desenvolvido para uso na campanha e sistema de RPG **Coalizão**. Todos os direitos reservados.
