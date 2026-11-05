#!/usr/bin/env python3
"""Import 19 transparent Dofus class portraits locally for the offline overlay."""
from pathlib import Path
from urllib.request import urlopen

IDS = list(range(1, 19)) + [20]
base = 'https://raw.githubusercontent.com/bilalsaaoud/dofus-stuff-builder/main/images/classes'
target = Path(__file__).resolve().parents[1] / 'public' / 'classes'
target.mkdir(parents=True, exist_ok=True)
for class_id in IDS:
    data = urlopen(f'{base}/{class_id}.png', timeout=30).read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise RuntimeError(f'Expected PNG for {class_id}')
    (target / f'{class_id}.png').write_bytes(data)
    print(f'Class {class_id}: {len(data)} bytes')
