#!/usr/bin/env bash
# run-research.sh — Orchestrate Scout & Fury through their 5 research tasks each
# Integrates with Mission Control (Convex) to update task status and log activities
# Usage: ./run-research.sh [scout|fury|all|parallel]

set -euo pipefail

RESEARCH_DIR="/Users/leticiacampos/.openclaw/workspace/research/digital-products-validation"
CONVEX_URL="https://third-cardinal-694.convex.cloud"
TIMEOUT=300  # 5 minutes per task
LOG_DIR="/Users/leticiacampos/coding/mission-control/logs"

# Agent IDs in Mission Control (Convex)
SCOUT_AGENT_ID="j97e3ncpq46rnmgfdr656z2j6s82f9de"
FURY_AGENT_ID="j97dqrdtvtg7rr1qyzsvhnqpbn82eaeq"

# Task IDs mapped to product names
declare -A TASK_IDS=(
  ["01-ai-implementation-checklist"]="js75v562vhqd9njd4bcf6pg3f582g4zy"
  ["02-pack-prompts-pro"]="js7e001xvsv4rh53j33vxdptys82h6wa"
  ["03-ai-workflow-kit"]="js7bsynr99vq9avs3cy17mcte182gt7m"
  ["04-claude-projects-kit"]="js72yeqffk70te8hq1n8ycwf1x82hnx8"
  ["05-ai-manager-playbook"]="js760qche0c13nj3ecm70qt7g982h3zj"
  ["06-kit-sops-prontos"]="js71dv5sngsvk7d4f657mavfex82gzhf"
  ["07-kit-onboarding"]="js73bcq6kxyy0tmbzn4xn988bd82ggpq"
  ["08-dashboard-gestao"]="js71hj1havbgfhb8hbt1n2j88h82gz5q"
  ["09-kit-planejamento-estrategico"]="js79gnjd08hnttdgmz6vf9fk9182gfa3"
  ["10-kit-comunicacao-profissional"]="js74xxcy4f7ejsqqt77qp15xes82hhqv"
)

mkdir -p "$LOG_DIR"

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }
log() { echo "[$(timestamp)] $1"; }

# --- Convex API helpers ---
convex_mutation() {
  local path="$1"
  local args="$2"
  curl -s -X POST "${CONVEX_URL}/api/mutation" \
    -H "Content-Type: application/json" \
    -d "{\"path\":\"${path}\",\"args\":${args}}" 2>/dev/null || true
}

# Update task status in Mission Control
update_task_status() {
  local task_id="$1"
  local status="$2"
  convex_mutation "tasks:update" "{\"id\":\"${task_id}\",\"status\":\"${status}\"}"
  log "    [MC] Task ${task_id} → ${status}"
}

# Log activity in Mission Control feed
log_activity() {
  local type="$1"
  local agent_id="$2"
  local message="$3"
  convex_mutation "activities:log" "{\"type\":\"${type}\",\"agentId\":\"${agent_id}\",\"message\":\"${message}\"}"
}

# Update agent status in Mission Control
update_agent_status() {
  local agent_id="$1"
  local status="$2"
  local task_id="${3:-}"
  if [ -n "$task_id" ]; then
    convex_mutation "agents:updateStatus" "{\"id\":\"${agent_id}\",\"status\":\"${status}\",\"currentTaskId\":\"${task_id}\"}"
  else
    convex_mutation "agents:updateStatus" "{\"id\":\"${agent_id}\",\"status\":\"${status}\"}"
  fi
}

# Send Telegram notification
notify_telegram() {
  local message="$1"
  local BOT_TOKEN="8633480940:AAEBJfUQQS7KGcnZvtH7fdm5IKTYfXg64i8"
  local CHAT_ID="766162535"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${message}" \
    -d "parse_mode=Markdown" > /dev/null 2>&1 || true
}

