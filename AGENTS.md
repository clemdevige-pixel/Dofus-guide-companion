# AGENTS.md — Dofus Guide Companion

Ce fichier est le contrat de travail des agents qui interviennent sur ce repo.

## 1. Lire avant de coder

Toujours lire, dans cet ordre :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md` pour tout chantier route
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` pour toute passe d'audit/réécriture
7. `HANDOFF.md`

Ne pas coder depuis une supposition si la doc ou la donnée existante permet de trancher.

## 2. Principes non négociables

- Architecture simple, locale et data-driven.
- Le Google Sheet est la source éditoriale ; l'app consomme `data/route.json`.
- Aucune logique spécifique à une quête dans React.
- Ne jamais parser du texte d'affichage pour déduire un comportement métier.
- Une seule vérité de progression : `completedStepIds`.
- `STEP_ID` stable et indépendant des lignes Sheet.
- `MOMENT_ID` explicite pour les moments joueur devant former une seule carte.
- Réutiliser l'existant avant de créer une couche.
- Toute réécriture complexe se fait par paquet indivisible.
- Après linéarisation locale, exécuter aussi des passes globales sur toute la route.

## 3. Interdictions explicites

Interdit :

```ts
if (step.title === "L'éternelle moisson") { ... }
```

Interdit également :
- numéro de ligne Sheet comme identité métier ;
- progression dupliquée dans plusieurs stores ;
- route mock parallèle ;
- override manuel de goals/positions/moments ;
- OCR, lecture mémoire, injection ou automatisation Dofus ;
- importer GP0 sans filtrer le scope ;
- considérer une même carte/donjon comme preuve suffisante de mutualisation ;
- réutiliser un `STEP_ID` pour un autre événement métier ;
- utiliser `POSITION` comme destination ;
- corriger `data/route.json` à la main ;
- considérer une cellule technique vidée parce qu'elle a été omise d'un `updateCells` ;
- créer un `VERROU DUR` uniquement parce qu'un niveau personnage est recommandé/minimum ;
- compter sur le fallback de regroupement automatique pour un moment éditorial connu : utiliser `MOMENT_ID`.

## 4. Stack V1

- Tauri 2
- React
- TypeScript
- Vite
- CSS simple
- persistance locale

## 5. État et sélecteurs

La progression réelle repose sur `completedStepIds`.

Doivent rester dérivés :
- progression ;
- première étape non validée ;
- fils rouges actifs ;
- prochain verrou dur ;
- bloc courant ;
- groupes/cartes visibles.

`getStepGroups()` respecte en priorité `MOMENT_ID`. Les séquences automatiques ne sont qu'un fallback pour les étapes ordinaires sans moment explicite.

## 6. UI

Priorités : lisibilité, faible encombrement, navigation immédiate, resize fiable.

Une carte représente un **moment joueur**, pas nécessairement une ligne Sheet.

Ne jamais reconstruire les cartes depuis des mots présents dans `title` ou `instruction`.

## 7. Export de route

Flux :

```text
Google Sheet → scripts/export-route.ts → validation stricte → data/route.json
```

L'export/validation doit échouer sur :
- type/ID/block invalide ;
- relations de goal incohérentes ;
- lancement incomplet ;
- position/destination invalide ;
- `MOMENT_ID` vide, non contigu ou multi-blocs ;
- `VERROU DUR` de niveau personnage ;
- route sans une unique `FIN` finale.

## 8. Méthode de chantier route

Pour chaque paquet :
1. lire l'existant ;
2. identifier la source de vérité ;
3. cartographier le moment complet ;
4. vérifier prérequis/coexistence ;
5. décider `STEP_ID` et `MOMENT_ID` avant écriture ;
6. écrire en une passe ;
7. relire les colonnes techniques jusqu'à `MOMENT_ID` ;
8. nettoyer les résidus ;
9. contrôler mécaniquement.

Après les paquets/blocs, exécuter les passes globales définies dans `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` : faux verrous, transitions `TERMINER + LANCER`, donjon→reprise→suite, chaînes répétitives, goals/hard locks, continuité finale.

## 9. Qualité

Avant de considérer un chantier intégré :

```bash
pnpm export:route
pnpm test:route
pnpm validate:route
pnpm build
```

Le check Tauri est aussi requis lorsque l'environnement le permet.

Ne pas annoncer un export/validation vert si `data/route.json` n'a pas réellement été régénéré après les dernières modifications Sheet.

## 10. Règle de documentation

Mettre à jour la doc lorsque le contrat produit, data, validation, regroupement de cartes ou méthodologie change.

Un handoff doit indiquer précisément :
- ce qui est déjà intégré ;
- ce qui reste à auditer ;
- si le Sheet et `route.json` sont synchronisés ou non ;
- état réel des tests/validation/build.