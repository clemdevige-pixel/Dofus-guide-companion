# HANDOFF — Dofus Guide Companion

Date : 2026-09-15

## TL;DR

Branche active : `agent/initial-scaffold`.

La route Astrub → Dofus Sylvestre est désormais **certifiée et synchronisée** entre le Google Sheet source et `data/route.json`.

État courant :
- **1009 étapes** ;
- **20 blocs** ;
- certification factuelle clôturée sur le scope de la route ;
- `data/route.json` synchronisé avec la source éditoriale ;
- `pnpm.cmd test:route` vert ;
- `pnpm.cmd validate:route` vert ;
- `pnpm.cmd build` vert ;
- tests anti-régression métier actifs dans `src/route/routeContracts.test.ts` ;
- les blocs génériques `PRÉREQUIS` ne sont plus affichés dans l'UI, mais la donnée `prerequisites` reste conservée pour audit/validation.

Le prochain chantier recommandé n'est plus la route métier : c'est la **recette runtime / UX finale de la V1**, puis le gel de la route sauf défaut concret découvert en test.

## 1. Sources de vérité

Projet : **Dofus Guide Companion**  
Repo : `clemdevige-pixel/Dofus-guide-companion`  
Branche : `agent/initial-scaffold`

Source éditoriale : Google Sheet **`Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`**, onglet **`ROUTE`**.  
ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

Runtime : `data/route.json`, généré depuis le Sheet.

Références métier :
- Ganymède GP0 + guides spécialisés = ordre relatif, fenêtres, mutualisations ;
- DofusPourLesNoobs / sources fiables = prérequis, lancements, boss, positions, interactions et conditions factuelles.

Ordre de lecture obligatoire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md`
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
7. `HANDOFF.md`

## 2. Contrat data/UI verrouillé

- `STEP_ID` = identité métier stable ;
- `MOMENT_ID` = frontière autoritaire d'une carte multi-step ;
- `DISPLAY_ROLE` = `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- premier membre d'un moment = `OBJECTIVE` ;
- maximum 5 `OBJECTIVE` par carte ;
- `PARALLEL_ID / PARALLEL_PHASE` = lifecycle des vraies quêtes à maintenir actives ensemble ;
- `GOAL_ID / GOAL_PHASE` = lifecycle des fils rouges ;
- `completedStepIds` = unique vérité de progression ;
- aucune logique métier spécifique à une quête dans React ;
- aucune correction manuelle de `data/route.json` comme source éditoriale.

### Prérequis

`RouteStep.prerequisites` reste exporté et disponible dans la donnée, mais **n'est pas rendu dans les cartes joueur**.

Les besoins actionnables doivent être portés par :
- cartes `PRÉPA` ;
- `warning` lorsque critique ;
- `guideItems` / `instruction` selon le contrat existant.

## 3. Certification route — clôturée

La passe exhaustive a corrigé notamment :
- Alignement 75→85 autour de `Sram d'Égoutant → Tengu → C'est frais → Si j'avais un marteau → Esprit, es-tu là ?` ;
- Alignement 86→100 et les passages Missiz/Ilyzaelle associés ;
- Ordre 4 → Grand Ougah → Ordre 5/Merkator ;
- Fratrie / `Le fléau de Burin` / Ébène / Gang des Toxines ;
- Enutrosor 2 / Enutrosor 3 ;
- Turquoise avec les repassages structurels Founoroshi et Mansot ;
- Ben le Ripate / accès Berceau d'Alma ;
- DDG avec Comte #1 dédié puis Comte #2 Six sur six / Totem ;
- `Un comte de faits divers` ;
- `Frigost, une île pas comme les autres` ;
- Tour du Monde jusqu'à Ougah → Merkator → Kralamoure ;
- accès Martegel via `Frappez, ami, et entrez` ;
- prérequis externes Ivoire / Ébène / Six sur six / Dom de Pin / Sylvestre ;
- chaînes Valonia / Ilyzaelle ;
- fin Prologue → Dom de Pin → Dofus Sylvestre.

Les anciennes optimisations impossibles ont été abandonnées lorsqu'un repassage était réellement nécessaire.

## 4. Anti-régression automatique

`src/route/routeContracts.test.ts` protège désormais les contrats métier les plus sensibles, notamment :
- Alignement 75→85 ;
- Fratrie → Ébène → Gang des Toxines ;
- Ordre 4 avant Ordre 5 ;
- Alignement 99 avant 100 / Ordre 5 ;
- premier Comte DDG avant le Comte Six sur six ;
- Tour du Monde Ougah → Merkator → Kralamoure ;
- accès Martegel avant `De Brikke et de Brokke` ;
- absence de doublon exact d'objectif `OBJECTIVE` dans un même `MOMENT_ID`.

Important : ces tests sont des garde-fous éditoriaux / métier. Ils ne doivent jamais devenir une seconde source de progression runtime.

## 5. État validation / build

Dernière vérification locale utilisateur :

```text
pnpm.cmd test:route      ✅
pnpm.cmd validate:route  ✅
pnpm.cmd build           ✅
```

Le warning Vite sur un chunk > 500 kB n'est pas un échec de build.

Sous PowerShell Windows, si `pnpm.ps1` est bloqué par l'ExecutionPolicy, utiliser `pnpm.cmd` sans modifier la policy système.

## 6. Flux officiel de modification de route

Toute future correction métier suit obligatoirement :

```text
Google Sheet ROUTE
→ scripts/export-route.ts
→ data/route.json
→ pnpm.cmd test:route
→ pnpm.cmd validate:route
→ pnpm.cmd build
→ commit/push
```

Ne jamais modifier `data/route.json` comme vérité éditoriale.

Une route ne doit plus être déclarée certifiée après seulement quelques checks ciblés. Toute réouverture métier doit expliciter ce qui invalide la certification et repasser les contrats concernés.

## 7. Prochain chantier

### Priorité A — recette runtime / UX finale

Tester dans l'application les zones qui ont subi les plus gros mouvements :
- Frigost / Turquoise ;
- Alignement 75→100 ;
- Ordres 4→5 ;
- DDG ;
- Ivoire / Ébène ;
- Tour du Monde ;
- Valonia / Ilyzaelle ;
- Dom de Pin / Sylvestre.

Chercher uniquement des défauts concrets :
- carte vide ;
- mauvais regroupement ;
- transition incompréhensible ;
- répétition visible ;
- checkbox incohérente ;
- instruction critique absente ;
- navigation/progression cassée.

### Priorité B — gel V1

Si la recette runtime est propre :
- geler la route V1 ;
- ne plus la réoptimiser sans bug ou gain démontré ;
- passer aux fonctionnalités produit restantes du Companion.

## 8. Règle de reprise pour le prochain agent

Ne pas rouvrir la certification ou réordonner la route par intuition.

Si un défaut est découvert :
1. reproduire le problème sur la route actuelle ;
2. vérifier Ganymède + source factuelle ;
3. corriger le paquet indivisible dans le Sheet ;
4. ajouter/adapter un test anti-régression si le défaut est généralisable ;
5. réexporter et repasser les tests.

État de départ attendu : **route certifiée, runtime synchronisé, tests verts, recette UX finale à effectuer**.
