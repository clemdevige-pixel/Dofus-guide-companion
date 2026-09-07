# HANDOFF — Dofus Guide Companion

Date : 2026-09-05

## TL;DR

Branche active : `agent/initial-scaffold`.

Le chantier actuel n'est **plus** la densité des cartes ni la linéarisation de base. La route a subi une grosse reprise macro contre le GP0 Ganymède puis une passe de cohérence carte par carte.

Le chantier **EN COURS** est maintenant la **certification factuelle exhaustive de toute la route**, jusqu'à pouvoir affirmer que chaque carte a été vérifiée : prérequis, ressources, ordre, boss, interactions intra/post-donjon, captures Ocre, rendus, mutualisations et absence de repassage inutile.

Point critique : **le Google Sheet `ROUTE` est actuellement en avance sur `data/route.json`**. De nombreuses corrections récentes ont été appliquées directement au Sheet après la dernière synchro runtime. Ne jamais considérer le JSON comme la dernière vérité éditoriale tant qu'il n'a pas été régénéré.

Deux changements de contrat ont aussi commencé côté code :
- `RouteStep.prerequisites` existe ;
- `RouteStep.warning` existe ;
- `scripts/export-route.ts` exporte désormais `PRÉREQUIS / RESSOURCES` et `À SAVOIR` ;
- **mais `App.tsx` ne rend pas encore ces deux champs de manière dédiée**. C'est un travail restant.

## 1. Sources de vérité

Projet : **Dofus Guide Companion**  
Repo : `clemdevige-pixel/Dofus-guide-companion`  
Branche : `agent/initial-scaffold`

Source éditoriale : Google Sheet **`Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`**, onglet **`ROUTE`**.  
ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

Source d'ordre / de synchronisation : **Ganymède GP0 `2747(2).json` fourni par l'utilisateur**.  
Important : Ganymède sert de **squelette d'ordre et d'optimisation**, pas de texte à copier-coller.

Source factuelle principale : DofusPourLesNoobs / guides spécialisés fiables.

Runtime : `data/route.json`, généré depuis le Sheet.

Ordre de lecture obligatoire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md`
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
7. `HANDOFF.md`

## 2. Contrat data/UI actuel

- `STEP_ID` = identité stable d'une étape technique ;
- `MOMENT_ID` = frontière autoritaire d'une carte multi-step ;
- une ligne sans `MOMENT_ID` = carte autonome ;
- `DISPLAY_ROLE` = `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- premier membre d'un moment = `OBJECTIVE` ;
- maximum 5 `OBJECTIVE` par carte ;
- `PARALLEL_ID / PARALLEL_PHASE` = lifecycle `start → progress* → finish` des vraies salves de quêtes conjointes ;
- `GOAL_ID / GOAL_PHASE` = lifecycle des fils rouges ;
- `GUIDE_ITEMS` = actions structurées courtes, y compris dans les séquences ;
- `PRÉREQUIS / RESSOURCES` → `RouteStep.prerequisites` pour les étapes non-PRÉPA ;
- `À SAVOIR` → `RouteStep.warning` ;
- `completedStepIds` = unique vérité de progression ;
- aucune heuristique métier ne doit être reconstruite depuis les titres ou instructions.

### Convention critique DONJON

Quand une action oubliée **après le boss / dans la salle de sortie** peut obliger à refaire le donjon ou bloquer une quête, la colonne `À SAVOIR` doit commencer par :

```text
⚠ AVANT DE SORTIR DU DONJON — ...
```

Ne pas utiliser cette alerte pour :
- un drop automatique ;
- une action appartenant seulement à une branche hors scope ;
- une contrainte à faire avant le boss ;
- une simple recommandation.

L'objectif est que l'UI rende bientôt ce `warning` comme un encart très visible **avant l'action**.

## 3. État fonctionnel code

Déjà intégré avant la certification :
- overlay Tauri always-on-top et redimensionnable ;
- persistance taille/position fenêtre ;
- progression locale persistée ;
- navigation précédent / suivant / numéro de carte ;
- mode compact / détaillé ;
- drawer secondaire ;
- raccourcis globaux configurables ;
- liens DPLN via navigateur système ;
- cartes depuis `MOMENT_ID` ;
- checkbox / transition / détail depuis `DISPLAY_ROLE` ;
- hard locks sans auto-advance ;
- fils rouges dérivés de la donnée ;
- rappels parallèles contextuels ;
- `GUIDE_ITEMS` exploités dans les séquences.

Évolution récente déjà présente dans le repo :
- `RouteStep` contient `prerequisites?: string` et `warning?: string` ;
- l'exporteur lit les colonnes D/E du Sheet et les exporte.

**RESTE À FAIRE CÔTÉ UI :**
- rendre `prerequisites` et `warning` dans `App.tsx` ;
- hiérarchie cible : `PRÉREQUIS` → `À SAVOIR` → `GUIDE_ITEMS` / action → `SUITE / STOP` ;
- l'alerte `⚠ AVANT DE SORTIR DU DONJON` doit être visuellement forte, pas noyée dans un paragraphe standard ;
- même comportement sur carte simple et séquence ;
- ne pas recopier ces données dans `instruction` pour compenser : une seule vérité.

