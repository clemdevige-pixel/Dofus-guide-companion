# ROUTE OPTIMIZATION WORKFLOW — Procédure opérationnelle

Ce document décrit **comment exécuter** la refonte Ganymède de `ROUTE` sans créer de dette ni de seconde vérité.

Il complète `docs/ROUTE_OPTIMIZATION.md` :
- `ROUTE_OPTIMIZATION.md` = doctrine / règles métier ;
- `ROUTE_OPTIMIZATION_WORKFLOW.md` = procédure d'exécution pour les agents.

## 1. Sources à utiliser

Ordre de priorité :

1. `ROUTE` = scope et état réellement intégré.
2. `GANYMEDE_AUDIT` = état du chantier et décisions déjà prises.
3. Ganymède GP0 / GP spécialisés = ordre de parcours et mutualisations.
4. DofusPourLesNoobs / source fiable équivalente = vérification factuelle des prérequis, PNJ, positions, drops et conditions de lancement.
5. Une source miroir/exploitable du parcours (ex. Le Zaap du Savoir) peut être utilisée pour récupérer un ordre ou des coordonnées lorsque Ganymède est difficile à lire, mais elle ne remplace pas la vérification métier.

Ne jamais reconstruire un ordre depuis la mémoire de l'agent.

## 2. Toujours travailler par paquet indivisible

Ne pas patcher 2 ou 3 quêtes d'un parcours fortement imbriqué.

Un **paquet indivisible** est la plus petite portion du parcours qui peut être réordonnée sans laisser temporairement :
- une quête rendue avant ses objectifs mutualisés ;
- une prise dupliquée ;
- un donjon à deux endroits ;
- un `STEP_ID` attaché à un autre événement métier ;
- une quête active sans représentation explicite.

Exemples :
- Astrub `On marche + Ça tombe + classe + Ça sent le gaz` = un paquet ;
- `Déjeuner + Tour du monde + Grange + Pichon + Château Ensablé` = un paquet ;
- la boucle cimetière `Légende + Repos + Invasion` = un paquet.

Le paquet passe par :

```text
cartographié → vérifié → écrit en une passe → contrôlé mécaniquement
```

## 3. Cartographier avant d'écrire

Pour chaque paquet :

1. Lire toutes les lignes actuelles concernées dans `ROUTE`.
2. Lister leurs `STEP_ID` historiques.
3. Relever l'ordre Ganymède exact.
4. Identifier :
   - prises de quête ;
   - checkpoints intermédiaires ;
   - objectifs mutualisés ;
   - rendus ;
   - donjons ;
   - quêtes laissées actives après le paquet.
5. Marquer les étapes Ganymède hors scope.
6. Vérifier les positions de lancement modifiées.
7. Vérifier si une quête d'un bloc futur déjà IN_SCOPE peut être lancée pendant ce paquet.
8. Enregistrer le résultat dans `GANYMEDE_AUDIT` avant une grosse réécriture.

## 4. Règle des STEP_ID

Un `STEP_ID` représente un **événement métier stable**, jamais une ligne physique.

### Conserver l'ID

Conserver l'ancien ID si l'événement reste le même :
- fin de la même quête ;
- même donjon validé ;
- même verrou ;
- même checkpoint métier.

### Créer un nouvel ID

Créer un nouvel ID pour :
- nouvelle prise anticipée ;
- nouveau moment de parcours mutualisé ;
- nouveau checkpoint intermédiaire ;
- nouvelle étape de reprise qui n'existait pas.

### Ne jamais faire

Ne jamais réutiliser l'ID d'une ancienne fin de quête pour une nouvelle prise de quête simplement parce que la ligne occupe le même emplacement.

## 5. POSITION, LANCEMENT et DESTINATION

Contrat strict :

- `POSITION` = position de **prise** de quête seulement.
- `LANCEMENT` = explication structurée lorsque la prise n'a pas une coordonnée unique correcte (objet, quête de classe, salle de sortie, plusieurs PNJ, etc.).
- `LANCEMENT_REQUIS=TRUE` = toute étape qui contient une vraie prise de quête.
- `DESTINATION` = prochain lieu utile du parcours, y compris farm, rendu, donjon ou checkpoint.

Ne jamais détourner `POSITION` pour obtenir un bouton `/travel`.

## 6. Attention aux écritures Google Sheets

`updateCells` ne vide pas automatiquement les cellules que l'agent omet dans une nouvelle ligne.

