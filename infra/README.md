# ⚙️ Módulo INFRA — Configurações, Testes e Ferramentas

O módulo **INFRA** centraliza a infraestrutura de desenvolvimento, compilação, testes automatizados e scripts auxiliares do **VTT Coalizão**.

---

## 📂 Estrutura Interna

- **`tests/`**: Suíte de 37 arquivos de testes com **211 testes unitários automatizados** em Vitest cobrindo 100% dos módulos de regras.
- **`scripts/`**: Scripts de manutenção, migração de dados, auditoria de imports e reconstrução de índices.
- **`scratch/`**: Scripts auxiliares de população e sincronização original da base.
- **`configs/`**: Configurações de ferramentas de build e linting (`vite.config.js`, `eslint.config.js`, `vitest.config.js`).

---

## 🛠️ Comandos de Infraestrutura

- `npm test`: Executa todos os testes automatizados da suíte (`infra/tests/**/*.test.js`).
- `npm run lint`: Executa a verificação estática do ESLint.
- `npm run build`: Gera os pacotes minificados de produção em `/dist`.
