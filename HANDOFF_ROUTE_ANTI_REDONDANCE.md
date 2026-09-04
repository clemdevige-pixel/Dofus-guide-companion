# HANDOFF — Route anti-redondance / confort joueur

## TL;DR

Chantier actif : refonte éditoriale globale de la route pour réduire massivement les cartes et textes redondants tout en conservant toutes les transitions réellement nécessaires entre quêtes/donjons.

Branche active : `agent/initial-scaffold`

Source de vérité route : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`
Spreadsheet ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

Repo : `clemdevige-pixel/Dofus-guide-companion`

## Méthode cible VALIDÉE

Règle fondamentale :

- **1 carte = 1 moment joueur**
- **1 checkbox = 1 sous-objectif significatif**
- les micro-étapes techniques restent dans la data si nécessaires, mais ne doivent pas être affichées comme autant de sous-cartes / blocs textuels redondants
- les transitions indispensables entre deux objectifs restent visibles sous forme de ligne compacte sans checkbox

Format cible :

1. `☐ Shin Larve — Donjon des Larves · capturer pour l’Ocre`
2. `→ Pat Akess [x,y] : rendre Shin Larve puis prendre Rakoopeur`
3. `☐ Rakoopeur — Refuge Sylvestre · capturer pour l’Ocre`
4. `→ Pat Akess [x,y] : rendre Rakoopeur puis prendre Craqueleur Légendaire`
5. `☐ Craqueleur Légendaire — ... puis STOP`

Une transition reste affichée uniquement si elle demande réellement au joueur de :

- rendre une quête
- prendre la suivante
- parler à un PNJ
- avancer une quête avant le prochain donjon
- récupérer / donner un objet
- changer de zone / PNJ
- respecter un STOP / ordre obligatoire

À supprimer :

- `REPRENDRE / FAIRE`
- `FAIRE & VALIDER`
- `REPRENDRE / TERMINER`
- répétitions du nom du PNJ déjà évident dans la carte
- répétitions de fin de carte N au début de N+1
- cartes purement administratives absorbables dans une carte adjacente
- textes qui répètent titre + checklist + transition

Exception : Ocre / capture boss / STOP / objet obligatoire / ordre de dialogue / sauvegarde / condition spéciale = toujours conservés.

## Décisions d’architecture

- `MOMENT_ID` doit rester la clé d’agrégation autoritaire côté rendu.
- Ne pas ajouter de parsing métier fragile dans React.
- S’appuyer sur les données structurées déjà présentes : `MOMENT_ID`, `GUIDE_ITEMS`, positions, type, etc.
- Le chantier n’est pas seulement UI : la source `ROUTE` doit être nettoyée pour éviter les doublons à la racine.

## Docs déjà mises à jour

La nouvelle méthode a été documentée dans :

- `AGENTS.md`
- `docs/ROUTE_OPTIMIZATION.md`
- `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
- `HANDOFF.md`

La passe dédiée est la **Passe 7 — anti-redondance / confort joueur**.

## Travaux déjà effectués dans cette passe

### Tours du Monde / chaînes principales

Nettoyage et transitions compactées sur :

- Pat Akess / Les sbires du maître
- Maître des clefs
- Chris de Naire / Un juge hystérique
- Kal Vissi / Des donjons, encore des donjons
- La voie du guerrier
- Emma Tompouce
- Alain Deix
- Thelma
- Anne Ullaire
- Lorie Culère

Exemples de nouveau format :

`→ Anne Ullaire [-45,19] : rendre Tour d'honneur, puis prendre Tour de marionnettes.`

`→ Chris de Naire [-29,-47] : après le Koulosse, prendre l’objectif Meulou et garder la quête active jusqu’au passage Meulou.`

`→ Kal Vissi [-19,30] : après le Tofu Royal, prendre l’objectif Crocabulia puis enchaîner sur l’Antre.`

### Frigost / Turquoise

Passes de compactage faites sur plusieurs transitions importantes :

- Royalmouth → Minotoror
- Tofu Royal / Crocabulia
- Thomahon / Foluk
- bénédictions et rendus
- `La voie du guerrier` fin Minotot / Bworker / rendu final

### Sufokia / Meno

Nettoyé :

- La pêche aux infos
- Il y a de l’électricité dans l’eau
- Topo le petit robot
- Piège de crystal
- Meno
- Son nom est Personne

La séquence est maintenant pensée comme une seule carte séquentielle avec transitions compactes.

### Tacheté / réunification Pandala

Nettoyé :

