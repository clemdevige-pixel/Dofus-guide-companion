# ROUTE OPTIMIZATION WORKFLOW — Procédure de maintenance

Ce document ne décrit plus un chantier global en cours. La route est certifiée sur son scope actuel.

Utiliser cette procédure uniquement lorsqu’un **défaut concret** oblige à rouvrir une portion de route.

## 1. Avant toute modification

Lire :
1. `AGENTS.md` ;
2. `SPEC.md` ;
3. `ARCHITECTURE.md` ;
4. `docs/DATA_MODEL.md` ;
5. `docs/ROUTE_OPTIMIZATION.md` ;
6. `HANDOFF.md`.

Identifier précisément :
- l’étape fautive ;
- le paquet de quêtes impacté ;
- le gain ou bug réel ;
- la source factuelle qui justifie la correction.

Ne jamais rouvrir toute la route par intuition.

## 2. Sources

Ordre de priorité :
1. `ROUTE` = scope + état intégré ;
2. Ganymède = ordre relatif / fenêtres / opportunités de mutualisation ;
3. DofusPourLesNoobs = faits de quête ;
4. anciens audits = historique uniquement.

Une différence avec Ganymède n’est pas automatiquement une erreur.

## 3. Travailler par paquet indivisible

Ne pas déplacer seulement 2–3 lignes d’une chaîne imbriquée.

Un paquet doit couvrir toutes les dépendances nécessaires pour éviter :
- prise dupliquée ;
- rendu trop tôt ;
- donjon présent à deux endroits ;
- `STEP_ID` réaffecté ;
- quête active invisible ;
- transition perdue ;
- `MOMENT_ID` cassé.

Workflow :

```text
cartographier
→ vérifier
→ modifier le Sheet
→ relire mécaniquement
→ relire comme un joueur
→ exporter
→ tester
```

## 4. Cartographie obligatoire

Avant écriture :
- relever les `STEP_ID` ;
- relever `MOMENT_ID / DISPLAY_ROLE` ;
- relever goals / groupes parallèles ;
- lister prises, checkpoints, donjons, rendus, suites ;
- vérifier prérequis réels ;
- vérifier positions/lancements ;
- vérifier si plusieurs lignes forment un seul moment joueur ;
- identifier les informations qui doivent rester visibles.

## 5. Règles de structure

### `STEP_ID`
Stable tant que l’événement métier reste le même.

### `MOMENT_ID`
Carte multi-step explicite.

### `DISPLAY_ROLE`
- `OBJECTIVE` = checkbox ;
- `TRANSITION` = action intermédiaire ;
- `DETAIL` = information rattachée.

Le premier membre d’un moment est toujours `OBJECTIVE`.

Maximum 5 objectifs par carte.

### `PARALLEL_ID / PARALLEL_PHASE`
Uniquement pour des quêtes réellement gardées actives ensemble.

### `GOAL_ID / GOAL_PHASE`
Lifecycle des fils rouges.

## 6. Nettoyage joueur

Pendant toute correction, supprimer les redondances créées ou révélées :
- commentaires internes ;
- titre qui répète l’action ;
- suffixe “PASSAGE #N” côté joueur ;
- répétition de la carte précédente ;
- carte administrative absorbable ;
- warning qui explique notre construction au lieu d’aider le joueur.

Conserver :
- STOP ;
- transition nécessaire ;
- capture/item/condition critique ;
- interaction avant sortie ;
- position utile.

Le détail fin reste sur DPLN.

## 7. Prérequis / préparation / warnings

### `prerequisites`
Donnée d’audit/validation, non affichée dans les cartes.

### `PRÉPA`
Ressources/conditions pré-farmables réellement actionnables avant consommation.

### `warning`
Uniquement information critique joueur.

Convention :

```text
⚠ AVANT DE SORTIR DU DONJON — ...
```

seulement si l’oubli peut forcer un nouveau passage ou bloquer la progression.

## 8. Lancement / déplacement

- `POSITION` = lancement/prise ;
- `LANCEMENT` = méthode si pas de coordonnée unique ;
- `LANCEMENT_REQUIS=TRUE` = vraie prise ;
- `DESTINATION` = prochain lieu utile ;
- `GUIDE_ITEMS` = actions structurées courtes.

Ne jamais utiliser `POSITION` comme destination.

## 9. Dofus / Alignement / Donjon

Les marqueurs UI sont data-driven :
- Alignement par `type` ;
- Donjon par `type` ;
- Dofus par `DOFUS_SERIES` → `dofusSeries`.

Si une correction touche une chaîne Dofus, maintenir la colonne `DOFUS_SERIES` cohérente.

## 10. Écriture Sheet

Après toute écriture importante :
- rechercher `#ERROR!` ;
- relire les colonnes techniques jusqu’à `DOFUS_SERIES` ;
- vider les anciennes valeurs techniques résiduelles ;
- rechercher les lignes par `STEP_ID`, pas par ancien numéro physique ;
- vérifier qu’aucune formule temporaire/audit ne reste dans `ROUTE`.

## 11. Contrôle du paquet

Avant export :
- `STEP_ID` uniques ;
- ordre cohérent ;
- lancement correct ;
- positions/destinations correctes ;
- moment contigu ;
- display roles cohérents ;
- lifecycle goals/parallèles valide ;
- aucune double prise ;
- aucun donjon déplacé partiellement ;
- aucune redondance joueur nouvelle ;
- Dofus series cohérente si concernée.

## 12. Export et validation

Flux obligatoire :

```text
pnpm export:route
pnpm test:route
pnpm validate:route
pnpm build
```

Check Tauri si l’environnement le permet.

Sous PowerShell Windows, utiliser `pnpm.cmd` si `pnpm.ps1` est bloqué.

## 13. Anti-régression

Si le bug est généralisable, ajouter ou adapter un test.

Les tests doivent protéger le **contrat**, pas devenir une seconde vérité métier codée par noms de quêtes sauf lorsqu’ils protègent explicitement une dépendance certifiée sensible.

Les lints éditoriaux qui dépendent des titres doivent auditer la donnée brute avant normalisation UI.

## 14. Certification après correction

Ne pas annoncer “route 100% certifiée” après une correction locale sans contrôle adapté.

Après modification :
- certifier le paquet réellement impacté ;
- vérifier les dépendances amont/aval ;
- repasser tous les tests ;
- ne rouvrir une certification globale que si le défaut remet réellement en cause l’ensemble.

## 15. Fin de chantier

Mettre à jour `HANDOFF.md` uniquement si la correction change :
- état réel des tests ;
- contrat produit/data ;
- statut de synchronisation Sheet/JSON ;
- tâches restantes avant release.

Ne pas créer un nouveau handoff parallèle : **`HANDOFF.md` est l’unique handoff opérationnel**.
