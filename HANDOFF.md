# HANDOFF — Dofus Guide Companion

Date: 2026-09-03

## 1. Contexte

Projet : **Dofus Guide Companion**
Repo : `clemdevige-pixel/Dofus-guide-companion`
Branche active : `agent/initial-scaffold`
PR active : `#1 — Initial Tauri + React companion scaffold`

Objectif produit : companion desktop léger, always-on-top, permettant de suivre la roadmap Dofus Astrub → Dofus Sylvestre sous forme d’overlay compact, sans avoir à naviguer dans le Google Sheet.

Le Google Sheet reste la source éditoriale. L’app consomme un `data/route.json` strictement validé.

Avant toute modification, lire dans cet ordre :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. ce fichier `HANDOFF.md`

## 2. Décisions produit validées

- Nom : **Dofus Guide Companion**
- Stack : **Tauri 2 + React + TypeScript + Vite**
- largeur compacte par défaut : **380 px**
- fenêtre librement redimensionnable ; taille et position persistées à terme
- always-on-top en V1
- click-through : **V1.1**, pas en V1
- raccourcis globaux en V1, configurables dans les réglages
- export de route : **Google Sheet → script TypeScript → validation stricte → `data/route.json`**
- aucun OCR, lecture mémoire, injection ou automatisation de Dofus en V1
- aucune logique spécifique à une quête hardcodée dans React

## 3. UX de référence

La référence UX est dans `SPEC.md`.

### Mode compact
Affiche uniquement :
- index / total
- type
- nom de l’étape
- lien DPLN si présent
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

## 4. État du code

Le scaffold est déjà posé sur `agent/initial-scaffold` :

- `AGENTS.md`
- Tauri 2
- React + TypeScript + Vite
- fenêtre Tauri configurée always-on-top, 380 px par défaut, redimensionnable
- wireframe compact / détaillé
- drawer
- navigation étape précédente / suivante / valider
- types de domaine dans `src/route/types.ts`
- route chargée depuis `data/route.json`
- loader dédié
- validation stricte du `RouteDocument`
- sélecteurs de progression
- persistance locale minimale des étapes complétées + mode compact
- calcul dérivé : première étape non validée, progression, fils rouges actifs, prochain verrou dur
- CI GitHub front

Important : la route mock TypeScript a été supprimée afin d’éviter une double source de vérité. `data/route.json` est désormais la seule route consommée par le front.

## 5. CI

Une GitHub Action `.github/workflows/ci.yml` compile le front :

- setup pnpm
- Node 24
- install
- `pnpm build`

Dernier état vérifié avant handoff : **CI verte** après le refactor vers `data/route.json`.

Un premier échec CI avait révélé l’absence de déclaration Vite pour l’import CSS ; `src/vite-env.d.ts` a été ajouté.

## 6. Google Sheet source

