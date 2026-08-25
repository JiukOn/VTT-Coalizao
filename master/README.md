# 👑 Módulo MASTER — Painel do Mestre (Game Master Tabletop)

O módulo **MASTER** contém a aplicação completa do Mestre de Jogo, incluindo o motor de Canvas 2D com Linha de Visão (LoS), tochas, paredes, portas, gerenciamento de campanha, bestiário, auras e modo telão.

---

## 📂 Estrutura Interna

```
master/
├── src/
│   ├── App.jsx                   # Raiz da aplicação do Mestre com abas e layout
│   ├── pages/                    # 11 Páginas completas do Mestre
│   │   ├── DashboardPage.jsx     # Mesa ativa, log de rolagens e Desfazer/Refazer (Undo/Redo)
│   │   ├── MapPage.jsx           # Mapa Tático 2D com Raycasting, névoa e tochas
│   │   ├── CharactersPage.jsx    # Gerenciador e criador de Fichas de Heróis
│   │   ├── NPCsPage.jsx          # Catálogo de NPCs por localidade
│   │   ├── BestiaryPage.jsx      # Bestiário oficial (82 criaturas + 15 chefes)
│   │   ├── AbilitiesPage.jsx     # Catálogo oficial de habilidades
│   │   ├── ItemsPage.jsx         # Catálogo de armas, armaduras e modificações
│   │   ├── CampaignPage.jsx      # Diário, atas de sessões e backups
│   │   ├── DomainPage.jsx        # Sistema de Domínio (Pontos de Comando: PC = INT + CRM)
│   │   ├── TvDisplayPage.jsx     # Modo Telão / TV Tabletop para mesas presenciais
│   │   └── ServerPage.jsx        # Painel do servidor WebSocket local
│   ├── components/
│   │   ├── combat/               # Auras, Condições, Iniciativa, Sequelas, Fumble, Loot
│   │   ├── map/                  # Canvas 2D, Toolbar, Biomas, Clima, Marcadores, Tokens
│   │   ├── campaign/             # Diário, Quests, Handouts, Cenas cinematográficas
│   │   ├── entities/             # Fichas de monstros e gerador de NPCs
│   │   └── layout/               # Header, Sidebar, BottomBar, DetailPanel
│   ├── context/                  # CampaignContext, ServerContext
│   └── access/                   # masterAuth.js, sessionGuard.jsx
└── package.json                  # Manifesto do módulo
```

---

## 🌟 Funcionalidades do Mestre

1. **🗺️ Mapa Tático 2D de Alto Desempenho:**
   - Oclusão de visão por paredes opacas e portas interativas.
   - Tochas dinâmicas acopladas a tokens ou fixas no cenário.
   - Névoa de guerra pintável e revelável.
   - Medição de distâncias em metros com SHIFT.
2. **🌟 Auras Canônicas da Coalizão:**
   - Emissão das 6 auras oficiais (*Harmonia*, *Caos*, *Inspiração*, *Opressor*, *Revelação*, *Desordem*) com raio de 6m e bônus aplicados automaticamente.
3. **🩸 Condições, Maldições & Doenças:**
   - *Sangralisia* (teste 1d4), *Gripe do Aço* (1d20 <= 7), *Curto-Circuito*, *Florescência*.
4. **📺 Modo TV / Telão:**
   - Projeção em tela cheia limpa para mesas digitais com grid magnético.
