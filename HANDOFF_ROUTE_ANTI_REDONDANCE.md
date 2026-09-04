# HANDOFF — Route anti-redondance / cohérence globale

## TL;DR

Branche : `agent/initial-scaffold`

Source de vérité : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`  
Spreadsheet ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

État au 2026-09-04 :

- passe anti-redondance structurelle terminée sur toute la route ;
- `MOMENT_ID` reste la frontière de carte autoritaire ;
- `DISPLAY_ROLE` est renseigné sur 782/782 lignes appartenant à un moment explicite ;
- valeurs : `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- 1 checkbox = 1 sous-objectif significatif ;
- les transitions administratives restent visibles sans checkbox ;
- aucune logique spécifique par nom de quête n'a été ajoutée dans React ;
- audit DPLN mécanique final : **737/737 lignes de quête/reprise/fil rouge portent un HYPERLINK** ;
- contrôle Google Sheet : **0 `#ERROR!`** sur `ROUTE!A5:T1031`.

## Audit de cohérence 2026

Une passe supplémentaire a été menée avec Ganymede + DofusPourLesNoobs actuel pour vérifier qu'un joueur peut suivre la route dans l'ordre sans tomber sur un prérequis caché ou une mécanique devenue obsolète.

### Corrections importantes

#### Émeraude — Naissance d'une vocation

La route masquait auparavant les vrais prérequis d'élevage.

Ils sont maintenant explicités avant la quête :

- succès `Ce n'est qu'un prélèvement` ;
- succès `Elle a peut-être trop mangé ?` ;
- métier Éleveur niveau 20+ ;
- 1 Dragodinde Rousse ;
- 1 Dragodinde Amande ;
- 1 Dragodinde Dorée.

Le verrou métier 50 pour `Qui botte le cul des Culs Bottés ?` reste séparé et réel.

#### Carte de Cania — mécanique 3.4+

La route ne doit plus présenter les Primatons comme un bonus opportuniste.

Le fil rouge est maintenant explicite :

- terminer et remettre à la justice 9 avis de recherche niveau 120 ou moins ;
- récupérer 9 Primatons auprès du Chasseur de primes en `[5,-6]` ;
- acheter les 3 fragments différents pour 3 Primatons chacun ;
- assembler la Carte de Cania avant `Les bandits de Cania`.

Le verrou Carte de Cania a été réécrit sur cette mécanique actuelle.

#### Tablette de Totankama — mécanique 3.4+

Le fil rouge est aligné sur la mécanique actuelle :

- `Comment perdre ses plumes` doit être terminé ;
- 25 Trésors archéologiques nécessaires ;
- 5 Trésors par morceau de tablette ;
- 5 morceaux à acheter puis assembler ;
- deux méthodes cumulables :
  - quête `Chasse au trésor archéologique` : 5 Trésors, limitée à 1 fois/jour ;
  - boss de donjon niveau 120–130 : 1 Trésor automatique en donjon, pas en arène.

Le verrou est conservé uniquement au moment où la tablette devient réellement obligatoire.

#### Le mal a dit

Le texte de prérequis était obsolète.

La route accomplit déjà avant le verrou :

- `Épis d'Emi` ;
- `Bienvenue à Frigost` ;
- `Pauvre Kiki` ;
- `Gène et tique` ;
- `En semant, se ment`.

Le verrou indique maintenant la condition réelle restante : expiration du vaccin temporaire depuis une semaine.

#### Il est temps de mourir

La transition après Sylargh répétait à tort « prendre la quête et avancer jusqu'au Sylargh » alors que le boss était déjà vaincu.

Elle indique maintenant la vraie suite critique :

- ne pas sortir après Sylargh ;
- détruire le Nékoléreux instable dans la salle de sortie ;
- ressusciter ;
- parler à Agonie ;
- poursuivre la séquence Hyrkul selon DPLN jusqu'au Dofus Ivoire.

#### Corruption éditoriale Otomaï

