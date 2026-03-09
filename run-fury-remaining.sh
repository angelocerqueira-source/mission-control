#!/usr/bin/env bash
# Run Fury tasks 2-5 with Mission Control integration
set -eo pipefail

CONVEX_URL="https://third-cardinal-694.convex.cloud"
RESEARCH_DIR="/Users/leticiacampos/.openclaw/workspace/research/digital-products-validation"
LOG_DIR="/Users/leticiacampos/coding/mission-control/logs"
FURY_MC_ID="j97dqrdtvtg7rr1qyzsvhnqpbn82eaeq"
TIMEOUT=300
BOT_TOKEN="8633480940:AAEBJfUQQS7KGcnZvtH7fdm5IKTYfXg64i8"
CHAT_ID="766162535"

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }
log() { echo "[$(timestamp)] $1"; }

convex_mutation() {
  curl -s -X POST "${CONVEX_URL}/api/mutation" \
    -H "Content-Type: application/json" \
    -d "{\"path\":\"${1}\",\"args\":${2}}" > /dev/null 2>&1 || true
}

notify_telegram() {
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" -d "text=${1}" -d "parse_mode=Markdown" > /dev/null 2>&1 || true
}

# Arrays indexed by number to avoid bash associative array issues
NAMES=("07-kit-onboarding" "08-dashboard-gestao" "09-kit-planejamento-estrategico" "10-kit-comunicacao-profissional")
TASK_IDS=("js73bcq6kxyy0tmbzn4xn988bd82ggpq" "js71hj1havbgfhb8hbt1n2j88h82gz5q" "js79gnjd08hnttdgmz6vf9fk9182gfa3" "js74xxcy4f7ejsqqt77qp15xes82hhqv")

PROMPTS=(
  'Pesquise concorrentes para o produto "Kit de Onboarding de Funcionários" (preço: R$67 BRL, mercado Brasil). Kit completo para onboarding de novos funcionários em PMEs: checklists, templates, cronogramas, guias. Use tavily_search para buscar: 1. "kit onboarding funcionarios empresa" na Hotmart e Kiwify 2. "template onboarding colaborador PME" no Google Brasil 3. "checklist integração novo funcionário" em marketplaces BR. Analise: saturação do mercado BR, faixa de preço, diferenciação, tamanho do público. Dê um veredito: GO / ITERAR / PIVOTAR com justificativa. Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/07-kit-onboarding.md'

  'Pesquise concorrentes para o produto "Dashboard de Gestão em Planilha" (preço: R$37 BRL, mercado Brasil). Planilha completa de gestão para PMEs: financeiro, vendas, estoque, KPIs, tudo em Google Sheets/Excel. Use tavily_search para buscar: 1. "planilha gestão empresa completa" na Hotmart e Kiwify 2. "dashboard gestão PME planilha" no Google Brasil 3. "planilha controle financeiro empresa" em marketplaces BR. Analise: saturação do mercado BR (planilhas são populares), faixa de preço, diferenciação possível. Dê um veredito: GO / ITERAR / PIVOTAR com justificativa. Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/08-dashboard-gestao.md'

  'Pesquise concorrentes para o produto "Kit de Planejamento Estratégico" (preço: R$97 BRL, mercado Brasil). Kit completo para planejamento estratégico anual de PMEs: SWOT, OKRs, metas, plano de ação, canvas. Use tavily_search para buscar: 1. "kit planejamento estrategico empresa" na Hotmart e Kiwify 2. "template planejamento estrategico PME" no Google Brasil 3. "modelo OKR metas empresa planilha" em marketplaces BR. Analise: saturação do mercado BR, faixa de preço (R$97 é o teto do portfólio), diferenciação possível. Dê um veredito: GO / ITERAR / PIVOTAR com justificativa. Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/09-kit-planejamento-estrategico.md'

  'Pesquise concorrentes para o produto "Kit de Comunicação Profissional" (preço: R$19,90 BRL, mercado Brasil). Kit com templates de comunicação empresarial: emails profissionais, mensagens, atas de reunião, apresentações, scripts. Use tavily_search para buscar: 1. "template comunicação profissional empresa" na Hotmart e Kiwify 2. "modelo email profissional templates" no Google Brasil 3. "kit comunicação empresarial" em marketplaces BR. Analise: saturação do mercado BR, faixa de preço (R$19,90 é o piso), viabilidade no preço baixo. Dê um veredito: GO / ITERAR / PIVOTAR com justificativa. Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/10-kit-comunicacao-profissional.md'
)