Conséquence : réécrire une ligne plus courte peut laisser une ancienne `POSITION`, un ancien `GOAL_ID` ou un ancien `LANCEMENT` en fin de ligne.

Après toute réécriture importante :

1. relire la plage B:Q ;
2. vérifier explicitement les colonnes K→Q ;
3. vider les anciennes cellules techniques qui ne s'appliquent plus.

Lors d'un déplacement de lignes :
- préférer petites opérations contrôlées ;
- vérifier la ligne cible après insertion ;
- ne pas supposer que les numéros de lignes historiques sont encore valides après `insertDimension` / `deleteDimension`.

Si une requête batch est rejetée, considérer qu'aucune partie du lot n'est appliquée jusqu'à vérification explicite.

## 7. Ordre de validation après chaque paquet

Après chaque paquet écrit :

1. Rechercher `#ERROR!` dans `ROUTE`.
2. Vérifier les `STEP_ID` du paquet et l'absence de doublon global.
3. Vérifier tout `LANCER` : `LANCEMENT_REQUIS=TRUE` + `POSITION` ou `LANCEMENT`.
4. Vérifier que les `POSITION` et `DESTINATION` sont des coordonnées valides lorsqu'elles sont renseignées.
5. Vérifier les `GOAL_ID / GOAL_PHASE` touchés.
6. Vérifier qu'aucune ancienne prise/fin n'existe encore ailleurs.
7. Vérifier les quêtes hors scope explicitement exclues.
8. Exporter le Sheet et lancer l'audit mécanique global.

Un paquet n'est considéré intégré que si ce contrôle est vert.

## 8. Validation mécanique globale minimale

Avant de poursuivre après un gros déplacement :

- 0 `STEP_ID` vide sur une étape runtime ;
- 0 `STEP_ID` dupliqué ;
- 0 `#ERROR!` ;
- 0 lancement incomplet ;
- 0 `POSITION` invalide ;
- 0 `DESTINATION` invalide ;
- cycles `GOAL_ID` cohérents ;
- exactement 1 `FIN` ;
- `FIN` reste la dernière étape métier.

Puis, à la fin d'un bloc :

```bash
pnpm export:route
pnpm test:route
pnpm validate:route
pnpm build
```

Ne pas marquer `INTÉGRÉ` tant que `data/route.json` n'est pas régénéré depuis le Sheet et que les validations ne sont pas vertes.

## 9. Mutualisation : preuve minimale

Une mutualisation n'est pas validée parce que deux quêtes ont le même PNJ ou la même carte.

Il faut démontrer au moins :
- les deux quêtes peuvent être actives simultanément ;
- l'ordre ne viole aucun prérequis ;
- le rendu différé ne bloque pas une suite ;
- le gain existe réellement (trajet, combat, donjon, drop, craft ou ressource).

Si l'information manque : ne pas inventer. Noter le point dans `GANYMEDE_AUDIT` et conserver l'ordre sûr.

## 10. Gestion du scope

Avant d'importer une étape Ganymède :

```text
quête déjà présente quelque part dans ROUTE ?
├─ oui → IN_SCOPE, lancement éventuellement déplaçable
└─ non → vérifier exception/support
        ├─ support nécessaire à une étape IN_SCOPE → documenter avant ajout
        ├─ EXCEPTION_PARANGON → autorisé uniquement selon la doctrine Vulbis
        └─ sinon → OUT_OF_SCOPE
```

Ne jamais importer automatiquement les quêtes que GP0 fait « au passage ».

## 11. Méthode de fin de bloc

Pour passer `EN AUDIT → VALIDÉ` :
- ordre complet du bloc cartographié ;
- toutes les mutualisations importantes vérifiées ;
- exclusions de scope consignées ;
- aucune supposition restante sur un lancement ou prérequis critique.

Pour passer `VALIDÉ → INTÉGRÉ` :
- `ROUTE` réécrit ;
- audit mécanique vert ;
- `data/route.json` régénéré ;
- tests/validation/build verts ;
- `GANYMEDE_AUDIT` mis à jour avec ce qui est réellement intégré.

## 12. Handoff obligatoire

Si un agent s'arrête au milieu d'un bloc, mettre à jour `GANYMEDE_AUDIT` avec :
- dernier paquet réellement intégré ;
- prochain paquet indivisible ;
- source utilisée ;
- exclusions déjà décidées ;
- anomalies découvertes ;
- état du dernier audit mécanique.

Ne jamais écrire « bloc presque fini » sans préciser ce qui reste exact.