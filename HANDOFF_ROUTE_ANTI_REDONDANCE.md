# HANDOFF — Route anti-redondance / cohérence globale

## TL;DR

Branche : `agent/initial-scaffold`

Source de vérité : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`  
Spreadsheet ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

État au 2026-09-05 :

- `MOMENT_ID` = unique frontière de carte ;
- `DISPLAY_ROLE` = structure interne (`OBJECTIVE`, `TRANSITION`, `DETAIL`) ;
- plafond UX : **5 objectifs maximum par carte** ;
- validation CI : un moment à 6+ objectifs est refusé ;
- fenêtre : header/footer stables, seule la zone carte est scrollable ;
- `PARALLEL_ID` / `PARALLEL_PHASE` structurent les quêtes à garder actives ensemble ;
- **24 groupes parallèles** confirmés après audit Ganymède ;
- rappel UI `QUÊTES EN PARALLÈLE` branché depuis la donnée ;
- les membres futurs n'apparaissent qu'une fois réellement introduits ;
- audit DPLN : toutes les quêtes/reprises/fils rouges exportés ont leur source cliquable ;
- nouvelle passe de densité : **354 cartes estimées après 7 scissions supplémentaires**, toujours 986 étapes et max 5 objectifs.

## Contrat de carte

Un `MOMENT_ID` :

- reste dans un seul bloc ;
- reste contigu ;
- commence par `DISPLAY_ROLE=OBJECTIVE` ;
- possède `DISPLAY_ROLE` sur toutes ses lignes ;
- contient au maximum 5 `OBJECTIVE`.

Une ligne sans `MOMENT_ID` est une carte autonome.

Le code ne déduit jamais de regroupement depuis les titres, types ou verbes d'action.

`DISPLAY_ROLE` :

- `OBJECTIVE` = checkbox ;
- `TRANSITION` = action visible sans checkbox, rattachée à l'objectif précédent ;
- `DETAIL` = information technique rattachée à l'objectif précédent.

## Passe de densité 2026-09-05

Le plafond de 5 objectifs ne suffisait pas pour certaines cartes qui cumulaient trop de transitions/détails. Les pires cas ont été recoupés avec leur logique métier et scindés uniquement sur des frontières naturelles.

### Scissions appliquées

#### Nimotopia

Ancien `moment-nimotopia-loop` : 5 objectifs / 9 lignes techniques.

Devient :

- `moment-nimotopia-loop-a` : ouverture des trois premières quêtes + rendu de `Nos amies les bêtes` ;
- `moment-nimotopia-loop-b` : `Il a fui, il a tout compris` + `La valse des manuels`.

#### Nordalie

Ancien `moment-nordalie` : 5 objectifs / 14 lignes techniques.

Devient :

- `moment-nordalie-tal-kasha` ;
- `moment-nordalie-missions` ;
- `moment-nordalie-katrepat`.

#### Damadrya

Ancien passage de 5 objectifs / 9 lignes.

Devient :

- `moment-damadrya-prep` : les deux quêtes de préparation ;
- `moment-damadrya-pass` : la vraie salve parallèle des trois quêtes jusqu'à Damadrya + sorties.

#### Frigost / Mansot

- `moment-frigost-fonte-glaces` : `La fonte des glaces` ;
- `moment-mansot-pass` : les trois quêtes réellement mutualisées au Mansot Royal.

#### Émeraude / Meulou

- `moment-emeraude-meulou-boss` : passage Meulou ;
- `moment-emeraude-finish-rat` : obtention du Dofus Émeraude puis ouverture du prochain objectif Rat Blanc.

#### Valonia / Sorcière

- `moment-valonia-sorciere-boss` : `La sorcière exilée` + Chambre des Maléfices ;
- `moment-valonia-flamme` : `La graine de la révolte` + `Pour que la flamme vacille`.

Les longues cartes restantes ont été contrôlées : elles correspondent à des séquences continues et ne sont pas scindées mécaniquement.

## Quêtes parallèles

Colonnes Sheet :

- `PARALLEL_ID` ;
- `PARALLEL_PHASE` = `start`, `progress`, `finish`.

Runtime :

```ts
parallelGroup?: {
  parallelId: string;
  phase: 'start' | 'progress' | 'finish';
}
```

Lifecycle strict :

```text
start → progress* → finish
```

Audit JSON Ganymède : 35 convergences analysées. Critère pour créer un groupe : au moins deux vraies quêtes de notre route doivent rester actives / être avancées conjointement. Les captures Ocre seules, branches optionnelles ou guides absents ne suffisent pas.

Groupes confirmés : Forgerons, Blops, Reine Nyée, Domaine Ancestral, Damadrya, Chêne Mou, Koulosse, Meulou, Rat Blanc, Maître Corbac, Founoroshi, Minotoror, Mansot Royal, Sphincter Cell, Demeure des Esprits, Kanigroula, Korriandre, Grand Ougah, Glourséleste, Grolloum, Missiz Frizz, Nidas, Dazak, Vortex.

Toutes les instructions explicites `QUÊTES À AVANCER ENSEMBLE` sont maintenant adossées à un `PARALLEL_ID`.

### Obsidiantre

Pas de faux groupe parallèle créé : `Lavomatique` n'avait pas de lancement structuré propre dans la route. Le passage demande explicitement de vérifier que `Lavomatique` est lancée avant l'entrée et de ne pas sortir après Dan Lavy.

## Cohérence / DPLN

Corrections importantes déjà intégrées :

- prérequis élevage Émeraude ;
- Carte de Cania / 9 Primatons ;
- Tablette de Totankama / 25 Trésors archéologiques ;
- timer de `Le mal a dit` ;
- post-Sylargh `Il est temps de mourir` ;
- titres `Protéger et sévir` / `Le nouveau monde` restaurés ;
- donnée parasite de `La marche de l'impératrice` supprimée ;
- accès Otomaï, Moon, Wabbit, Capture d'âmes ;
- Valonia / Dom de Pin ;
- Prologue ;
- Enutrosor ;
- fin Sylvestre.

Les URLs DPLN viennent uniquement des formules `HYPERLINK` du Sheet. L'UI sait afficher les liens de la quête principale et des sous-étapes internes quand ils diffèrent.

## État runtime IMPORTANT

Le commit `317184c92bb262763cc40f1aac07bb3f97edee0a` a synchronisé le runtime à **24 groupes parallèles** et passe tests + validation + build frontend.

Depuis ce commit, le Sheet a reçu les **7 scissions de densité** listées ci-dessus. Il est donc de nouveau légèrement plus récent que `data/route.json`.

Snapshot fidèle prêt :

```text
20 blocs
986 étapes
354 cartes
24 groupes parallèles
max 5 objectifs par carte
```

Il faut synchroniser ce snapshot dans `data/route.json` avant de considérer le runtime parfaitement aligné.

## Contraintes non négociables

- pas d'exception par nom de quête dans React ;
- pas de parsing métier depuis les textes ;
- pas de seconde source de vérité ;
- `MOMENT_ID` = carte ;
- `DISPLAY_ROLE` = rôle visuel interne ;
- `PARALLEL_ID` = lifecycle de quêtes conjointes ;
- max 5 objectifs par carte ;
- pas d'invention de PNJ, position ou prérequis ;
- préserver Ocre / STOP / objets obligatoires / dialogues de sortie / ordre imposé ;
- optimiser le confort réel, pas le nombre de cartes pour le chiffre.
