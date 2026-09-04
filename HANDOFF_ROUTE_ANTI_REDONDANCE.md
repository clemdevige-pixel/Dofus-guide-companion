# HANDOFF — Route anti-redondance / cohérence globale

## TL;DR

Branche : `agent/initial-scaffold`

Source de vérité : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`  
Spreadsheet ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

État au 2026-09-05 :

- passe anti-redondance structurelle terminée ;
- `MOMENT_ID` = unique frontière de carte ;
- `DISPLAY_ROLE` = structure interne (`OBJECTIVE`, `TRANSITION`, `DETAIL`) ;
- plafond UX : **5 objectifs maximum par carte** ;
- le validateur refuse désormais un `MOMENT_ID` à 6+ objectifs ;
- fenêtre : footer/navigation fixe, seule la zone carte est scrollable ;
- audit DPLN : toutes les quêtes/reprises/fils rouges exportés ont leur source cliquable ;
- `PARALLEL_ID` / `PARALLEL_PHASE` structurent les quêtes à garder actives et avancer conjointement ;
- **24 groupes parallèles** confirmés dans le Sheet après croisement de la route avec le JSON Ganymède ;
- le rappel UI `QUÊTES EN PARALLÈLE` est branché depuis la donnée structurée ;
- un membre futur n'apparaît dans le rappel qu'une fois réellement introduit dans le parcours.

## Contrat de carte

### MOMENT_ID

`MOMENT_ID` est l'unique frontière autoritaire d'une carte.

Une ligne sans `MOMENT_ID` = une carte autonome.

Un moment explicite :

- reste dans un seul bloc ;
- reste contigu ;
- commence toujours par `DISPLAY_ROLE=OBJECTIVE` ;
- possède `DISPLAY_ROLE` sur toutes ses lignes ;
- contient **au maximum 5 `OBJECTIVE`**.

Le code ne regroupe jamais une carte depuis un titre, un type ou un verbe d'action.

### DISPLAY_ROLE

- `OBJECTIVE` = checkbox ;
- `TRANSITION` = action visible sans checkbox, attachée à l'objectif précédent ;
- `DETAIL` = information technique attachée à l'objectif précédent.

Une transition sans `instruction` garde un fallback compact `ACTION — titre` construit depuis ses champs structurés.

## Taille de fenêtre / navigation

La fenêtre ne doit jamais changer de taille selon la carte.

Le layout est désormais :

```text
header / bloc / contexte
zone carte flexible + scroll
footer navigation fixe
```

Le bouton `TERMINÉ` reste donc au même emplacement même quand le contenu de la carte est plus dense.

Le plafond de 5 objectifs est un contrat de lisibilité, pas un correctif de layout.

## Quêtes parallèles

Colonnes Sheet :

- `PARALLEL_ID` ;
- `PARALLEL_PHASE` = `START`, `PROGRESS`, `FINISH`.

Runtime :

```ts
parallelGroup?: {
  parallelId: string;
  phase: 'start' | 'progress' | 'finish';
}
```

Le lifecycle est strict :

```text
start → progress* → finish
```

Un groupe doit être terminé avant la fin de la route.

### Sémantique UI

Le groupe devient actif quand son step `start` est validé.

Le rappel persistant affiche uniquement les membres déjà introduits :

- après `start` : uniquement la première quête ;
- chaque `progress` validé ajoute la nouvelle quête au rappel ;
- `finish` retire automatiquement le groupe.

Cela évite d'afficher au joueur une quête future qu'il ne peut pas encore prendre.

## Audit Ganymède des convergences

Le JSON Ganymède fourni par l'utilisateur contient **35 passages** où plusieurs guides sont avancés vers un même checkpoint.

Ces 35 passages ont été comparés à notre route optimisée.

Critère retenu pour créer un `PARALLEL_ID` : au moins deux vraies quêtes de notre route doivent rester actives / être avancées conjointement. Les captures Ocre seules, guides optionnels ou branches absentes de notre route ne suffisent pas.

État Sheet : **24 groupes parallèles confirmés**.

Cas structurés notamment :

- Forgerons ;
- Blops ;
- Domaine Ancestral ;
- Reine Nyée ;
- Damadrya ;
- Chêne Mou ;
- Koulosse ;
- Meulou ;
- Rat Blanc ;
- Maître Corbac ;
- Minotoror ;
- Mansot Royal ;
- Sphincter Cell ;
- Demeure des Esprits ;
- Founoroshi ;
- Kanigroula ;
- Korriandre ;
- Grand Ougah ;
- Glourséleste ;
- Grolloum ;
- Missiz Frizz ;
- Nidas ;
- Dazak ;
- Vortex.

### Obsidiantre

Pas de faux `PARALLEL_ID` créé.

La route ne structurait pas explicitement le lancement de `Lavomatique` avant l'Obsidiantre. Le passage a été sécurisé par une instruction explicite demandant de vérifier `Lavomatique` avant d'entrer et de ne pas sortir après Dan Lavy.

## Audit de cohérence 2026

La route a été recroisée avec Ganymède et DofusPourLesNoobs sur les points de blocage réels.

Corrections majeures déjà intégrées :

- prérequis élevage Émeraude ;
- Carte de Cania / 9 Primatons ;
- Tablette de Totankama / 25 Trésors archéologiques ;
- timer actuel de `Le mal a dit` ;
- post-Sylargh `Il est temps de mourir` ;
- titres corrompus `Protéger et sévir` / `Le nouveau monde` ;
- donnée parasite de `La marche de l'impératrice` ;
- accès Otomaï, Moon, Wabbit, Capture d'âmes ;
- Valonia / Dom de Pin ;
- Prologue ;
- Enutrosor ;
- fin Sylvestre.

