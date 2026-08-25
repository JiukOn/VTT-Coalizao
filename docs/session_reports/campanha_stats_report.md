# 📊 Relatório Estatístico e Métricas da Campanha — VTT Coalizão

*Gerado automaticamente em 23/08/2026 às 18:59:19 pelo motor Python Intelligence Engine.*

---

## 🏛️ 1. Censo do Acervo Canônico Oficial

| Categoria | Quantidade de Registros | Descrição |
| :--- | :---: | :--- |
| **Classes & Especializações** | 38 | Classes base, evoluídas (Nv 5) e trans-evoluções (Nv 10) |
| **Espécies Canônicas** | 16 | 16 raças oficiais com modificadores de atributos |
| **Habilidades & Magias** | 140 | Habilidades ativas, legado, míticas e consumo de ENR |
| **Itens & Armamentos** | 280 | Armas, armaduras, consumíveis, relíquias e modificações |
| **Bestiário de Criaturas** | 52 | Monstros, feras e chefes canônicos pré-cadastrados |
| **Heróis Históricos** | 9 | Fichas oficiais dos personagens da campanha Coalizão |
| **Auras Táticas** | 6 | Auras oficiais com raio de 6m e bônus aplicados |
| **Biomas & Climas** | 9 | Ambientes canônicos (Ash Forest, Deep Purple Forest, etc.) |

---

## 🧙‍♂️ 2. Heróis Ativos da Campanha

| Herói | Nível | Classe | Espécies | Nível de ENR | Idade |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **Aurelio Calopsittus** | Nv 3 | `guardian` | human / monster | 5 ENR | 32 anos |
| **Edgar Gagarin** | Nv 3 | `alchemist` | human | 5 ENR | 19 anos |
| **Ethan** | Nv 4 | `bard` | human | 5 ENR | 23 anos |
| **Fifo Zante** | Nv 5 | `synchronizer` | human | 0 ENR | 20 anos |
| **Kalina Amster** | Nv 4 | `merchant` | human / demon | 0 ENR | 28 anos |
| **Ling Tạw Nìm** | Nv 3 | `monk` | human | 5 ENR | 25 anos |
| **Ouruen** | Nv 6 | `recluse` | human | 13 ENR | 26 anos |
| **Polaris Ciemin** | Nv 5 | `writer` | human / gran | 5 ENR | 20 anos |
| **Ravi** | Nv 7 | `flow_shooter` | human | 8 ENR | 21 anos |

---

## 🎯 3. Resumo de Prontidão da Mesa

- **Capacidade do Servidor:** Até 16 jogadores simultâneos + 1 Mestre com latência de broadcast <1ms.
- **Motor de IA / Pathfinding:** Integrado via Python FastAPI na porta 8000 (`/api/engine/`).
- **Persistência Local:** Dexie.js (IndexedDB) no navegador + auto-saves em `database/saves/`.