- Main dans la main
- De l’encre spectaculaire
- L’épopée du moine pèlerin
- Deux souffles, une inspiration
- Roi Imagami
- Reine Amirukam
- fin Main dans la main
- En ce jardin qui nous unit
- obtention Dofus Tacheté

### Cavaliers / Corruption

Nettoyé :

- Servitude
- Misère
- Un pouvoir mérydique
- Ougah
- Corruption

### Ivoire / Nordalie — dernière passe en cours au moment du handoff

Derniers changements effectués juste avant ce handoff :

- `Le dragon blanc` → texte compact
- `Examen de passage` → texte compact
- `Casse en Enutrosor` → texte compact
- rendus `Un morceau de roi` / `Coiffeur de génie` simplifiés
- `Nordalie` ouverture compactée
- missions Nordalie transformées vers le format objectif clair :
  - `☐ Le guerrier noir — [-76,-80] — à faire en premier.`
  - `☐ Le bonheur est dans le spray — [-76,-80].`
  - `☐ Une voix de crystal — [-76,-80] → Nileza, puis STOP.`
  - `☐ Le mort dans l’âme — [-76,-80] → Katrepat, puis STOP.`
- retour partitions / Pichon de `Une voix de crystal` compacté
- `Il est temps de mourir` → transition compactée

## Point de reprise EXACT

Continuer à partir d’environ la ligne **860+** du Sheet `ROUTE`.

Dernière plage lue intégralement : `A860:S1031`.

Priorités restantes :

1. **Fin Ivoire / début Ébène**
   - De Brikke et de Brokke
   - L’épée du rocher
   - Le forgeur de légende
   - Bethel
   - Koutoulou
   - Dazak
   - Klime
   - Reine des Voleurs
   - Solar

2. **Ocre final**
   - L’éternelle moisson → Kralamoure
   - garder la capture / ouverture / rendu mais éviter toute répétition

3. **Quatre sur six / Six sur six**
   - Bworker
   - Ougah
   - Ombre
   - Glourséleste
   - 4 dragons
   - Dantinéa
   - L’avis de la Mort
   - Tempête de l’Eliocalypse

4. **Totems / S’armer / Comte**
   - forte densité de donjons + reprises, parfait pour le nouveau format

5. **Qui nous protège**
   - Nidas / Aurore Pourpre / Solar
   - garder les sigils utiles, supprimer les redondances

6. **Prologue / Dom de Pin / Final Sylvestre**
   - final doit rester ultra lisible, aucune redite autorisée

## Audit global à faire après la passe éditoriale

Rechercher dans tout `ROUTE` :

- `REPRENDS`
- `Retourne voir`
- `TERMINE`
- `GARDE la quête active`
- `LANCER / TERMINER`
- `REPRENDRE / TERMINER`
- `FAIRE & VALIDER`
- cartes `JALON` qui peuvent être absorbées
- cartes `VERROU DUR — NIVEAU N` : elles doivent être supprimées partout ; le niveau ne doit pas être un hardlock de cette roadmap

Attention : ne pas supprimer les vrais verrous de contenu (tablette Totankama, Ocre d’ambre, Ocre final, alignement 100, timer vaccin, etc.).

## Contrôles finaux obligatoires

Après nettoyage complet :

1. régénérer `data/route.json` depuis le Sheet
2. lancer :
   - `pnpm.cmd test:route`
   - `pnpm.cmd validate:route`
   - `pnpm.cmd build`
3. vérifier que `MOMENT_ID` ne traverse pas un bloc illogiquement
4. contrôler visuellement les grosses cartes séquence dans l’app
5. commit + push sur `agent/initial-scaffold`
6. donner au user :

```powershell
git pull origin agent/initial-scaffold
```

## État de validation connu

Avant cette nouvelle passe anti-redondance, la route validait :

`Route valide : 1028 étapes, 20 blocs.`

Attention : les dernières modifications du Sheet de cette conversation ne sont pas encore régénérées / testées dans le runtime au moment de ce handoff.

## Contraintes utilisateur importantes

- ne jamais bricoler une surcouche React pour masquer une mauvaise donnée
- rester data-driven
- ne pas traiter les cas un par un si une règle globale est possible
- l’objectif est le confort de suivi du guide complet, pas juste une réduction artificielle du nombre de cartes
- ne pas supprimer une transition nécessaire entre deux donjons
- toujours préciser rendu / prise / avancement de quête quand c’est réellement requis
- ne pas inventer de PNJ / position : utiliser uniquement les données/source existantes
