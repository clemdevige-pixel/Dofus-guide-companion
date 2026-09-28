# ROUTE OPTIMIZATION — Dofus Guide Companion

## 1. Statut actuel

La route Astrub → Dofus Sylvestre est **certifiée sur son périmètre métier** et ne doit plus être réoptimisée globalement sans défaut joueur concret.

Ce document devient une **doctrine de maintenance** : il explique comment préserver la cohérence si une correction route est réellement nécessaire.

État de référence :
- 1009 étapes ;
- 20 blocs ;
- ordre métier certifié ;
- anti-régressions actifs ;
- source éditoriale = Google Sheet `ROUTE` ;
- runtime = `data/route.json` généré.

## 2. Objectif d’une optimisation

Une optimisation doit réduire au moins un coût réel :
- aller-retour inutile ;
- donjon refait évitable ;
- prise tardive ;
- rendu/reprise artificiellement séparé ;
- carte administrative sans valeur joueur ;
- texte redondant ;
- erreur factuelle pouvant provoquer un blocage.

Une différence avec Ganymède n’est pas automatiquement une erreur.

Une modification n’est acceptable que si elle reste compatible avec :
- prérequis réels ;
- ordre relatif Ganymède ;
- mutualisations déjà validées ;
- Ocre / Alignement / Ordres / Dofus concernés ;
- nombre réel de passages donjon ;
- continuité stricte du guide.

## 3. Sources

### Scope / intégration
Google Sheet `ROUTE`.

### Ordre / fenêtres / mutualisations
Ganymède GP0 + guides spécialisés.

### Vérification factuelle
DofusPourLesNoobs et sources fiables équivalentes.

Ne jamais reconstruire un ordre, prérequis ou checkpoint depuis la mémoire de l’agent.

## 4. Unité de travail : le moment joueur

Une carte représente un **moment joueur**, pas nécessairement une ligne Sheet.

Si plusieurs lignes techniques forment un seul moment indivisible, utiliser explicitement :
- `MOMENT_ID` ;
- `DISPLAY_ROLE`.

Règles :
- `OBJECTIVE` = sous-objectif significatif / checkbox ;
- `TRANSITION` = action intermédiaire nécessaire ;
- `DETAIL` = information attachée à l’objectif précédent ;
- maximum 5 `OBJECTIVE` par carte ;
- une ligne sans `MOMENT_ID` reste autonome.

Aucun regroupement heuristique côté React.

## 5. Anti-redondance joueur

Une information utile ne doit apparaître qu’une fois.

À supprimer :
- commentaires de routing/audit ;
- répétition de `LANCER / TERMINER / AVANCER` dans le titre alors que l’action est déjà affichée ;
- suffixes éditoriaux de passage/checkpoint dans le titre joueur ;
- “PASSAGE #N” affiché au joueur ;
- rappel de la fin de la carte précédente ;
- carte autonome purement administrative absorbable dans le moment voisin.

À conserver :
- STOP ;
- capture Ocre réellement utile ;
- interaction critique de sortie ;
- objet à conserver ;
- condition de combat ;
- transition indispensable ;
- position utile.

Le détail fin de quête reste sur DPLN. Le Companion ne cherche pas à recopier tout le walkthrough.

## 6. Titres

La donnée brute peut conserver un titre éditorial descriptif.

Le titre joueur est normalisé au runtime par `getPlayerFacingStepTitle()`.

Ne pas réécrire massivement les titres du Sheet uniquement pour un besoin d’affichage.

Les cartes composites réellement significatives gardent leur suffixe.

## 7. Donjons / mutualisations

Ne fusionner deux passages que si les quêtes peuvent réellement coexister au même moment.

Pour chaque repassage envisagé :
- vérifier les prérequis ;
- vérifier les quêtes actives ;
- vérifier captures/idoles/items ;
- vérifier interactions post-boss ;
- vérifier sauvegardes/checkpoints ;
- vérifier la fenêtre Ganymède.

Un même boss ne suffit jamais à prouver qu’un passage peut être fusionné.

## 8. Ressources / préparation

Distinguer :
- ressource à apporter ;
- objet obtenu pendant la quête ;
- prérequis ;
- aide externe.

Les ressources pré-farmables doivent être annoncées dans une `PRÉPA` actionnable avant consommation.

Vérifier les quantités cumulées jusqu’au premier usage.

Ne pas transformer un niveau conseillé en hard lock.

## 9. Prérequis / warnings / GUIDE_ITEMS

### `prerequisites`
Conservé pour audit/validation, non rendu dans les cartes joueur.

### `warning`
Réservé aux informations critiques réellement utiles.

### `GUIDE_ITEMS`
Donnée structurée d’action courte. Ne pas l’afficher automatiquement dans une séquence uniquement pour recopier DPLN.

### `instruction`
STOP, transition ou déroulé complémentaire réellement nécessaire.

## 10. Hard locks / fils rouges / groupes parallèles

- `GOAL_ID / GOAL_PHASE` = fils rouges ;
- `PARALLEL_ID / PARALLEL_PHASE` = vraies quêtes à garder actives ensemble ;
- hard lock = blocage réel, jamais simple recommandation.

Le rappel d’un groupe parallèle ne doit apparaître que sur une carte appartenant au groupe.

Le message métier d’un hard lock doit rester visible dans une séquence.

## 11. Marqueurs visuels

Les marqueurs ne modifient pas la route :
- Alignement → `type === 'alignment'` ;
- Donjon → `type === 'dungeon'` ;
- série Dofus → `dofusSeries` / colonne `DOFUS_SERIES`.

Aucune détection par titre.

## 12. Certification

Ne jamais déclarer une route “certifiée” après quelques contrôles ciblés.

Si une correction métier rouvre un paquet :
1. identifier précisément le défaut ;
2. cartographier le paquet complet ;
3. vérifier Ganymède + source factuelle ;
4. corriger la source Sheet ;
5. adapter un test anti-régression si généralisable ;
6. réexporter ;
7. repasser tests/validation/build ;
8. certifier uniquement le périmètre réellement recontrôlé.

La certification globale actuelle ne doit être rouverte que si un défaut concret la remet en cause.

## 13. Flux obligatoire

```text
Google Sheet ROUTE
→ pnpm export:route
→ pnpm test:route
→ pnpm validate:route
→ pnpm build
→ commit / push
```

Ne jamais corriger `data/route.json` comme source éditoriale.
