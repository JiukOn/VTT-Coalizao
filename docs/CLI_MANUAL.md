# ⌨️ Manual da CLI Oficial do VTT Coalizão

A ferramenta de terminal unificada **`vtt`** permite inicializar, operar, auditar, testar e salvar a mesa de RPG com comandos simples e diretos.

---

## 🚀 Guia Rápido de Comandos

Você pode executar os comandos diretamente via terminal PowerShell, Prompt de Comando (CMD) ou Bash:

```bash
# Execução direta no terminal:
vtt init        # Prepara a máquina, instala pacotes e audita o banco
vtt start       # Sobe todo o ecossistema (Node + Python + Vite) e abre o navegador
vtt dev         # 🔥 Modo Dev com Hot-Reload (Node --watch + Python --reload + Vite HMR)
vtt log         # Gera o relatório analítico e logs de combate da sessão
vtt test        # Executa a suíte de testes completa (Python + Vitest + ESLint)
vtt backup      # Cria um snapshot atômico (.vttpack) com hash SHA-256
vtt check       # Audita os 758 arquivos JSON canônicos
vtt status      # Verifica a saúde e portas dos servidores
```

*(Ou através do `npm run`)*:
```bash
npm run vtt:init
npm run vtt:start
npm run vtt:dev
npm run vtt:log
npm run vtt:test
npm run vtt:backup
npm run vtt:check
npm run vtt:status
```

---

## 📋 Detalhamento dos Comandos

### 1. `vtt init`
- Cria os diretórios necessários (`database/backups/`, `database/sessions/`, `docs/session_reports/`).
- Instala todas as dependências Node.js (`npm install`).
- Instala e valida os módulos Python do Intelligence Engine (`fastapi`, `uvicorn`, `pydantic`).
- Executa a auditoria de integridade em 100% dos JSONs canônicos da Coalizão.

### 2. `vtt start` (ou `vtt launch`)
- Inicializa de forma orquestrada:
  - 🟢 **Gateway Node.js (Porta 3001)**: Sinalização em tempo real e WebSockets (<1ms).
  - 🐍 **Python Intelligence Engine (Porta 8000)**: IA procedural, masmorras LoS, SQLite WAL e gravação segura.
  - ⚡ **Frontend Vite (Porta 5173)**: Interface responsiva do Mestre e Jogadores.
- Abre o navegador automaticamente na tela da mesa.

### 3. `vtt log` (ou `vtt stats`)
- Consulta as transações do banco relacional **SQLite WAL** (`database/coalizao.db`).
- Gera o relatório formatado em Markdown da campanha em `docs/session_reports/campanha_stats_report.md`.
- Exibe o resumo do combate (Dano Total, MVP, Críticos, Desastres) no terminal.

### 4. `vtt test`
- Executa os 10 testes unitários Python (`test_python_engine.py`).
- Executa os 216 testes automatizados JavaScript (`vitest`).
- Executa a validação estática do ESLint com zero erros e zero avisos.

### 5. `vtt backup`
- Gera um pacote `.vttpack` compactado em ZIP com todos os mapas, fichas e histórico.
- Calcula o checksum SHA-256 e armazena em `database/backups/`.

### 6. `vtt check`
- Executa a validação dos 758 arquivos canônicos (habilidades, classes, espécies, itens, criaturas, monstros e condições).

### 7. `vtt status`
- Testa as portas de rede locais (`3001`, `8000`, `5173`) e relata se cada componente do ecossistema está online ou inativo.
