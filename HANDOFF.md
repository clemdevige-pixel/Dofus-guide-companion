# HANDOFF — Dofus Guide Companion

Date: 2026-09-03

## 1. Contexte

Projet : **Dofus Guide Companion**
Repo : `clemdevige-pixel/Dofus-guide-companion`
Branche active : `agent/initial-scaffold`
PR active : `#1 — Initial Tauri + React companion scaffold`

Objectif produit : companion desktop léger, always-on-top, permettant de suivre la roadmap Dofus Astrub → Dofus Sylvestre sous forme d’overlay compact, sans naviguer dans le Google Sheet.

Le Google Sheet reste la source éditoriale. L’app consomme uniquement `data/route.json` comme vérité runtime.

Avant toute modification, lire dans cet ordre :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `HANDOFF.md`

## 2. Décisions produit validées

- Stack : **Tauri 2 + React + TypeScript + Vite**
- largeur compacte par défaut : **380 px**
- fenêtre librement redimensionnable
- always-on-top en V1
- click-through : **V1.1**, pas en V1
- raccourcis globaux configurables en V1
- pipeline : **Google Sheet → exporteur TypeScript → validation stricte → `data/route.json`**
- aucun OCR, lecture mémoire, injection ou automatisation de Dofus en V1
- aucune logique spécifique à une quête hardcodée dans React
- une seule vérité de progression : `completedStepIds`
- l’étape consultée est persistée par **STEP_ID stable**, jamais par numéro de ligne ou index métier

## 3. État réel du pipeline data — TERMINÉ

Spreadsheet : `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`
ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`
Onglet : `ROUTE`

Colonnes techniques présentes :
- K `STEP_ID`
- L `GOAL_ID`
- M `GOAL_PHASE`

État validé :
- **21 blocs**
- **957 étapes runtime**
- aucun `STEP_ID` manquant ou dupliqué
- fils rouges structurés via `GOAL_ID / GOAL_PHASE`
- hard locks structurés dans le JSON
- liens DofusPourLesNoobs récupérés depuis les formules `HYPERLINK`
- `PRÉPA` converties en `preparationItems` quand possible
- TYPE inconnu = erreur d’export
- relations de goals incohérentes = erreur de validation

`scripts/export-route.ts` existe et produit le vrai `data/route.json`.

Le mock runtime a été supprimé : `data/route.json` est la seule route consommée par le front.

## 4. État du code applicatif

Déjà présent sur `agent/initial-scaffold` :

- Tauri 2
- React + TypeScript + Vite
- fenêtre always-on-top
- overlay compact / détaillé
- navigation précédent / suivant / valider-dévalider
- drawer secondaire
- types de domaine `src/route/types.ts`
- loader `data/route.json`
- validation stricte du `RouteDocument`
- selectors : progression, première étape incomplète, fils rouges actifs, prochain verrou dur
- persistance locale des `completedStepIds`
- persistance du mode compact
- persistance de l’étape actuellement consultée via `currentStepId`
- persistance taille + position fenêtre via `src/window/persistence.ts`
- restauration de géométrie câblée dans `App.tsx`
- raccourcis globaux Tauri configurables et persistés
- détection de conflits de raccourcis
- raccourci afficher / masquer l’overlay
- CI frontend + Tauri Windows

## 5. Raccourcis globaux actuels

Actions supportées :
- étape précédente
- étape suivante
- valider / dévalider
- afficher / masquer l’overlay

Bindings par défaut définis dans `src/shortcuts/types.ts`.

Ne pas créer un second système de raccourcis. Toute évolution passe par `src/shortcuts/*`.

## 6. Persistance

Progression : `src/progress/storage.ts`

État persistant actuel :
- `completedStepIds`
- `compact`
- `currentStepId`

Géométrie fenêtre : `src/window/persistence.ts`

État persistant :
- x
- y
- width
- height

Règle : utiliser les IDs stables de route, jamais un index persistant comme identité métier.

## 7. UX cible V1

### Mode compact
- index / total
- type
- nom étape
- lien DPLN
- action
- instruction courte
- précédent / valider / suivant

### Mode détaillé
Ajoute :
- bloc courant
- fils rouges actifs
- prochain verrou dur
- préparation utile
- drawer secondaire

Drawer prévu :
- Progression
- Fils rouges
- Prochain verrou
- Prépa du bloc
- Historique
- Paramètres

Important : plusieurs boutons du drawer sont encore des placeholders visuels et ne disposent pas encore de vues fonctionnelles dédiées.

## 8. Prochain chantier exact

Le pipeline data étant terminé et la persistance/hotkeys déjà largement posées, la priorité passe maintenant à la **validation fonctionnelle du companion réel sur les 957 étapes**.

Ordre recommandé :

### A — Fermer la persistance V1

Vérifier manuellement sous Tauri Windows :
1. naviguer vers une étape éloignée
2. fermer / relancer
3. vérifier reprise sur le même `currentStepId`
4. vérifier `completedStepIds`
5. vérifier mode compact
6. déplacer / resize la fenêtre
7. fermer / relancer
8. vérifier restauration taille + position

### B — Valider les raccourcis globaux sous Windows / Dofus

Tester :
- précédent
- suivant
- valider / dévalider
- afficher / masquer
- reconfiguration depuis Paramètres
- conflit de bindings
- comportement quand Dofus a le focus

### C — Rendre le drawer fonctionnel sans dupliquer les données

Implémenter les vues via selectors dérivés de la route + `completedStepIds` :
- Progression
- Fils rouges
- Prochain verrou
- Prépa du bloc
- Historique

Aucune nouvelle source de vérité locale pour ces vues.

### D — Audit runtime du vrai `route.json`

Tester des checkpoints représentatifs :
- début de route
- FIL ROUGE start/progress/finish
- hard lock avec goal
- hard lock sans goal
- PRÉPA multi-items
- REPRISE
- fin de route

### E — Polish UI seulement après validation fonctionnelle

Ne pas partir dans une refonte graphique avant validation des flux réels en jeu.

## 9. Points de vigilance

- ne jamais parser les titres pour reconstruire de la logique métier
- ne jamais ajouter une route mock parallèle
- ne jamais persister un index comme identité de progression
- ne jamais recalculer les fils rouges depuis du texte
- éviter tout store global supplémentaire sans besoin démontré
- modifier le minimum nécessaire
- conserver l’architecture data-driven

## 10. CI / validation

Avant merge de la PR :
- `pnpm build` vert
- Tauri Windows `cargo check` vert
- `pnpm tauri dev` validé manuellement sous Windows
- reprise de progression validée après restart
- taille + position restaurées
- always-on-top validé avec Dofus
- raccourcis globaux validés avec Dofus au premier plan
- rendu 380 px + resize libre validés

## 11. État PR

PR #1 reste en draft tant que la validation Windows réelle n’est pas terminée.

Le prochain agent ne doit pas recommencer l’exporteur ou les hotkeys : il doit repartir de l’existant, vérifier les flux réels et compléter seulement les trous fonctionnels restants.
