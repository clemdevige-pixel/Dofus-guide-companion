# ROUTE OPTIMIZATION — Dofus Guide Companion

## 1. Objectif

Transformer la route Astrub → Dofus Sylvestre en script de progression réellement optimisé, sans changer son scope fonctionnel ni créer une seconde vérité.

La route doit minimiser :

- les allers-retours inutiles ;
- les prises de quêtes tardives ;
- les donjons refaits alors que plusieurs objectifs peuvent être actifs ensemble ;
- les farms ou achats évitables lorsqu'une autre quête fournit naturellement la ressource ;
- les rendus de quête qui obligent à revenir immédiatement dans une zone déjà quittée.

Le résultat attendu n'est plus un modèle naïf `prendre → terminer → prendre → terminer`, mais un parcours linéaire :

```text
prises compatibles
→ déplacement unique
→ objectifs croisés / drops partagés
→ donjon ou combat mutualisé
→ rendus / reprises au point optimal
→ nouvelles prises
```

## 2. Sources et responsabilités

### Source de vérité du scope

Le Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`, définit ce qui appartient à notre progression.

Une quête présente chez Ganymède mais absente de notre scope n'est pas ajoutée automatiquement.

### Source d'optimisation

Ganymède, en priorité le guide principal GP0 et les guides GP spécialisés, sert à déterminer :

- l'ordre optimal des prises ;
- les quêtes à garder actives en parallèle ;
- les déplacements mutualisables ;
- les objectifs qui se recoupent ;
- les donjons à faire avec plusieurs quêtes actives ;
- les rendus différés utiles ;
- les ressources obtenues naturellement par une autre branche.

Ganymède n'écrase jamais un prérequis validé de notre route sans vérification.

### Vérification factuelle

DofusPourLesNoobs et, si nécessaire, d'autres sources de quête fiables servent à confirmer :

- prérequis ;
- PNJ / position de lancement ;
- objectifs exacts ;
- récompenses ou drops nécessaires ;
- ordre obligatoire entre deux quêtes.

## 3. Exception Vulbis / Parangon

Le scope reste Sylvestre.

Une exception est autorisée : avancer la chaîne Vulbis uniquement jusqu'au stade où le `Parangon de puissance` devient droppable, puis conserver ce fil actif pendant les donjons niveau 200.

Cette exception n'est intégrée que si ses prérequis deviennent raisonnablement accessibles dans la route optimisée. Ne pas gonfler artificiellement le scope avec une longue branche hors objectif uniquement pour débloquer le Parangon.

## 4. Unité d'optimisation

L'unité de travail n'est plus « une quête », mais un **moment de parcours**.

Un moment de parcours peut contenir :

- une ou plusieurs prises de quête ;
- une quête principale à avancer ;
- plusieurs quêtes secondaires gardées actives ;
- un objectif partagé ;
- un donjon mutualisé ;
- plusieurs reprises/rendus après ce donjon.

La route reste strictement linéaire : le joueur doit pouvoir suivre les lignes dans l'ordre sans interpréter une règle externe.

Les frontières de blocs sont éditoriales, pas des barrières d'optimisation. Si une quête déjà présente plus loin dans notre scope peut être lancée gratuitement pendant un bloc antérieur, son lancement peut être avancé. L'ancienne étape devient alors une `REPRISE` et conserve son `STEP_ID` uniquement si elle représente toujours le même événement métier. Cette règle ne permet jamais d'importer une quête hors scope.

## 5. Règles de réécriture

### 5.1 Prises anticipées

Si plusieurs quêtes sont disponibles au même moment et peuvent progresser sans se bloquer mutuellement, les lancer avant de quitter la zone.

Ne pas considérer une même coordonnée comme preuve suffisante : les prérequis et l'état des quêtes doivent permettre leur coexistence réelle.

Toute prise utilise `POSITION` (position de lancement) ou `LANCEMENT` lorsqu'une coordonnée unique n'est pas correcte. `LANCEMENT_REQUIS=TRUE` est obligatoire.

Une prise anticipée peut concerner une quête actuellement rangée dans un bloc ultérieur. Dans ce cas :

1. vérifier qu'elle existe déjà dans le scope global ;
2. placer son lancement au premier moment réellement disponible et utile ;
3. garder la quête active explicitement ;
4. convertir son ancienne prise en reprise/progression sans dupliquer la quête.

### 5.2 Destination de parcours

`DESTINATION` est distincte de `POSITION`.

- `POSITION` = endroit où la prise de quête a lieu ;
- `DESTINATION` = endroit où le joueur doit se rendre pour exécuter le moment de parcours.

Une étape sans prise de quête peut donc avoir `DESTINATION` sans `POSITION`.

Une étape de prise dont l'objectif immédiat se trouve au même endroit peut avoir les deux champs identiques.

Ne jamais mettre une coordonnée de farm, d'atelier, de rendu ou de simple progression dans `POSITION` uniquement pour permettre à l'UI de proposer `/travel`.

### 5.3 Quêtes parallèles

Une quête lancée mais non terminée doit être représentée explicitement :

- `LANCER / STOP` ou `LANCER / FIL ROUGE` au départ ;
- `REPRISE / AVANCER` pendant sa progression ;
- `REPRENDRE / TERMINER` au moment optimal.

Ne jamais masquer une quête active derrière une note éditoriale.

### 5.4 Donjons

Avant chaque donjon, rechercher toutes les quêtes de notre scope pouvant exploiter le même passage.

Le donjon n'est exécuté que lorsque les quêtes compatibles nécessaires sont au bon checkpoint, sauf raison structurelle documentée imposant plusieurs passages.

### 5.5 Ressources

Avant de demander un achat ou un farm, vérifier si une quête déjà dans la route fournit la ressource avant son utilisation.

Préférer la récupération naturelle lorsque cela ne crée pas de détour supérieur.

### 5.6 Rendus

Ne pas rendre systématiquement une quête dès que ses objectifs sont terminés.

Si Ganymède montre qu'un rendu plus tardif évite un aller-retour sans bloquer la progression, déplacer le rendu au point optimal.

### 5.7 Scope

Toute étape Ganymède doit être classée :

- `IN_SCOPE` : nécessaire à notre route ;
- `SUPPORT` : non obligatoire mais utile pour mutualiser une étape déjà nécessaire ;
- `OUT_OF_SCOPE` : ignorée ;
- `EXCEPTION_PARANGON` : branche Vulbis autorisée jusqu'au déblocage du drop.

Une étape `OUT_OF_SCOPE` ne doit pas entrer dans `ROUTE` uniquement parce qu'elle est présente dans GP0.

## 6. Méthode bloc par bloc

Le chantier est suivi dans l'onglet `GANYMEDE_AUDIT` du Sheet.

Statuts :

```text
À AUDITER
→ EN AUDIT
→ VALIDÉ
→ INTÉGRÉ
```

Pour chaque bloc :

1. Lire le bloc actuel complet dans `ROUTE`.
2. Identifier les guides GP Ganymède couvrant son contenu.
3. Relever l'ordre réel de déplacement et les prises anticipées.
4. Filtrer strictement les quêtes hors scope.
5. Vérifier aussi les quêtes de blocs ultérieurs déjà dans le scope qui pourraient être lancées pendant ce parcours.
6. Construire les groupes de quêtes pouvant coexister.
7. Chercher les objectifs, drops, PNJ et donjons communs.
8. Vérifier les prérequis et positions des prises modifiées.
9. Attribuer `DESTINATION` aux moments de parcours qui ont une cible géographique.
10. Réécrire le bloc ligne par ligne, sans règle implicite.
11. Préserver les `STEP_ID` historiques sur le même événement métier ; créer de nouveaux IDs pour les nouveaux moments de parcours.
12. Vérifier que chaque prise a `POSITION` ou `LANCEMENT` et `LANCEMENT_REQUIS=TRUE`.
13. Vérifier les cycles `GOAL_ID / GOAL_PHASE` des fils rouges, y compris ceux qui traversent plusieurs blocs.
14. Exporter le Sheet via `pnpm export:route`.
15. Lancer la validation/tests/build avant de marquer le bloc `INTÉGRÉ`.

## 7. Critères de validation d'une mutualisation

Une mutualisation est acceptée seulement si :

- les quêtes peuvent réellement être actives en même temps ;
- aucun prérequis n'est déplacé après son usage ;
- aucun rendu anticipé ne ferme une autre branche ;
- le gain est concret : trajet, combat, donjon, farm ou ressource évité ;
- la route reste compréhensible ligne par ligne ;
- les informations de lancement et de destination restent structurées.

En cas de doute, conserver l'ordre actuel et marquer le point à vérifier dans `GANYMEDE_AUDIT` plutôt que supposer.

## 8. Modèle de données et UI

Le modèle de route doit rester indépendant de l'UI.

La refonte d'ordre peut produire davantage d'étapes `LANCER`, `REPRISE`, `FIL ROUGE`, `PASSAGE MUTUALISÉ` et `GROSSE ÉTAPE` sans ajouter de logique spécifique par quête dans React.

La future UI devra privilégier `destination` pour le prochain déplacement et conserver `location` pour expliquer/copier la position de lancement d'une quête. Elle ne doit jamais reconstruire ces informations depuis `title` ou `instruction`.

Une future évolution UI pourra représenter une **étape de parcours** avec plusieurs quêtes concernées, mais cette information devra être structurée dans le modèle avant d'être rendue. Ne jamais reconstruire les regroupements en parsant `title` ou `instruction`.

L'UI ne doit être adaptée qu'après stabilisation du nouveau contrat de données afin d'éviter une surcouche provisoire.

## 9. Contrôle final global

Après les 20 blocs :

- comparer le parcours complet à GP0 ;
- vérifier qu'aucune quête obligatoire de notre scope n'a disparu ;
- vérifier qu'aucune quête hors scope n'a été ajoutée par accident ;
- vérifier les prises déplacées entre blocs et l'absence de doubles lancements ;
- vérifier tous les passages de donjons répétés et justifier ceux qui restent ;
- vérifier toutes les prises de quête ;
- vérifier toutes les destinations structurées utiles ;
- vérifier les fils rouges ;
- vérifier le chemin jusqu'au vrai Dofus Sylvestre ;
- régénérer `data/route.json` uniquement depuis le Sheet ;
- lancer validation, tests et build.

Le Google Sheet reste l'unique source éditoriale. `data/route.json` est toujours un artefact généré, jamais édité manuellement pour corriger la route.