Spreadsheet : `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`
ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`
Onglet source : `ROUTE`

Structure visible actuelle :

- A `BLOC` — ancienne colonne, désormais non utilisée comme source métier
- B `TYPE`
- C `ÉTAPE`
- D `PRÉREQUIS / RESSOURCES`
- E `⚠️ À SAVOIR`
- F `SOURCE`
- G `NOTE / OPTI`
- H `✅`
- I `🎯 ACTION`
- J `⏭ SUITE / STOP`

Une colonne technique K `STEP_ID` vient d’être ajoutée et masquée pour donner des IDs stables indépendants des numéros de ligne.

### Migration STEP_ID déjà faite

- colonne K créée
- header `STEP_ID`
- valeurs `route-step-0001`, `route-step-0002`, etc. générées
- les formules ont ensuite été figées en valeurs
- vérification effectuée sur les premières lignes : ce sont bien des `stringValue`, pas des formules
- colonne K masquée

Important : **ne jamais utiliser le numéro de ligne Sheet comme identifiant métier dans l’app**.

## 7. Valeurs TYPE actuellement rencontrées dans ROUTE

Le scan complet B:C a confirmé au moins ces types :

- `PRÉPA`
- `RÈGLE`
- `QUÊTE`
- `DONJON`
- `REPRISE`
- `JALON`
- `FIL ROUGE`
- `ALIGN.`
- `TOUR`
- `TURQUOISE`
- `ORDRE`
- `GROSSE ÉTAPE`
- `OPTI ALIGNEMENT`
- `FIN`

Les lignes `NOUVEAU BLOC XX — ...` et `▶ À FAIRE` ont un TYPE vide et doivent être traitées comme structure, pas comme étape classique.

L’exporteur ne doit **jamais** accepter silencieusement un TYPE inconnu.

## 8. Mapping cible recommandé vers `StepType`

À valider / implémenter explicitement dans l’exporteur :

- `QUÊTE` → `quest`
- `REPRISE` → `resume`
- `DONJON` → `dungeon`
- `PRÉPA` → `preparation`
- `RÈGLE` → `rule` ou `hard_lock` si la donnée est explicitement structurée comme verrou
- `JALON` → `milestone`
- `FIL ROUGE` → `long_running`
- `ALIGN.` → `alignment`
- `ORDRE` → `order`
- `GROSSE ÉTAPE` → `major_step`
- `FIN` → `finish`

Cas à décider proprement, sans parser du texte dans le front :
- `TOUR` : probablement `quest` avec un champ/category dédié, ou extension de StepType si l’UX doit vraiment le distinguer
- `TURQUOISE` : même sujet ; ne pas multiplier les StepType sans bénéfice UI réel
- `OPTI ALIGNEMENT` : probablement `rule` / `milestone` selon intention

Point important : ne pas bricoler un mapping uniquement à partir du libellé affiché. Si une distinction métier est nécessaire, enrichir le JSON/exporteur.

## 9. Hyperliens DPLN

Dans le Sheet, beaucoup de noms de quêtes sont des formules du type :

`=HYPERLINK("https://www.dofuspourlesnoobs.com/...";"Nom de quête")`

Pour le vrai exporteur, il faudra lire la cellule C avec les métadonnées/formules/hyperlinks afin de récupérer :
- le libellé visible
- l’URL DPLN

Ne pas dépendre uniquement de la colonne F `SOURCE`, car les liens sont actuellement majoritairement portés directement par les cellules de `ÉTAPE`.

## 10. Prochain chantier exact

### A — Construire l’exporteur réel

Créer `scripts/export-route.ts`.

But :

`ROUTE Google Sheet → mapping explicite → validation stricte → data/route.json`

Il doit :

1. lire les lignes utiles de `ROUTE`
2. détecter les 21 `NOUVEAU BLOC XX`
3. construire `RouteBlock[]`
4. ignorer les lignes `▶ À FAIRE` comme structure pure
5. produire une `RouteStep` pour les vraies étapes
6. utiliser `STEP_ID` comme `step.id`
7. dériver `blockId` depuis le dernier séparateur de bloc rencontré
8. mapper les TYPE via une table explicite
9. récupérer nom, action, instruction, lien DPLN
10. convertir les PRÉPA multilignes en `preparationItems` si possible
11. échouer si : TYPE inconnu, ID manquant/dupliqué, blockId absent, URL invalide, schema incohérent
12. générer `data/route.json`
13. faire passer `validateRouteDocument` sur le JSON produit avant écriture finale

### B — Ne PAS encore enrichir automatiquement les fils rouges par heuristique texte

Le modèle prévoit :

```ts
longRunningGoal?: {
  goalId: string;
  phase: 'start' | 'progress' | 'finish';
}

hardLock?: {
  goalId?: string;
  message: string;
}
```

Le Sheet ne contient pas encore de colonnes techniques dédiées `GOAL_ID`, `GOAL_PHASE`, etc.

Ne surtout pas coder dans React des règles du genre :

```ts
if (step.title.includes('Ocre')) ...
```

Deux options propres pour la suite :
- ajouter des colonnes techniques masquées au Sheet pour ces relations ;
- ou faire un enrichissement éditorial versionné côté exporteur via une donnée séparée, mais pas via parsing implicite des titres.

La première option est préférable si le Sheet doit rester la source complète de vérité.

## 11. Points de vigilance

- `RÈGLE` contient parfois un vrai verrou dur (`NIVEAU 80 — VERROU DUR`, `VERROU DUR — TABLETTE DE TOTANKAMA`, etc.) et parfois une simple instruction. Le front ne doit pas deviner la différence depuis le texte.
- Certaines lignes `PRÉPA` contiennent des sections et plusieurs paragraphes ; la première migration peut conserver `instruction` brut si `preparationItems` n’est pas fiable, puis enrichir ensuite.
- Beaucoup d’actions sont déjà normalisées dans la colonne I : `TERMINER`, `AVANCER / STOP`, `REPRENDRE / TERMINER`, `PRÉPARER`, etc.
- Les colonnes D/E/G peuvent contenir des infos utiles à l’instruction finale, mais le produit doit rester minimaliste. Ne pas injecter tout le bruit du Sheet dans l’overlay.
- Une seule vérité de progression : `completedStepIds`. L’index de consultation est temporaire.
- Toujours modifier le minimum nécessaire et éviter toute abstraction sans usage réel.

## 12. État de la PR

PR #1 reste en draft.

Ne pas merge avant :
- exporteur réel fonctionnel
- `data/route.json` réel chargé
- build vert
- lancement manuel Windows `pnpm tauri dev`
- validation du rendu à 380 px + resize
- vérification always-on-top sous Dofus

## 13. Première action recommandée dans le prochain chat

1. lire `AGENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `HANDOFF.md`
2. vérifier la branche `agent/initial-scaffold`
3. relire `data/route.json`, `src/route/loadRoute.ts`, `src/route/validateRoute.ts`, `src/progress/*`
4. implémenter `scripts/export-route.ts`
5. ajouter le strict minimum de colonnes techniques supplémentaires au Sheet uniquement si nécessaire pour conserver une source de vérité explicite
6. générer le premier vrai `data/route.json`
7. CI jusqu’au vert

Ne pas commencer par l’UI ou les hotkeys : le pipeline de données réel est maintenant le chantier prioritaire.