# Run a single research task with full MC integration
run_task() {
  local agent_cli_id="$1"   # openclaw agent id (e.g. product-analyst)
  local agent_mc_id="$2"    # convex agent id
  local agent_name="$3"     # display name (Scout/Fury)
  local task_name="$4"      # e.g. 01-ai-implementation-checklist
  local task_num="$5"       # e.g. 1
  local task_total="$6"     # e.g. 5
  local prompt="$7"

  local task_id="${TASK_IDS[$task_name]}"
  local logfile="$LOG_DIR/${agent_name,,}-${task_name}.log"

  log ">>> ${agent_name} task ${task_num}/${task_total}: ${task_name}"

  # Mark task as in_progress + agent as active
  update_task_status "$task_id" "in_progress"
  update_agent_status "$agent_mc_id" "active" "$task_id"
  log_activity "status_changed" "$agent_mc_id" "${agent_name} iniciou pesquisa: ${task_name}"

  local start_time=$(date +%s)

  if openclaw agent --agent "$agent_cli_id" --message "$prompt" --timeout "$TIMEOUT" > "$logfile" 2>&1; then
    local end_time=$(date +%s)
    local duration=$(( end_time - start_time ))

    # Check if report file was actually created/updated
    local report_file="${RESEARCH_DIR}/${task_name}.md"
    if [ -f "$report_file" ] && [ "$(wc -l < "$report_file")" -gt 10 ]; then
      update_task_status "$task_id" "done"
      log_activity "document_created" "$agent_mc_id" "${agent_name} concluiu pesquisa: ${task_name} (${duration}s)"
      log "    ✓ Completed: ${task_name} (${duration}s, report saved)"
    else
      update_task_status "$task_id" "review"
      log_activity "status_changed" "$agent_mc_id" "${agent_name} executou mas relatório incompleto: ${task_name}"
      log "    ⚠ Agent ran but report may be incomplete: ${task_name} (see $logfile)"
    fi
  else
    local end_time=$(date +%s)
    local duration=$(( end_time - start_time ))

    update_task_status "$task_id" "blocked"
    update_agent_status "$agent_mc_id" "blocked" "$task_id"
    log_activity "status_changed" "$agent_mc_id" "${agent_name} falhou/timeout: ${task_name} (${duration}s)"
    log "    ✗ Failed or timed out: ${task_name} (${duration}s, see $logfile)"
  fi

  sleep 5
}

