import json, re
from collections import Counter
from pathlib import Path

dirs = [
    '/root/.hermes/profiles/dev/home/.claude/projects/-root-NotToDo',
    '/root/.hermes/profiles/dev/home/.claude/projects/-root-hermes-config-history',
]
files = []
for d in dirs:
    p = Path(d)
    if p.exists():
        files.extend(sorted(p.glob('*.jsonl'), key=lambda f: f.stat().st_mtime, reverse=True)[:50])

counts = Counter()
for f in files:
    for line in f.read_text(errors='ignore').splitlines():
        try:
            obj = json.loads(line)
        except Exception:
            continue
        msg = obj.get('message', obj)
        if msg.get('role') != 'assistant':
            continue
        for block in msg.get('content', []):
            if not isinstance(block, dict) or block.get('type') != 'tool_use':
                continue
            name = block.get('name', '')
            inp = block.get('input', {})
            if name == 'Bash':
                cmd = inp.get('command', '')
                cmd = re.sub(r'^(\w+=\S+\s+)+', '', cmd.strip())
                tokens = cmd.split()
                if not tokens:
                    continue
                t0 = tokens[0]
                if t0 in ('timeout', 'sudo', 'time') and len(tokens) > 1:
                    tokens = tokens[1:]
                    t0 = tokens[0]
                if t0 in ('git', 'gh', 'docker', 'kubectl', 'bun', 'npm', 'yarn', 'pnpm') and len(tokens) > 1:
                    key = t0 + ' ' + tokens[1]
                else:
                    key = t0
                counts[key] += 1
            elif name.startswith('mcp__'):
                counts[name] += 1

for cmd, cnt in counts.most_common(40):
    print(f'{cnt:4d}  {cmd}')