## 4. État macro de la route — corrections déjà faites

La route a été confrontée au GP0 Ganymède et plusieurs anciennes optimisations locales ont été corrigées.

Corrections macro importantes déjà intégrées au Sheet :
- début Tour du Monde / Astrub remis dans le squelette GP0 ;
- Pandala / Domaine Ancestral / Dragon Cochon / Koulosse / Meulou / Rats remis dans un ordre cohérent ;
- début Ébène remonté après Pourpre ;
- Crocabulia Ébène + Tour du Monde mutualisé en un seul passage ;
- Tanukouï mutualisé ;
- Chêne Mou mutualisé ;
- Tertre du long sommeil replacé avant Sphincter/Minotot/Kimbo ;
- Phossile réduit à un passage réellement partagé Foluk + Enutrosor ;
- Dorigami recadré : Kanigroula → début Dorigami/Shogun → Tengu → Demeure / fermeture ;
- Cavaliers/Pandamonium remontés avant Ébène pour obtenir Nécronyx avant Bethel/Solar ;
- `Les quatre volontés` fermé avant Six sur six ;
- Tacheté → Valonia/Cire Momore → Cauchemar/Totems remis dans l'ordre GP0 ;
- Prologue ouvert avant la fermeture finale Cauchemar afin d'exploiter le Coffret de la relique ;
- fin Prologue → Dom de Pin → Sylvestre recadrée.

### Totems de Maïmane — stratégie VALIDÉE

Ne pas réoptimiser sur intuition.

Après confrontation Ganymède/prérequis, la meilleure option compatible avec notre trame reste :
- Joie → **Klime** : repassage dédié ;
- Peur → **Koutoulou** : repassage dédié ;
- Colère → **Dazak** : repassage dédié ;
- Dégoût → **Nileza** : repassage dédié ;
- Tristesse → **Vortex** : mutualisé avec Six sur six ;
- Surprise → **Comte Harebourg** : mutualisé avec Six sur six + Givre.

Donc **4 repassages dédiés** restent nécessaires.

Ne pas utiliser Roi Imagami : le Tacheté arrive après la fermeture Cauchemar dans le squelette Ganymède.  
Ne pas utiliser Solar : sa chaîne crée une dépendance circulaire avec la fermeture des Totems / `Un héritage tourmenté`.

## 5. Certification factuelle exhaustive — état actuel

Cette passe est **EN COURS**. Ne pas annoncer la route « certifiée 100 % » avant sa clôture explicite.

Méthode pour chaque carte :
1. prérequis réellement disponibles à ce moment ;
2. ressource à préparer vs drop obtenu pendant la quête ;
3. lancement / PNJ / position ;
4. checkpoint exact ;
5. boss/donjon exact ;
6. interaction en salle ou après boss ;
7. capture Ocre réellement utile ;
8. rendu / suite ;
9. possibilité de mutualiser sans casser Ganymède ;
10. absence de repassage inutile ;
11. information placée dans le bon champ ;
12. texte joueur sans commentaire d'audit.

### Corrections factuelles importantes déjà appliquées

- **Kwakwa** : parler à l'Esprit volatile avant de sortir pour apprendre `Capture d'Âme` ;
- **Squelettes / Ned le dentiste** : le donjon contribue aux 32 dents mais ne garantit pas 32 ; compléter au cimetière jusqu'à exactement 32 ;
- **Forgerons/Bworks** : optimum certifié = **1 seul Donjon des Forgerons + 1 seul Donjon des Bworks** ;
  - pendant l'unique Forgerons, un Bontarien clique la marmite et conserve le `Liquide des Forgerons` ;
  - `Les sbires du maître` avance jusqu'à Bworkette ;
  - plus tard `Recouvrement de dette à la Tabasse` utilise le liquide précollecté sans refaire Forgerons ;
- ordre alignement `Le Tabi d'Amayiro → Le fantôme de Tsog → Des anneaux sur le bout des doigts → La fureur du Holbaïd` recadré ;
- **Minotoror** : ne pas capturer au passage ; prendre la sauvegarde Minotot ;
- **Rat Blanc / Rat Noir** : captures Ocre retirées ; la capture Sphincter Cell couvre ces besoins plus tard ;
- **Grand Ougah** : premier passage inutile supprimé ; `Assassin Suprême` attend `Un pouvoir mérydique`, un seul passage partagé ;
- **Korriandre** : préparation Essence de Sylvesprit/alternative Essence du Korriandre, interaction post-boss et Dissolvant phosphorescent détaillés ;
- **Cultures et turpitudes** : Jus de cawotte / Élixir des Trépasseurs replacés au vrai point de consommation ;
- **Qui nous protège** : prépa nettoyée des ressources déjà consommées auparavant ;
- **Réminiscence / Aurore Pourpre** : dialogue Cauchemar des Ravageurs avant sortie ;
- **Comte Harebourg** : montre + socle du Dofus des Glaces + dialogues Jiva/Djaul avant sortie ;
- **Orukam / Imagiro** : dialogues complets avant sortie ;
- **Chaloeil, Tal Kasha, Anerice, Ilyzaelle, Nidas, Reine des Voleurs, Solar, Sylargh, Missiz, etc.** : alertes de sortie ajoutées quand elles sont réellement IN_SCOPE ;
- **Bethel/Koutoulou/Vortex** : pas de fausse alerte de sortie quand l'objet utile tombe automatiquement ou que l'action Ganymède concerne une branche hors scope ;
- **Larves** : avertissement pratique — prévoir un autre joueur déjà dans le donjon pour les ouvertures ;
- **La colère des dieux** : suppression de l'affirmation non sourcée « niveau minimum réel 50 » ; garder uniquement ce que les sources confirment.