# --- SCOUT TASKS (Tier 1: AI Universal, USD) ---
run_scout() {
  log "=== SCOUT (product-analyst) — 5 Tier 1 products ==="
  log_activity "agent_woke" "$SCOUT_AGENT_ID" "Scout acordou para pipeline de pesquisa (5 produtos Tier 1)"
  notify_telegram "🔍 *Scout* iniciou pipeline de pesquisa — 5 produtos Tier 1 (AI Universal, USD)"

  declare -a SCOUT_NAMES=(
    "01-ai-implementation-checklist"
    "02-pack-prompts-pro"
    "03-ai-workflow-kit"
    "04-claude-projects-kit"
    "05-ai-manager-playbook"
  )

  declare -a SCOUT_PROMPTS=(
    'Pesquise concorrentes para o produto "AI Implementation Checklist" (preço: $7 LATAM-ES, $9 EN).
É um checklist prático para pequenas empresas implementarem IA nos processos.
Use tavily_search para buscar:
1. "AI implementation checklist small business" no Gumroad, Product Hunt
2. "ai checklist template" no Google
3. Preços de concorrentes similares, reviews, volume de vendas quando visível
Analise: saturação do mercado, faixa de preço, diferenciação possível.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/01-ai-implementation-checklist.md'

    'Pesquise concorrentes para o produto "Pack de Prompts Pro para Claude/GPT" (preço: $9 LATAM-ES, $14 EN).
É um pack com prompts prontos e otimizados para uso profissional com Claude e GPT.
Use tavily_search para buscar:
1. "prompt pack GPT Claude business" no Gumroad
2. "best AI prompts template pack" no Google
3. "prompt engineering pack" no Product Hunt e marketplaces
Analise: saturação do mercado, faixa de preço, diferenciação possível, exemplos de produtos bem-sucedidos.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/02-pack-prompts-pro.md'

    'Pesquise concorrentes para o produto "AI Workflow Kit for Business" (preço: $17 LATAM-ES, $19 EN).
Kit com 12+ workflows completos de IA para processos de negócio (marketing, vendas, operações, RH).
Use tavily_search para buscar:
1. "AI workflow template business" no Gumroad
2. "AI automation workflow kit small business" no Google
3. "n8n zapier AI workflow templates" em marketplaces
Analise: saturação do mercado, faixa de preço, diferenciação possível.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/03-ai-workflow-kit.md'

    'Pesquise concorrentes para o produto "Claude Projects & Skills Ready-to-Use Kit" (preço: $17 LATAM-ES, $27 EN).
Kit com 10+ Claude Projects pré-configurados com system prompts, skills e workflows prontos para uso.
Use tavily_search para buscar:
1. "Claude projects templates kit" no Gumroad
2. "Claude AI system prompt templates" no Google
3. "Claude skills setup guide" no Reddit r/ClaudeAI
Analise: saturação do mercado, faixa de preço, diferenciação possível. Produto mais nichado = menos concorrência esperada.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/04-claude-projects-kit.md'

    'Pesquise concorrentes para o produto "The AI Manager Playbook" (preço: $12 LATAM-ES, $17 EN).
Playbook completo para gestores que querem implementar IA na equipe: frameworks de decisão, ROI, change management.
Use tavily_search para buscar:
1. "AI manager playbook leadership" no Gumroad
2. "AI implementation guide managers" no Google
3. "AI adoption framework small business" no LinkedIn e blogs
Analise: saturação do mercado, faixa de preço, diferenciação possível.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/05-ai-manager-playbook.md'
  )

  for i in "${!SCOUT_NAMES[@]}"; do
    run_task "product-analyst" "$SCOUT_AGENT_ID" "Scout" "${SCOUT_NAMES[$i]}" "$((i+1))" "5" "${SCOUT_PROMPTS[$i]}"
  done

  update_agent_status "$SCOUT_AGENT_ID" "idle"
  log_activity "status_changed" "$SCOUT_AGENT_ID" "Scout concluiu pipeline de pesquisa Tier 1"
  notify_telegram "✅ *Scout* finalizou pipeline — 5 pesquisas Tier 1 concluídas"
  log "=== SCOUT done ==="
}