## DPLN

Les liens DPLN sont portés par la donnée (`source.url`) issue des formules `HYPERLINK` du Sheet.

L'UI sait afficher :

- le lien de la quête principale ;
- les liens distincts des sous-étapes d'une carte mutualisée ;
- les liens des transitions lorsqu'ils diffèrent du lien principal.

Aucune URL n'est reconstruite ou devinée côté React.

## État runtime IMPORTANT

Le dernier `data/route.json` poussé contient encore **21 groupes parallèles**.

Le Sheet est plus récent : il contient maintenant **24 groupes**, avec les ajouts Reine Nyée, Founoroshi et Vortex.

Un snapshot local propre a été généré depuis le Sheet :

```text
20 blocs
986 étapes
24 groupes parallèles
max 5 objectifs par carte
```

**Il faut encore synchroniser ce dernier JSON dans `data/route.json` avant de considérer le runtime parfaitement aligné.**

Ne jamais corriger `route.json` à la main hors export/snapshot fidèle du Sheet.

## Code récent

- validation `≤5 objectifs` ajoutée ;
- test de régression ajouté ;
- `getActiveParallelGroups()` ne révèle plus les membres futurs ;
- test parallèle mis à jour ;
- `App.tsx` affiche un rappel persistant `QUÊTES EN PARALLÈLE` ;
- frontend CI vert sur ces changements ;
- check Tauri Windows lancé sur le dernier head.

## Contraintes non négociables

- pas d'exception par nom de quête dans React ;
- pas de parsing métier depuis les textes ;
- pas de seconde source de vérité ;
- `MOMENT_ID` = carte ;
- `DISPLAY_ROLE` = rôle visuel interne ;
- `PARALLEL_ID` = lifecycle de quêtes conjointes ;
- 5 objectifs maximum par carte ;
- pas d'invention de PNJ, position ou prérequis ;
- préserver Ocre / STOP / objets obligatoires / dialogues de sortie / ordre imposé ;
- optimiser le confort réel, pas le nombre de cartes pour le chiffre.
