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
- les positions de prise de quête sont des données structurées, jamais extraites du texte dans React

## 3. Pipeline data

Spreadsheet : `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`
ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`
Onglet : `ROUTE`

Colonnes techniques :
- K `STEP_ID`
- L `GOAL_ID`
- M `GOAL_PHASE`
- N `POSITION`

État structurel :
- **21 blocs**
- **957 étapes runtime**
- aucun `STEP_ID` manquant ou dupliqué
- hard locks structurés dans le JSON
- liens DofusPourLesNoobs récupérés depuis les formules `HYPERLINK`
- `PRÉPA` converties en `preparationItems` quand possible
- positions de prise de quête exportées en `location: { x, y }`
- TYPE inconnu = erreur d’export
- POSITION invalide = erreur d’export
- relations de goals incohérentes = erreur de validation

`scripts/export-route.ts` produit `data/route.json` depuis `ROUTE!A5:N1004`.

Le mock runtime a été supprimé : `data/route.json` est la seule route consommée par le front.

### Audit fils rouges du 2026-09-03

L’audit a détecté 7 chaînes éditorialement marquées `FIL ROUGE` mais sans métadonnées structurées :

- `combat-de-rue`
- `benediction-viti`
- `benediction-thomahon`
- `benediction-foluk`
- `rescapes-village-enseveli`
- `mission-solution`
- `vie-de-chateau`

Les phases `start / progress / finish` ont été ajoutées dans le Sheet source **et synchronisées dans `data/route.json`**.

Le runtime GitHub est donc désormais aligné avec le Sheet pour ces chaînes. Aucun override, fichier parallèle ou second système de goals n’a été conservé.

L’exporteur refuse désormais toute action contenant explicitement `FIL ROUGE` sans `GOAL_ID / GOAL_PHASE` afin d’éviter cette régression.

### Audit positions du 2026-09-03

Les actions de prise de quête sont normalisées dans la route via `LANCER*`. L’audit a identifié **28 prises de quête**.

Les 28 positions ont été ajoutées dans la colonne technique `POSITION` et synchronisées dans `data/route.json` sous forme structurée `location: { x, y }`.

Aucune coordonnée n’est parsée depuis `title`, `action` ou `instruction` côté React.

## 4. État applicatif actuel

Présent sur `agent/initial-scaffold` :

- Tauri 2
- React + TypeScript + Vite
- fenêtre always-on-top
- overlay compact / détaillé
- navigation précédent / suivant / valider-dévalider
- **bloc courant toujours visible**, en compact comme en détaillé, avec `Bloc n / 21`
- types de domaine `src/route/types.ts`
- loader `data/route.json`
- validation stricte du `RouteDocument`
- selectors : progression, première étape incomplète, fils rouges actifs, prochain verrou dur, verrou associé à un goal, prépa du bloc, étapes validées
- persistance locale des `completedStepIds`
- persistance du mode compact
- persistance de l’étape consultée via `currentStepId`
- persistance taille + position fenêtre via `src/window/persistence.ts`
- restauration de géométrie câblée dans `App.tsx`
- raccourcis globaux Tauri configurables et persistés
- détection de conflits de raccourcis
- raccourci afficher / masquer l’overlay
- drawer fonctionnel : Progression / Fils rouges / Prochain verrou / Prépa du bloc / Étapes validées / Paramètres
- rendu `PRÉPA` depuis `preparationItems`
- **chaque item de PRÉPA est cliquable et copie uniquement le nom de ressource** via le plugin Tauri clipboard officiel
- une étape possédant `location` affiche `[x,y]` ; le clic copie `/travel x y`
- rendu du contexte fil rouge depuis `longRunningGoal`, indépendamment du `type` de l’étape
- aucun message « Pas besoin de finir maintenant » sur une phase `finish`
- rendu `VERROU DUR` depuis `hardLock`
- validation d’un `VERROU DUR` n’auto-avance plus vers l’étape suivante
- CI frontend + Tauri Windows

## 5. Audit / garde-fous ajoutés

### Validation runtime

`src/route/validation.ts` contrôle désormais :
- document non vide
- IDs / titres non vides
- ordres de blocs strictement continus
- ordres d’étapes strictement continus
- IDs uniques
- `blockId` connus
- types supportés
- URLs http/https valides
- coordonnées `location.x / location.y` entières
- PRÉPA avec `preparationItems` ou instruction exploitable
- VERROU DUR avec message structuré
- lifecycle de goal **dans l’ordre réel** : `start → progress → finish`
- hard lock lié uniquement à un goal déjà démarré
- exactement une étape `FIN`
- `FIN` obligatoirement dernière

### Selector fils rouges

`getActiveLongRunningGoals` n’ouvre plus un goal sur un `progress` validé isolément. Seul un `start` validé peut ouvrir le goal ; `progress` ne met à jour qu’un goal déjà actif ; `finish` ou hard lock validé le ferme.

Les goals ne sont volontairement pas contraints à avoir tous un `finish` : certaines chaînes sont conçues pour se fermer sur leur `hardLock` associé.

### Vue « Étapes validées »

L’ancienne appellation `Historique` était trompeuse : avec la vérité unique actuelle `completedStepIds`, l’app ne possède pas de timestamp de validation et ne peut donc pas reconstruire une chronologie réelle.

La vue est maintenant correctement nommée **Étapes validées**. Ne pas ajouter de second état persistant uniquement pour recréer un historique tant qu’un besoin produit réel n’est pas validé.

### Tests

Tests ciblés avec le runner natif Node, sans framework supplémentaire :
- `src/route/selectors.test.ts`
- `src/route/validation.test.ts`
- `src/progress/storage.test.ts`

Le test de persistance vérifie un round-trip complet `saveProgress → loadProgress` pour :
- `completedStepIds`
- `compact`
- `currentStepId`

Commandes :
- `pnpm test:route`
- `pnpm validate:route`

La CI frontend exécute :
1. `pnpm test:route`
2. `pnpm validate:route`
3. `pnpm build`

## 6. Raccourcis globaux

Actions supportées :
- étape précédente
- étape suivante
- valider / dévalider
- afficher / masquer l’overlay

Bindings par défaut dans `src/shortcuts/types.ts`.

Ne pas créer un second système de raccourcis. Toute évolution passe par `src/shortcuts/*`.

## 7. Persistance

Progression : `src/progress/storage.ts`

État persistant :
- `completedStepIds`
- `compact`
- `currentStepId`

La sauvegarde est écrite dans le `localStorage` de la WebView à chaque changement. Le contrat logiciel couvre donc une fermeture/réouverture normale de l’application sur le même profil applicatif. Il ne couvre pas une suppression manuelle des données WebView, une désinstallation avec purge des données ou une corruption externe du profil.

Géométrie fenêtre : `src/window/persistence.ts`

État persistant :
- x
- y
- width
- height

Règle : utiliser les IDs stables de route, jamais un index persistant comme identité métier.

## 8. UX V1 — état réel

### Mode compact
- index / total
- type
- **bloc courant**
- nom étape
- lien DPLN
- action
- position `[x,y]` si disponible, cliquable → `/travel x y`
- instruction courte
- précédent / valider / suivant
- PRÉPA longue scrollable
- items PRÉPA cliquables → copie du nom de ressource

### Mode détaillé
Ajoute :
- fils rouges actifs
- prochain verrou dur
- surfaces drawer

### Drawer
Fonctionnel :
- Progression
- Fils rouges
- Prochain verrou
- Prépa du bloc
- Étapes validées
- Paramètres

Une seule surface drawer est ouverte à la fois. Ces vues sont dérivées de `route + completedStepIds`, sans nouveau store.

### Types spéciaux

`PRÉPA` : liste structurée issue de `preparationItems`, items cliquables pour copie presse-papier.

Goal / `FIL ROUGE` : message non bloquant dérivé de `longRunningGoal` + verrou associé si un `hardLock.goalId` correspondant existe. Le comportement ne dépend pas de `type === 'long_running'`.

`VERROU DUR` : message structuré via `hardLock.message`; la validation ne déclenche pas d’auto-avance. La navigation manuelle reste possible pour consulter la suite.

## 9. Prochain chantier exact

La synchronisation Sheet → runtime, l’audit structurel des goals et les optimisations de suivi demandées sont implémentés.

### A — PRIORITÉ : validation réelle sous Tauri Windows

1. `git pull`
2. `pnpm install`
3. lancer `pnpm tauri dev`
4. tester clic sur une ressource PRÉPA → nom seul dans le presse-papier
5. tester affichage du bloc en compact et détaillé
6. tester une étape `LANCER` avec position → clic et vérifier `/travel x y`
7. naviguer vers une étape éloignée et valider plusieurs étapes
8. fermer complètement l’app
9. relancer
10. vérifier même `currentStepId`, validations et mode compact
11. déplacer / resize la fenêtre, fermer / relancer, vérifier restauration

### B — Validation raccourcis sous Windows / Dofus

Tester :
- précédent
- suivant
- valider / dévalider
- afficher / masquer
- reconfiguration depuis Paramètres
- conflit de bindings
- comportement quand Dofus a le focus

### C — Audit UX réel

Valider :
- 380 px
- resize libre
- always-on-top
- footer toujours accessible
- longues PRÉPA
- longs textes de verrou
- drawer sur petite fenêtre
- start / progress / finish sur des goals portés par `quest` ou `resume`, pas seulement `long_running`
- Étapes validées après validations/dévalidations

### D — Polish UI seulement ensuite

Ne pas lancer de refonte graphique avant validation fonctionnelle réelle.

## 10. Points de vigilance

- ne jamais parser les titres pour reconstruire de la logique métier runtime
- ne jamais parser les coordonnées depuis le texte dans React
- ne jamais ajouter une route mock parallèle
- ne jamais ajouter un fichier d’override pour les goals ou positions
- ne jamais persister un index comme identité de progression
- ne jamais recalculer les fils rouges depuis du texte dans React
- éviter tout store global supplémentaire sans besoin démontré
- modifier le minimum nécessaire
- conserver l’architecture data-driven

## 11. CI / validation avant merge

- `pnpm test:route` vert
- `pnpm validate:route` vert
- `pnpm build` vert
- Tauri Windows `cargo check` vert
- `pnpm tauri dev` validé manuellement sous Windows
- clic ressources / presse-papier validé
- positions `/travel` validées
- reprise de progression validée après restart
- taille + position restaurées
- always-on-top validé avec Dofus
- raccourcis globaux validés avec Dofus au premier plan
- rendu 380 px + resize libre validés
- audit des types spéciaux sur la vraie route effectué

## 12. État PR

PR #1 reste en draft tant que la validation Windows réelle n’est pas terminée.

Le prochain agent ne doit pas recommencer l’exporteur, la synchronisation des goals/positions, la persistance, les hotkeys ou le drawer : la priorité est maintenant la validation réelle de l’application sous Windows/Dofus et la correction minimale des écarts observés.