### Convention de certification des DONJONS

Un donjon sans `warning` n'est pas automatiquement incomplet. Il peut être certifié comme :
- aucune action spéciale après boss ;
- drop automatique ;
- contrainte uniquement avant le boss ;
- action Ganymède hors scope.

Ne pas multiplier les alertes par excès de prudence.

## 6. État structurel connu

Avant les toutes dernières corrections factuelles, les contrôles globaux étaient propres :
- 20 blocs ;
- `STEP_ID` uniques ;
- `MOMENT_ID` contigus ;
- lifecycles GOAL valides ;
- lifecycles PARALLEL valides ;
- exactement une `FIN` finale.

**Les nombres historiques 993 étapes / 363 cartes sont obsolètes.**  
Des suppressions/fusions ont encore eu lieu pendant la certification. Le prochain agent doit recalculer le snapshot après réexport, et ne jamais recopier les anciens nombres.

Le Sheet Google compte actuellement 1019 lignes de grille, mais ce n'est évidemment pas le nombre d'étapes métier.

## 7. Synchronisation runtime — IMPORTANT

État actuel : **Sheet > repo runtime**.

Le flux officiel reste :

```text
Google Sheet ROUTE (A:V)
    ↓
pnpm export:route
    ↓
validation stricte
    ↓
data/route.json
    ↓
pnpm test:route
pnpm validate:route
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

`data/route.json` est généré. Ne jamais le corriger à la main comme source éditoriale.

Avant de synchroniser :
- finir ou prendre un snapshot clair de la certification en cours ;
- vérifier le Sheet natif, pas seulement l'export XLSX ;
- certains `#NAME?` observés dans Excel venaient de fonctions Google Sheets (`REGEXMATCH`) et n'étaient pas des erreurs natives ;
- régénérer ensuite le JSON depuis le Sheet.

## 8. Où reprendre exactement dans le prochain chat

### Priorité A — finir la certification exhaustive

Continuer à parcourir **toute la route**, pas seulement les donjons déjà suspects.

Le dernier travail était concentré sur :
- classification exhaustive des cartes `DONJON` avec/sans alerte de sortie ;
- endgame et chaînes secondaires ;
- vérification des informations ambiguës contre le JSON Ganymède et DPLN.

Ne pas considérer la passe finie tant que chaque carte n'a pas été inspectée au moins une fois sous le protocole de §5.

### Priorité B — terminer le rendu `prerequisites` / `warning`

Le modèle + export sont déjà câblés.  
`App.tsx` doit encore rendre les champs.

Rendu cible :

```text
PRÉREQUIS
<prerequisites>

⚠ À SAVOIR / ⚠ AVANT DE SORTIR DU DONJON
<warning>

GUIDE_ITEMS / action

SUITE / STOP
<instruction>
```

Même ordre sur carte simple et carte séquence.

Ne pas ajouter une nouvelle vérité ni parser le texte pour décider du style. Une détection purement présentationnelle du préfixe `⚠ AVANT DE SORTIR DU DONJON` est acceptable pour choisir une classe visuelle, mais la donnée reste `warning`.

### Priorité C — synchroniser le runtime seulement après

Après certification/snapshot :
1. `pnpm export:route`
2. tests/validation/build
3. vérifier le nombre réel d'étapes/cartes/groupes
4. commit/push

## 9. Garde-fous

- ne pas réécrire la route « pour faire plus propre » sans défaut joueur concret ;
- Ganymède définit la trame, pas notre wording ;
- une mutualisation exige une preuve de coexistence des prérequis ;
- ne jamais optimiser un boss futur si la quête actuelle doit être fermée avant d'y accéder ;
- pas de logique spécifique par nom de quête dans React ;
- pas de parsing métier depuis les textes ;
- pas de seconde vérité de progression ;
- pas de regroupement automatique sans `MOMENT_ID` ;
- pas de `DISPLAY_ROLE` hors `MOMENT_ID` ;
- pas de plus de 5 objectifs par carte ;
- pas de rappel parallèle hors checkpoint du groupe ;
- pas de faux hard lock de niveau personnage ;
- pas d'invention de PNJ, coordonnées, prérequis, quantités ou ressources ;
- ne pas transformer une recommandation de niveau en prérequis factuel ;
- une action post-boss hors scope ne doit pas devenir une alerte joueur ;
- après un déplacement de lignes, relire les colonnes techniques et les `MOMENT_ID` : les index physiques ne sont jamais stables.
