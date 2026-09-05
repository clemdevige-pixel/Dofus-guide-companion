# HANDOFF — Dofus Guide Companion

Date : 2026-09-05

## TL;DR

Branche active : `agent/initial-scaffold`.

Le chantier route structurel est **terminé** : mutualisations, densité, `MOMENT_ID`, `DISPLAY_ROLE`, groupes parallèles, ressources Ivoire → Sylvestre et nettoyage éditorial principal ont déjà été intégrés puis synchronisés dans `data/route.json`.

Ne pas reprendre les anciennes consignes « continuer Ivoire / Ébène » ou « poursuivre la passe anti-redondance » : elles sont obsolètes.

Le prochain axe pertinent est la **robustesse produit V1** et la maintenance de la documentation, pas une nouvelle réécriture globale de la route sans bug concret observé.

## 1. Sources de vérité

Projet : **Dofus Guide Companion**  
Repo : `clemdevige-pixel/Dofus-guide-companion`  
Branche : `agent/initial-scaffold`

Source éditoriale : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`.  
Runtime : `data/route.json`, généré depuis le Sheet.

Ordre de lecture obligatoire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md` si chantier route
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` si audit/réécriture route
7. `HANDOFF.md`

## 2. Contrat data/UI actuel

- `STEP_ID` = identité stable d'une étape technique ;
- `MOMENT_ID` = frontière autoritaire d'une carte multi-step ;
- une ligne sans `MOMENT_ID` = carte autonome ;
- `DISPLAY_ROLE` = `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- premier membre d'un moment = `OBJECTIVE` ;
- maximum 5 `OBJECTIVE` par carte ;
- `PARALLEL_ID / PARALLEL_PHASE` = lifecycle `start → progress* → finish` des vraies salves de quêtes conjointes ;
- le rappel parallèle n'est visible que sur une carte appartenant au groupe ;
- `completedStepIds` = unique vérité de progression ;
- aucune heuristique métier ne doit être reconstruite depuis les titres ou instructions.

## 3. État fonctionnel actuel

Déjà intégré :
- overlay Tauri always-on-top, redimensionnable ;
- taille et position de fenêtre persistées ;
- progression locale persistée ;
- reprise sur la position de consultation sauvegardée ;
- navigation précédent / suivant ;
- navigation directe par numéro de carte ;
- mode compact / détaillé ;
- drawer secondaire ;
- raccourcis globaux configurables avec retour d'erreur ;
- liens DPLN ouverts dans le navigateur système ;
- cartes mutualisées depuis `MOMENT_ID` ;
- checkbox / transition / détail depuis `DISPLAY_ROLE` ;
- hard locks sans auto-advance ;
- fils rouges dérivés des données ;
- rappels de groupes parallèles limités au contexte de la carte visible ;
- validation d'une séquence sans saut de +2 cartes.

## 4. État route

La route actuelle est considérée **structurellement close** tant qu'un défaut joueur concret n'est pas observé.

Les passes suivantes ont déjà été faites :
- linéarisation ;
- mutualisations donjons/quêtes ;
- `TERMINER + LANCER` ;
- chaînes Emma / Alain / Thelma / Anne / Lorie / Tour ;
- densité des longues cartes ;
- anti-redondance globale ;
- 24 groupes parallèles ;
- audit ressources tardives jusqu'à Sylvestre ;
- vérification des quantités cumulées sur les corrections détectées ;
- nettoyage de plusieurs titres pseudo-meta ;
- synchronisation runtime récente.

Dernier snapshot runtime attendu après le push `chore(route): sync final UX title cleanup` :
- 20 blocs ;
- 993 étapes techniques ;
- 363 cartes environ après mutualisation ;
- 24 groupes parallèles ;
- une unique `FIN` finale.

Note : des renommages purement éditoriaux du Sheet peuvent ponctuellement remettre le Sheet légèrement en avance sur le runtime. Toujours vérifier avant d'annoncer une synchronisation parfaite.

## 5. CI / qualité

Sur le dernier état poussé contrôlé :
- `pnpm test:route` ✅
- `pnpm validate:route` ✅
- `pnpm build` ✅
- `cargo check --manifest-path src-tauri/Cargo.toml` ✅

Le workflow CI exécute automatiquement les quatre contrôles frontend/route + Tauri Windows sur les branches `agent/**`.

## 6. Priorité actuelle

Le prochain chantier pertinent est **robustesse produit V1** :

1. éviter qu'une exception React rende l'overlay totalement vide ;
2. auditer les chemins de chargement/persistance pour vérifier qu'une donnée locale corrompue ne casse pas l'app ;
3. vérifier la résilience des raccourcis globaux et de la restauration de fenêtre ;
4. ajouter les tests ciblés uniquement lorsqu'un risque réel est identifié ;
5. maintenir la doc synchronisée avec le code.

Ne pas relancer une passe massive de densité ou de mutualisation sans exemple joueur précis démontrant une régression.

## 7. Flux route officiel

```text
Google Sheet ROUTE (A:V)
    ↓
pnpm export:route
    ↓
validation stricte
    ↓
data/route.json
```

`data/route.json` est un artefact généré. Ne pas le corriger à la main comme source éditoriale.

## 8. Garde-fous

- pas de logique spécifique par nom de quête dans React ;
- pas de parsing métier depuis les textes ;
- pas de seconde vérité de progression ;
- pas de regroupement automatique sans `MOMENT_ID` ;
- pas de `DISPLAY_ROLE` hors `MOMENT_ID` ;
- pas de plus de 5 objectifs par carte ;
- pas de rappel parallèle hors checkpoint du groupe ;
- pas de faux hard lock de niveau personnage ;
- pas d'invention de PNJ, coordonnées, prérequis ou ressources ;
- ne pas reprendre un chantier marqué obsolète dans un ancien handoff sans comparer au repo actuel.
