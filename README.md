# Dofus Guide Companion

Companion desktop léger pour suivre une roadmap Dofus étape par étape en overlay pendant le jeu.

## Objectif V1

Afficher uniquement l'information utile à l'instant T :

- étape actuelle ;
- type d'étape ;
- action à effectuer ;
- instruction courte ;
- lien DofusPourLesNoobs ;
- navigation précédent / suivant ;
- validation de l'étape ;
- fils rouges actifs ;
- prochain verrou dur ;
- progression locale persistante.

## Source de vérité

La roadmap éditoriale reste le Google Sheet :

`Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`

L'application ne doit jamais dupliquer la logique des quêtes dans le code. La route est exportée vers un format de données versionné consommé par l'application.

```text
Google Sheet
    ↓ export / validation
route.json
    ↓
Dofus Guide Companion
```

## Stack visée

- Tauri
- React
- TypeScript
- Vite
- données JSON data-driven
- persistance locale

## Principes

- zéro logique de quête hardcodée dans l'UI ;
- aucune lecture mémoire de Dofus ;
- aucun OCR en V1 ;
- aucune automatisation d'input ;
- fonctionnement hors ligne après import des données ;
- l'overlay doit rester plus simple à utiliser que le Google Sheet.

Avant tout développement, lire `SPEC.md`, `ARCHITECTURE.md` et `docs/DATA_MODEL.md`.
