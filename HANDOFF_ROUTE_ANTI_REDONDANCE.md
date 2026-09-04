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

### Ivoire / Nordalie

Nettoyé :

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

### Passe 2026-09-04 — lignes 860 → fin

La plage `A860:S1031` a maintenant été relue jusqu’à la dernière ligne.

Nettoyages appliqués :

- fin Ivoire / début Ébène : suppression des annonces de quêtes futures injectées trop tôt dans `SUITE / STOP` ;
- `De Brikke et de Brokke` : transitions locales réécrites et anciennes anticipations supprimées ;
- `L'épée du rocher` : ouverture compactée, anciennes annonces futures retirées ;
- Ocre final / Quatre sur six / Dragons / Totems / S'armer : suppression des instructions appartenant à des séquences réellement présentes plus loin ;
- `Qui nous protège` : Nidas + Aurore Pourpre + préparation Djaul + Solar réunis sous le même `MOMENT_ID` `moment-sigils-donjons` ;
- notes critiques qui étaient seulement dans `⚠️ À SAVOIR` réinjectées dans `SUITE / STOP` quand elles doivent réellement être visibles dans l'app : Skeunk, Crocabulia, Dazak, Klime, Dantinéa, Bouftou Royal ;
- Dragons : transition Rosal réécrite pour prendre les 4 quêtes, terminer le Dragon des eaux et garder les 3 autres actives.

Normalisation globale de bruit éditorial :

- `FAIRE & VALIDER` → `FAIRE` dans `ACTION`, y compris dans les formules génératrices ;
- `REPRENDRE / FAIRE` → `FAIRE` ;
- `REPRENDRE / TERMINER` → `TERMINER`, y compris les variantes/formules ;
- suffixe de titre `— REPRENDRE / TERMINER` supprimé sur 111 titres ;
- suffixe `— REPRENDRE ET TERMINER` supprimé sur 42 titres ;
- les formules `HYPERLINK` ont été modifiées sans supprimer les liens.

Contrôles Sheet déjà faits après ces écritures :

- 0 `#ERROR!` dans `A5:S1031` ;
- 0 `FAIRE & VALIDER` restant dans `ACTION` ;
- 0 `REPRENDRE / TERMINER` restant dans `ACTION` ;
- 0 suffixe `REPRENDRE / TERMINER` restant dans `ÉTAPE` ;
- 0 `VERROU DUR — NIVEAU ...` détecté ;
- 0 type `RÈGLE` détecté.

### Point d'architecture découvert pendant la passe

Le runtime actuel sait regrouper une carte avec `MOMENT_ID`, mais `getSequenceObjectives()` décide encore les checkboxes principalement depuis le `type` :

- `REPRISE` devient par défaut une checkbox ;
- `DONJON` devient par défaut un détail de la checkbox précédente.

Cela ne permet pas toujours d'exprimer exactement le contrat validé `1 checkbox = 1 sous-objectif significatif`, par exemple sur une séquence Skeunk → transition → Fraktale → rendu final.

**Ne pas corriger avec des exceptions par nom de quête ou du parsing React.**

Le prochain changement code doit être une extension structurée minimale permettant à `ROUTE` d'indiquer explicitement le rôle d'une ligne dans une carte (objectif cochable vs transition/détail), tout en conservant `STEP_ID` comme vérité de progression et `MOMENT_ID` comme frontière de carte. Ne pas implémenter une heuristique supplémentaire par texte.

## Point de reprise EXACT

La passe éditoriale ciblée 860 → fin a été effectuée. Le prochain point de reprise est :

1. résoudre proprement le rôle objectif/transition dans le modèle data-driven ;
2. utiliser un cas témoin complexe (`L'épée du rocher` ou Pat Akess) pour valider le rendu ;
3. reprendre ensuite l'audit global inter-cartes sur les lignes antérieures à 860 (`REPRENDS`, `Retourne voir`, `TERMINE`, cartes administratives absorbables) ;
4. terminer la passe globale jusqu'à la première carte.

## Audit global restant

Rechercher/auditer dans tout `ROUTE` :

- `REPRENDS` dans `SUITE / STOP` : certains sont nécessaires, d'autres encore redondants ;
- `Retourne voir` ;
- `TERMINE` ;
- `GARDE la quête active` ;
- `LANCER / TERMINER` ;
- variantes techniques résiduelles dans les titres ;
- cartes `JALON` qui peuvent être absorbées.

Les vrais verrous de contenu restent conservés (tablette Totankama, Ocre d’ambre, Ocre final, alignement 100, timer vaccin, etc.).

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

**État actuel : les nouvelles modifications du Sheet décrites ci-dessus ne sont pas encore régénérées dans `data/route.json`, ni testées via `test:route`, `validate:route` et `build`. Ne pas annoncer la route synchronisée/verte avant cet export.**

## Contraintes utilisateur importantes

- ne jamais bricoler une surcouche React pour masquer une mauvaise donnée
- rester data-driven
- ne pas traiter les cas un par un si une règle globale est possible
- l’objectif est le confort de suivi du guide complet, pas juste une réduction artificielle du nombre de cartes
- ne pas supprimer une transition nécessaire entre deux donjons
- toujours préciser rendu / prise / avancement de quête quand c’est réellement requis
- ne pas inventer de PNJ / position : utiliser uniquement les données/source existantes
