# HANDOFF — Dofus Guide Companion

Date: 2026-09-04

## 1. Contexte

Projet : **Dofus Guide Companion**
Repo : `clemdevige-pixel/Dofus-guide-companion`
Branche active : `agent/initial-scaffold`

Objectif : companion desktop Tauri/React affichant la roadmap Astrub → Dofus Sylvestre sous forme de cartes compactes réellement suivables ligne par ligne.

Source éditoriale : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`.
Runtime : `data/route.json`, généré uniquement par `scripts/export-route.ts`.

Avant toute modification lire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md`
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
7. `HANDOFF.md`

## 2. Décisions structurantes

- une seule vérité éditoriale : `ROUTE` ;
- une seule vérité runtime : `data/route.json` généré ;
- aucune logique spécifique à une quête dans React ;
- `STEP_ID` = identité métier persistante d'une étape technique ;
- `MOMENT_ID` = identité éditoriale d'un moment joueur rendu comme une seule carte ;
- `POSITION` = lancement uniquement ;
- `DESTINATION` = déplacement ;
- `GUIDE_ITEMS` = actions internes courtes d'un moment ;
- `GOAL_ID / GOAL_PHASE` = fils rouges structurés ;
- `completedStepIds` reste la seule vérité de progression utilisateur.

## 3. Nouvelle méthodologie validée aujourd'hui

La refonte ne se fait plus seulement bloc par bloc. Après les paquets locaux, on exécute des **passes globales** sur toute la route.

Ordre actuel :
1. faux verrous / prérequis surinterprétés ;
2. prises / reprises / doubles lancements ;
3. donjons et mutualisations ;
4. cartes/moments `TERMINER + LANCER` et `donjon → reprise → suite` ;
5. fils rouges / hard locks ;
6. continuité finale joueur.

Règle centrale : **une carte = un moment joueur, pas une ligne technique**.

Si plusieurs lignes doivent rester ensemble, elles reçoivent le même `MOMENT_ID`. Le regroupement automatique de `getStepGroups()` reste seulement un fallback pour les étapes ordinaires.

## 4. Passes déjà appliquées aujourd'hui

### 4.1 Faux hard locks de niveau

Suppression dans `ROUTE` des hard locks artificiels de niveau personnage identifiés pendant la passe globale, notamment les anciens verrous 40 / 80 / 180 / 190.

Suppression également du faux prérequis niveau 120 sur `L'art de la langue de bois`.

Le niveau recommandé/minimum d'une quête n'est plus transformé en mur de progression sans preuve de blocage réel.

### 4.2 Garde-fou code

`src/route/validation.ts` rejette désormais un `VERROU DUR` dont le titre commence par `NIVEAU <nombre>`.

Objectif : empêcher la réintroduction silencieuse de faux murs de niveau.

### 4.3 MOMENT_ID / cartes explicites

`scripts/export-route.ts` lit désormais `ROUTE!A5:S` et exporte `MOMENT_ID`.

`src/route/types.ts` expose `momentId?: string`.

`src/route/validation.ts` vérifie :
- moment non vide ;
- même bloc ;
- contiguïté ;
- interdiction de rouvrir un moment fermé.

`src/route/selectors.ts` :
- `getStepGroups()` traite `MOMENT_ID` comme frontière de carte autoritaire ;
- la limite `MAX_SEQUENCE_STEPS=8` ne sert plus à découper un moment explicite ;
- `getSequenceObjectives()` regroupe aussi les étapes d'un même moment sans parser les textes.

### 4.4 Passages déjà recollés en moments explicites

Des `MOMENT_ID` ont déjà été ajoutés sur plusieurs séquences auparavant fragmentées, dont :
- Grotte Hesque → fin Donjon magistral → lancement Entre quatre Blops ;
- Clos des Blops → fin Entre quatre Blops → lancement Un Kanniboul versé ;
- Craqueleur Légendaire → fin Les sbires du maître → lancement Un juge hystérique ;
- Laboratoire Brumen → rendus/reprises associés → lancement Le fossile et le marteau ;
- Blop Multicolore → Tour de table → lancement Tour de passe-passe ;
- Sphincter Cell → Tour de rein → lancement Tour de main.

Des moments existaient déjà sur d'autres chaînes : Emma, Tour du Monde, Tynril, Meno, etc. La passe en cours vise à compléter toutes les transitions encore implicites.

## 5. Docs mises à jour

Aujourd'hui :
- `AGENTS.md` ;
- `ARCHITECTURE.md` ;
- `docs/DATA_MODEL.md` ;
- `docs/ROUTE_OPTIMIZATION.md` ;
- `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` ;
- ce `HANDOFF.md`.

Elles documentent maintenant :
- `MOMENT_ID` ;
- la notion de moment joueur ;
- les passes globales ;
- l'interdiction des hard locks de niveau ;
- le fait que le fallback de groupement n'est pas une règle éditoriale.

## 6. État du Sheet vs runtime

**Important : le Sheet contient actuellement des modifications plus récentes que `data/route.json`.**

Ne pas considérer le runtime synchronisé tant que la passe MOMENT_ID n'est pas terminée puis que l'export n'a pas été relancé.

Ne jamais corriger `data/route.json` à la main.

## 7. Prochain chantier exact

Continuer la passe globale `MOMENT_ID` sur les motifs suivants :
- toutes les lignes `TERMINER + LANCER` restantes ;
- toutes les séquences `DONJON → REPRISE → lancement de la suite` ;
- chaînes répétitives Alain / Thelma / Anne / Lorie / Tour ;
- chaînes où un dialogue de sortie + lancement immédiat doivent rester sur la même carte ;
- vérifier qu'aucun moment explicite ne traverse un bloc.

Ensuite :
1. passe globale goals/hard locks ;
2. passe continuité finale ;
3. exporter depuis le Sheet ;
4. `pnpm test:route` ;
5. `pnpm validate:route` ;
6. `pnpm build` ;
7. corriger seulement les erreurs réelles ;
8. seulement après, validation Tauri Windows.

## 8. Points de vigilance

- ne jamais parser titres/instructions pour grouper les cartes ;
- ne jamais transformer un niveau recommandé en hard lock ;
- ne jamais réutiliser un `STEP_ID` pour une autre action métier ;
- un `MOMENT_ID` doit rester contigu et dans un bloc ;
- vérifier les cellules techniques résiduelles après chaque écriture Google Sheets ;
- une requête batch rejetée n'est jamais supposée partiellement appliquée ;
- ne pas annoncer les tests verts avant de les avoir réellement relancés après le dernier export.

## 9. État validation

Les changements Sheet récents ne sont pas encore exportés dans le repo.

Donc, à cet instant :
- audit éditorial global : **EN COURS** ;
- `data/route.json` : **à régénérer après la passe** ;
- `pnpm test:route` : **à relancer après export** ;
- `pnpm validate:route` : **à relancer après export** ;
- `pnpm build` : **à relancer après export**.

Ne pas revenir à la validation UI/Tauri tant que cette synchronisation n'est pas terminée.