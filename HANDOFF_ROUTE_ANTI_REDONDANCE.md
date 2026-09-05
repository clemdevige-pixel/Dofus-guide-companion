# HANDOFF — Route anti-redondance / cohérence globale

## Statut

**CHANTIER TERMINÉ — document conservé uniquement comme trace de méthode.**

Ne pas utiliser ce fichier pour décider du prochain chantier produit. Le handoff opérationnel actuel est `HANDOFF.md` et le repo de la branche `agent/initial-scaffold` reste la source de vérité technique.

## Contrat final conservé

La passe anti-redondance a abouti au contrat suivant :

- `MOMENT_ID` = frontière autoritaire d'une carte ;
- `DISPLAY_ROLE` = structure interne (`OBJECTIVE`, `TRANSITION`, `DETAIL`) ;
- une ligne sans `MOMENT_ID` reste une carte autonome ;
- maximum 5 objectifs par carte ;
- aucune heuristique de regroupement depuis les titres/instructions ;
- `PARALLEL_ID / PARALLEL_PHASE` = lifecycle des vraies salves de quêtes conjointes ;
- le rappel parallèle est contextuel à la carte visible ;
- les rendus/prises administratifs absorbables doivent être des transitions, pas des cartes dédiées ;
- les longues cartes sont scindées uniquement sur une frontière joueur naturelle ;
- l'objectif est moins de bruit sans perte d'action nécessaire.

## État final du chantier

Déjà réalisé :

- audit des chaînes répétitives et transitions `TERMINER + LANCER` ;
- mutualisations donjon → reprise → suite ;
- audit global des cartes trop denses ;
- scissions des cas lourds sur frontières naturelles ;
- 24 groupes parallèles structurés et validés ;
- suppression des rappels parallèles hors contexte ;
- nettoyage des principaux titres et libellés pseudo-meta ;
- plafond de 5 objectifs protégé par validation ;
- CI couvrant selectors, rôles d'affichage, groupes parallèles et validation de route.

Le snapshot historique `986 étapes / 354 cartes` cité dans une ancienne version de ce document est **obsolète**. Après les passes ressources et éditoriales suivantes, le runtime a évolué. Se fier au `data/route.json` courant et à `HANDOFF.md`.

## Ne pas relancer automatiquement

Ne pas reprendre une nouvelle passe globale de densité/anti-redondance sans défaut joueur concret identifié.

Si une carte pose problème :
1. partir de l'exemple précis ;
2. vérifier le Sheet et le rendu runtime actuel ;
3. corriger le moment concerné ;
4. préserver `STEP_ID`, `MOMENT_ID`, `DISPLAY_ROLE` et les lifecycles lorsque leur sémantique ne change pas ;
5. relancer les contrôles route.

## Références actuelles

Pour toute intervention, lire :

1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md`
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
7. `HANDOFF.md`
