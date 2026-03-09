#!/usr/bin/env python3
"""Sync research .md files to Convex documents table (idempotent — skips existing)."""
import json
import os
import urllib.request

CONVEX_URL = "https://third-cardinal-694.convex.cloud"
RESEARCH_DIR = "/Users/leticiacampos/.openclaw/workspace/research/digital-products-validation"

REPORTS = [
    ("01-ai-implementation-checklist", "js75v562vhqd9njd4bcf6pg3f582g4zy", "Pesquisa: AI Implementation Checklist ($7-9 USD)"),
    ("02-pack-prompts-pro", "js7e001xvsv4rh53j33vxdptys82h6wa", "Pesquisa: Pack Prompts Pro ($9-14 USD)"),
    ("03-ai-workflow-kit", "js7bsynr99vq9avs3cy17mcte182gt7m", "Pesquisa: AI Workflow Kit ($17-19 USD)"),
    ("04-claude-projects-kit", "js72yeqffk70te8hq1n8ycwf1x82hnx8", "Pesquisa: Claude Projects Kit ($17-27 USD)"),
    ("05-ai-manager-playbook", "js760qche0c13nj3ecm70qt7g982h3zj", "Pesquisa: AI Manager Playbook ($12-17 USD)"),
    ("06-kit-sops-prontos", "js71dv5sngsvk7d4f657mavfex82gzhf", "Pesquisa: Kit SOPs Prontos (R$47 BRL)"),
    ("07-kit-onboarding", "js73bcq6kxyy0tmbzn4xn988bd82ggpq", "Pesquisa: Kit Onboarding (R$67 BRL)"),
    ("08-dashboard-gestao", "js71hj1havbgfhb8hbt1n2j88h82gz5q", "Pesquisa: Dashboard Gestão (R$37 BRL)"),
    ("09-kit-planejamento-estrategico", "js79gnjd08hnttdgmz6vf9fk9182gfa3", "Pesquisa: Kit Planejamento Estratégico (R$97 BRL)"),
    ("10-kit-comunicacao-profissional", "js74xxcy4f7ejsqqt77qp15xes82hhqv", "Pesquisa: Kit Comunicação Profissional (R$19,90 BRL)"),
]

def convex_query(path: str, args: dict):
    data = json.dumps({"path": path, "args": args}).encode()
    req = urllib.request.Request(f"{CONVEX_URL}/api/query", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def convex_mutation(path: str, args: dict):
    data = json.dumps({"path": path, "args": args}).encode()
    req = urllib.request.Request(f"{CONVEX_URL}/api/mutation", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  Error: {e}")
        return None

# Get existing docs to avoid duplicates
existing = convex_query("documents:list", {})
existing_task_ids = {doc.get("taskId") for doc in existing.get("value", [])}

count = 0
skipped = 0
for filename, task_id, title in REPORTS:
    if task_id in existing_task_ids:
        skipped += 1
        continue

    filepath = os.path.join(RESEARCH_DIR, f"{filename}.md")
    if not os.path.exists(filepath):
        print(f"⏭ Not found: {filename}")
        continue

    with open(filepath, "r") as f:
        content = f.read()

    if len(content.strip()) < 100:
        print(f"⏭ Too short: {filename}")
        continue

    result = convex_mutation("documents:create", {
        "title": title,
        "content": content,
        "type": "research",
        "taskId": task_id,
    })

    if result and result.get("status") == "success":
        print(f"✓ {title}")
        count += 1
    else:
        print(f"✗ Failed: {title}")

print(f"\n--- Synced {count} new, skipped {skipped} existing")
