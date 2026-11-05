#!/usr/bin/env python3
"""Install transparent DOFUS item art from a pinned dofus-sqlite release."""
import sqlite3
import tempfile
import urllib.request
import zipfile
from pathlib import Path

TAG = 'v6.0_3.7.12.12'
BASE = f'https://github.com/ledouxm/dofus-sqlite/releases/download/{TAG}'
ART = {
    'Dofus Argenté': 'argente',
    'Dofus Émeraude': 'emeraude',
    'Dofus Pourpre': 'pourpre',
    'Domakuro': 'domakuro',
    'Dorigami': 'dorigami',
    'Dofus Turquoise': 'turquoise',
    'Dofus des Glaces': 'glaces',
    'Dofus Ocre': 'ocre',
    'Dofus Ivoire': 'ivoire',
    'Dofus Tacheté': 'tachete',
    'Dofus Ébène': 'ebene',
    'Dofus Argenté Scintillant': 'argente-scintillant',
    'Dofus Sylvestre': 'sylvestre',
}

def main():
    dest = Path(__file__).resolve().parents[1] / 'public' / 'dofus'
    dest.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='dofus-art-') as tmp:
        db = Path(tmp) / 'dofus.sqlite'
        icons = Path(tmp) / 'images-item.zip'
        for path in (db, icons):
            print(f'Downloading {path.name} from {TAG}...', flush=True)
            urllib.request.urlretrieve(BASE + '/' + path.name, path)
        conn = sqlite3.connect(db)
        sql = """SELECT i.iconId, t.value FROM ItemData i
                 JOIN translations t ON t.id=i.nameId
                 WHERE t.lang='fr' AND t.value=? AND i.iconId IS NOT NULL"""
        with zipfile.ZipFile(icons) as archive:
            available = set(archive.namelist())
            for name, slug in ART.items():
                rows = conn.execute(sql, (name,)).fetchall()
                candidates = sorted(set(int(row[0]) for row in rows))
                selected = next((f'2x/{icon_id}.png' for icon_id in candidates
                                 if f'2x/{icon_id}.png' in available), None)
                if not selected:
                    print(f'WARNING: PNG unavailable for {name}: iconIds={candidates}')
                    continue
                data = archive.read(selected)
                if data[:8] != b'\x89PNG\r\n\x1a\n':
                    raise ValueError(f'Not a PNG: {selected}')
                if data[25] not in (4, 6) and b'tRNS' not in data:
                    print(f'WARNING: image may lack transparency: {name}')
                (dest / f'{slug}.png').write_bytes(data)
                print(f'{name}: {selected} -> {slug}.png ({len(data)} bytes)')
    print('Done')

if __name__ == '__main__':
    main()