Deux STEP_ID avaient un titre ne correspondant plus à leur contenu :

- `route-step-0105` restauré en `Protéger et sévir` ;
- `route-step-0106` restauré en `Le nouveau monde`.

Le passage `Donjon douillet — Nid du Kwakwa` a également été restauré sur son STEP_ID correct.

#### La marche de l'impératrice

Une ancienne instruction Bworker / Maître des clefs sans rapport avec la quête a été supprimée.

La ligne ne décrit plus que la mutualisation réelle avec `Pêche en eaux gelées`.

## DPLN — couverture des cartes

L'exporteur récupère `source.url` depuis les formules `HYPERLINK` de la colonne `ÉTAPE`.

Le rendu React sait déjà afficher :

- le lien de la quête principale d'un objectif ;
- un lien distinct pour une étape interne de carte quand son URL diffère ;
- le lien d'une carte simple.

Audit mécanique sur un export frais du Sheet :

```text
737 lignes quest-like
737 avec HYPERLINK
0 sans lien
```

Les deux lignes d'orchestration Enutrosor contenant plusieurs noms de quêtes pointent vers la page DPLN Enutrosor ; dans la même carte, `Crache Test`, `La quatrième dimension`, `Déphorrestation` et `La meilleure défense, c'est l'attaque` ont chacune leur URL DPLN dédiée.

## Cohérence Ganymede / DPLN

Le tableau `GANYMEDE_AUDIT` avait déjà validé les 20 blocs individuellement.

La nouvelle passe transversale a en plus revérifié les points à risque actuels :

- accès Otomaï avant `Donjon magistral` ;
- accès Moon avant `Un Kanniboul versé` ;
- accès Wabbit avant `Le Wa Pythie` ;
- Capture d'âmes avant `Le voleur d'âmes` ;
- prérequis d'élevage Émeraude ;
- Carte de Cania / Primatons ;
- Tablette de Totankama / Trésors archéologiques ;
- timer Frigost de `Le mal a dit` ;
- chaîne Valonia / `L'héritage de l'île brisée` avant Dom de Pin ;
- Prologue : `Au détour d'un rêve perdu` → `Entretemps, une renaissance` → `La bête au bois dormant` ;
- post-Sylargh Ivoire ;
- chaînes Enutrosor ;
- prérequis Dom de Pin / Flovoraison / Sylvestre.

Les répétitions de donjons restantes dans `GANYMEDE_AUDIT` restent justifiées par des déblocages ultérieurs et ne doivent pas être fusionnées artificiellement.

## Architecture DISPLAY_ROLE

Le code de la branche supporte désormais :

```ts
type StepDisplayRole = 'objective' | 'transition' | 'detail';
```

`DISPLAY_ROLE` ne peut être défini que dans un `MOMENT_ID`.

`getSequenceObjectives()` respecte la donnée structurée au lieu de décider uniquement depuis le `type`.

La deuxième prise groupée Enutrosor a été reclassée `TRANSITION` pour ne pas créer une checkbox administrative supplémentaire.

## État runtime IMPORTANT

Le Google Sheet est plus récent que `data/route.json`.

**Ne pas considérer le runtime comme synchronisé tant que l'export n'a pas été régénéré.**

Ne jamais corriger `data/route.json` à la main.

Prochaine étape technique :

```bash
pnpm export:route
pnpm test:route
pnpm validate:route
pnpm build
```

Puis :

1. contrôle visuel des grosses cartes ;
2. vérification des boutons DPLN dans l'app ;
3. commit/push final sur `agent/initial-scaffold`.

## Contraintes non négociables

- pas d'exception par nom de quête dans React ;
- pas de parsing métier depuis les textes ;
- pas de seconde source de vérité ;
- pas de correction manuelle de `route.json` ;
- pas d'invention de PNJ, position ou prérequis ;
- préserver Ocre / STOP / objets obligatoires / dialogues de sortie / ordre imposé ;
- optimiser le confort réel du parcours, pas le nombre de cartes pour le chiffre.