# --- FURY TASKS (Tier 2: BR-Only, BRL) ---
run_fury() {
  log "=== FURY (customer-researcher) — 5 Tier 2 products ==="
  log_activity "agent_woke" "$FURY_AGENT_ID" "Fury acordou para pipeline de pesquisa (5 produtos Tier 2 BR)"
  notify_telegram "🔍 *Fury* iniciou pipeline de pesquisa — 5 produtos Tier 2 (BR-Only, BRL)"

  declare -a FURY_NAMES=(
    "06-kit-sops-prontos"
    "07-kit-onboarding"
    "08-dashboard-gestao"
    "09-kit-planejamento-estrategico"
    "10-kit-comunicacao-profissional"
  )

  declare -a FURY_PROMPTS=(
    'Pesquise concorrentes para o produto "Kit de SOPs Prontos" (preço: R$47 BRL, mercado Brasil).
Kit com SOPs (Procedimentos Operacionais Padrão) prontos para micro e pequenas empresas brasileiras.
Use tavily_search para buscar:
1. "kit SOP pronto pequena empresa" na Hotmart e Kiwify
2. "modelo SOP procedimento operacional" no Google Brasil
3. "templates SOP empresa" em marketplaces BR
Analise: saturação do mercado BR, faixa de preço em BRL, diferenciação possível, público-alvo (donos de PMEs 35-50 anos).
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/06-kit-sops-prontos.md'

    'Pesquise concorrentes para o produto "Kit de Onboarding de Funcionários" (preço: R$67 BRL, mercado Brasil).
Kit completo para onboarding de novos funcionários em PMEs: checklists, templates, cronogramas, guias.
Use tavily_search para buscar:
1. "kit onboarding funcionarios empresa" na Hotmart e Kiwify
2. "template onboarding colaborador PME" no Google Brasil
3. "checklist integração novo funcionário" em marketplaces BR
Analise: saturação do mercado BR, faixa de preço, diferenciação, tamanho do público.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/07-kit-onboarding.md'

    'Pesquise concorrentes para o produto "Dashboard de Gestão em Planilha" (preço: R$37 BRL, mercado Brasil).
Planilha completa de gestão para PMEs: financeiro, vendas, estoque, KPIs, tudo em Google Sheets/Excel.
Use tavily_search para buscar:
1. "planilha gestão empresa completa" na Hotmart e Kiwify
2. "dashboard gestão PME planilha" no Google Brasil
3. "planilha controle financeiro empresa" em marketplaces BR
Analise: saturação do mercado BR (planilhas são populares), faixa de preço, diferenciação possível.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/08-dashboard-gestao.md'

    'Pesquise concorrentes para o produto "Kit de Planejamento Estratégico" (preço: R$97 BRL, mercado Brasil).
Kit completo para planejamento estratégico anual de PMEs: SWOT, OKRs, metas, plano de ação, canvas.
Use tavily_search para buscar:
1. "kit planejamento estrategico empresa" na Hotmart e Kiwify
2. "template planejamento estrategico PME" no Google Brasil
3. "modelo OKR metas empresa planilha" em marketplaces BR
Analise: saturação do mercado BR, faixa de preço (R$97 é o teto do portfólio), diferenciação possível.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/09-kit-planejamento-estrategico.md'

    'Pesquise concorrentes para o produto "Kit de Comunicação Profissional" (preço: R$19,90 BRL, mercado Brasil).
Kit com templates de comunicação empresarial: emails profissionais, mensagens, atas de reunião, apresentações, scripts.
Use tavily_search para buscar:
1. "template comunicação profissional empresa" na Hotmart e Kiwify
2. "modelo email profissional templates" no Google Brasil
3. "kit comunicação empresarial" em marketplaces BR
Analise: saturação do mercado BR, faixa de preço (R$19,90 é o piso), viabilidade no preço baixo.
Dê um veredito: GO / ITERAR / PIVOTAR com justificativa.
Salve o relatório em: /Users/leticiacampos/.openclaw/workspace/research/digital-products-validation/10-kit-comunicacao-profissional.md'
  )

  for i in "${!FURY_NAMES[@]}"; do
    run_task "customer-researcher" "$FURY_AGENT_ID" "Fury" "${FURY_NAMES[$i]}" "$((i+1))" "5" "${FURY_PROMPTS[$i]}"
  done

  update_agent_status "$FURY_AGENT_ID" "idle"
  log_activity "status_changed" "$FURY_AGENT_ID" "Fury concluiu pipeline de pesquisa Tier 2 BR"
  notify_telegram "✅ *Fury* finalizou pipeline — 5 pesquisas Tier 2 BR concluídas"
  log "=== FURY done ==="
}

# --- MAIN ---
MODE="${1:-all}"

log "Mission Control integration: ON (Convex + Telegram)"

case "$MODE" in
  scout)
    run_scout
    ;;
  fury)
    run_fury
    ;;
  all)
    log "Running Scout and Fury sequentially (to avoid rate limits)"
    notify_telegram "🚀 *Research Pipeline* iniciado — 10 tarefas de validação (Scout + Fury)"
    run_scout
    run_fury
    notify_telegram "🏁 *Research Pipeline* completo — 10 pesquisas finalizadas. Verifique o Mission Control."
    log "=== ALL RESEARCH COMPLETE ==="
    ;;
  parallel)
    log "Running Scout and Fury in parallel"
    notify_telegram "🚀 *Research Pipeline* iniciado em paralelo — 10 tarefas (Scout + Fury)"
    run_scout &
    SCOUT_PID=$!
    run_fury &
    FURY_PID=$!
    wait $SCOUT_PID
    wait $FURY_PID
    notify_telegram "🏁 *Research Pipeline* completo — 10 pesquisas finalizadas. Verifique o Mission Control."
    log "=== ALL RESEARCH COMPLETE (parallel) ==="
    ;;
  *)
    echo "Usage: $0 [scout|fury|all|parallel]"
    exit 1
    ;;
esac