log "=== FURY remaining tasks (2-5 of 5) with MC integration ==="
convex_mutation "activities:log" "{\"type\":\"agent_woke\",\"agentId\":\"${FURY_MC_ID}\",\"message\":\"Fury retomou pipeline — 4 pesquisas restantes (Tier 2 BR)\"}"
notify_telegram "🔍 *Fury* retomou pipeline — 4 pesquisas restantes (Tier 2 BR)"

for i in 0 1 2 3; do
  name="${NAMES[$i]}"
  task_id="${TASK_IDS[$i]}"
  prompt="${PROMPTS[$i]}"
  logfile="$LOG_DIR/fury-${name}.log"
  num=$((i+2))

  log ">>> Fury task ${num}/5: ${name}"

  convex_mutation "tasks:update" "{\"id\":\"${task_id}\",\"status\":\"in_progress\"}"
  convex_mutation "agents:updateStatus" "{\"id\":\"${FURY_MC_ID}\",\"status\":\"active\",\"currentTaskId\":\"${task_id}\"}"
  convex_mutation "activities:log" "{\"type\":\"status_changed\",\"agentId\":\"${FURY_MC_ID}\",\"message\":\"Fury iniciou pesquisa: ${name}\"}"

  start=$(date +%s)

  if openclaw agent --agent customer-researcher --message "$prompt" --timeout "$TIMEOUT" > "$logfile" 2>&1; then
    elapsed=$(( $(date +%s) - start ))
    report="${RESEARCH_DIR}/${name}.md"
    if [ -f "$report" ] && [ "$(wc -l < "$report")" -gt 10 ]; then
      convex_mutation "tasks:update" "{\"id\":\"${task_id}\",\"status\":\"done\"}"
      convex_mutation "activities:log" "{\"type\":\"document_created\",\"agentId\":\"${FURY_MC_ID}\",\"message\":\"Fury concluiu pesquisa: ${name} (${elapsed}s)\"}"
      log "    ✓ Completed: ${name} (${elapsed}s)"
    else
      convex_mutation "tasks:update" "{\"id\":\"${task_id}\",\"status\":\"review\"}"
      convex_mutation "activities:log" "{\"type\":\"status_changed\",\"agentId\":\"${FURY_MC_ID}\",\"message\":\"Fury executou mas relatório incompleto: ${name}\"}"
      log "    ⚠ Report may be incomplete: ${name}"
    fi
  else
    elapsed=$(( $(date +%s) - start ))
    convex_mutation "tasks:update" "{\"id\":\"${task_id}\",\"status\":\"blocked\"}"
    convex_mutation "agents:updateStatus" "{\"id\":\"${FURY_MC_ID}\",\"status\":\"blocked\",\"currentTaskId\":\"${task_id}\"}"
    convex_mutation "activities:log" "{\"type\":\"status_changed\",\"agentId\":\"${FURY_MC_ID}\",\"message\":\"Fury falhou/timeout: ${name} (${elapsed}s)\"}"
    log "    ✗ Failed: ${name} (${elapsed}s)"
  fi

  sleep 5
done

convex_mutation "agents:updateStatus" "{\"id\":\"${FURY_MC_ID}\",\"status\":\"idle\"}"
convex_mutation "activities:log" "{\"type\":\"status_changed\",\"agentId\":\"${FURY_MC_ID}\",\"message\":\"Fury concluiu pipeline de pesquisa Tier 2 BR (5/5)\"}"
notify_telegram "✅ *Fury* finalizou pipeline — 5 pesquisas Tier 2 BR concluídas. Verifique o Mission Control."
log "=== FURY done ==="
