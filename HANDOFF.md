# HANDOFF — Dofus Guide Companion

Date : 2026-09-04

## 1. Contexte

Projet : **Dofus Guide Companion**  
Repo : `clemdevige-pixel/Dofus-guide-companion`  
Branche active : `agent/initial-scaffold`

Source éditoriale : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`.  
Runtime : `data/route.json`, généré depuis le Sheet.

Avant toute intervention lire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md`
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
7. `HANDOFF.md`

## 2. Contrat data actuel

- `STEP_ID` = identité stable d'une étape technique ;
- `MOMENT_ID` = unique frontière multi-step d'une carte ;
- une ligne sans `MOMENT_ID` = une carte autonome ;
- aucun regroupement automatique n'existe encore ;
- `DISPLAY_ROLE` est obligatoire dans un moment : `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- le premier membre d'un moment est toujours `OBJECTIVE` ;
- `OBJECTIVE` crée une checkbox ;
- `TRANSITION` / `DETAIL` se rattachent à l'objectif précédent ;
- `completedStepIds` reste l'unique vérité de progression.

## 3. État route

La passe globale anti-redondance / confort joueur a été réalisée sur toute la route.

État actuel du runtime synchronisé :
- **20 blocs** ;
- **986 étapes** ;
- **328 cartes explicites** ;
- **637 / 637** quêtes, reprises et fils rouges possèdent une source DPLN ;
- les grosses séries d'alignement restent volontairement de grandes cartes à checkboxes : ne pas les éclater juste pour réduire leur taille.

Les audits de cohérence ont notamment vérifié/corrigé :
- prérequis Émeraude / élevage ;
- Carte de Cania / Primatons ;
- Tablette de Totankama ;
- Le mal a dit ;
- post-Sylargh ;
- chaînes Otomaï / Moon / Wabbit / Valonia / Prologue / Enutrosor ;
- fin Sylvestre ;
- liens DPLN ;
- titres/instructions corrompus détectés pendant la passe.

## 4. Audit rendu UI effectué après la passe route

L'audit des 328 cartes a trouvé plusieurs défauts UI hérités de l'ancien système.

### 4.1 Transitions silencieuses

66 transitions n'avaient pas d'`instruction` propre. Comme le sélecteur retirait `action`, elles pouvaient devenir pratiquement invisibles dans une carte mutualisée.

Correction : `src/route/selectors.ts` fournit maintenant un fallback compact `action + title` uniquement pour une `TRANSITION` sans instruction explicite. Une instruction explicite reste prioritaire.

### 4.2 Objectif donjon mal titré

L'UI cherchait auparavant la première ligne « non-donjon » pour nommer une checkbox. Cela pouvait afficher une reprise de quête à la place du vrai donjon `OBJECTIVE`.

Correction : le premier step du bucket d'objectif est maintenant autoritaire, conformément à `DISPLAY_ROLE`.

### 4.3 Séquences non stylées

Les classes React `sequence-*` existaient sans CSS dédié.

Correction : checklist compacte ajoutée dans `src/styles.css`, avec scroll interne pour les longues séquences afin de conserver la navigation accessible en mode compact et détaillé.

### 4.4 Verrou dur dans une séquence

`L'Ombre et la proie` est actuellement le seul `hard_lock` appartenant à un moment mutualisé.

Correction déjà intégrée : cocher l'objectif contenant ce hard lock ne déclenche plus d'avance automatique vers la carte suivante.

Point à conserver : la consultation manuelle de la carte suivante reste autorisée ; seul l'auto-advance est interdit.

## 5. Garde-fous ajoutés

`validateRoute()` refuse désormais notamment :
- `MOMENT_ID` sans `DISPLAY_ROLE` ;
- `DISPLAY_ROLE` sans `MOMENT_ID` ;
- moment non contigu ou multi-blocs ;
- moment commençant par `TRANSITION` ou `DETAIL` ;
- hard lock artificiel de niveau personnage ;
- incohérences de goals ;
- FIN absente/multiple/non finale.

Tests dédiés ajoutés dans `src/route/displayRole.test.ts` pour :
- frontières de checkbox ;
- fallback de transition ;
- priorité d'une instruction explicite ;
- rejet d'un moment commençant par une transition.

## 6. État CI

Les commits fonctionnels récents ont passé côté frontend :
- tests route ;
- validation route ;
- build frontend.

Le check Tauri Windows doit toujours être regardé sur le dernier commit avant de déclarer un état complètement vert.

## 7. Source/runtime

Le dernier changement de route (`328 cartes`) a été poussé par l'utilisateur et `data/route.json` correspond au Sheet de cette passe.

Les changements suivants ont ensuite porté sur le code UI / validation / documentation uniquement ; ils ne nécessitent pas de nouvel export du Sheet tant que `ROUTE` ne change pas.

## 8. Prochain chantier exact

Continuer l'audit du rendu réel, pas une nouvelle chasse mécanique au nombre de cartes.

Priorités :
1. vérifier visuellement les longues séquences en compact et détaillé ;
2. vérifier le rendu spécifique du seul hard lock mutualisé `L'Ombre et la proie` ;
3. vérifier que les transitions courtes restent lisibles sans recréer de bruit ;
4. vérifier les liens DPLN internes et boutons `/travel` ;
5. corriger uniquement les défauts reproduits, sans nouvelle heuristique métier ;
6. garder `MOMENT_ID + DISPLAY_ROLE` comme seules vérités de présentation.

## 9. Interdictions à ne pas réintroduire

- parsing du titre/instruction pour décider du regroupement ;
- regroupement automatique sans `MOMENT_ID` ;
- heuristique UI par `type` pour choisir le vrai objectif ;
- nouvelle source de vérité ;
- correction manuelle de `data/route.json` ;
- suppression d'une transition nécessaire au seul motif de compacter ;
- éclatement arbitraire d'une grande série cohérente uniquement parce qu'elle contient beaucoup de checkboxes.
