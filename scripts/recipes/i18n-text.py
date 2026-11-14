#!/usr/bin/env python3
"""Turns a plain-text translation draft into data/recipes/i18n/<lang>/<name>.json.

    python3 scripts/recipes/i18n-text.py <lang> <name> < draft.txt

The draft has one block per recipe:

    ## recipe-id | Name | Description
    - first step
    - second step
"""
import json, sys

lang, name = sys.argv[1], sys.argv[2]
out, cur = {}, None
for line in sys.stdin.read().splitlines():
    line = line.strip()
    if line.startswith('## '):
        rid, title, desc = [p.strip() for p in line[3:].split(' | ')]
        cur = out[rid] = {'name': title, 'description': desc, 'instructions': []}
    elif line.startswith('- '):
        cur['instructions'].append(line[2:].strip())
    elif line:
        sys.exit(f'cannot read: {line}')
path = f'data/recipes/i18n/{lang}/{name}.json'
json.dump(out, open(path, 'w'), ensure_ascii=False, indent=1)
print(f'{path}: {len(out)} recipes')
