# 💾 Módulo DATABASE — Dados Canônicos & Persistência

O módulo **DATABASE** centraliza todo o acervo oficial de regras em formato JSON do **Coalizão RPG** e a camada de persistência local via **Dexie.js (IndexedDB)**.

---

## 📂 Estrutura Interna

```
database/
├── infodata/                     # Acervo canônico oficial da Coalizão
│   ├── classes/                  # 24 Classes Base, 13 Evoluídas e TransEvolved
│   ├── species/                  # 16 Espécies oficiais (Lancax, Elfo, Anão, Gran, etc.)
│   ├── auras/                    # 6 Auras canônicas (Harmonia, Caos, Inspiração, etc.)
│   ├── elements/                 # 7 Elementos canônicos (Fogo, Água, Raio, Terra, etc.)
│   ├── skills/                   # ~140 Habilidades ativas, legado, míticas
│   ├── effects/                  # Condições, maldições e doenças
│   ├── items/                    # ~184 Armas, armaduras e consumíveis
│   ├── modifications/            # 41 Modificadores de armamentos
│   ├── biomes/ & ambients/       # Biomas e climas oficiais
│   ├── tendencies/               # Tendências e aptidões da ficha
│   ├── creatures/ & npcs/        # Bestiário e catálogo de NPCs
│   ├── heroes/ & sessions/       # Heróis históricos e atas da campanha
│   └── Template/                 # Modelos JSON de referência
├── services/
│   ├── database.js               # Schema Dexie.js do IndexedDB local
│   ├── dataSeeder.js             # Populador do banco local a partir do acervo JSON
│   └── campaignIO.js             # Exportador e importador de pacotes .json
├── index.js                      # Barrel export de serviços de banco
└── package.json                  # Manifesto do módulo
```

---

## 💾 Persistência Offline-First

- Na primeira execução do aplicativo, o `dataSeeder.js` popula o IndexedDB local do navegador do Mestre de forma transparente e resiliente.
- Campanhas inteiras podem ser exportadas para um arquivo `.json` de backup seguro a qualquer momento pela aba **Campanha**.
