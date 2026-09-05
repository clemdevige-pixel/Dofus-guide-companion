# ROUTE OPTIMIZATION WORKFLOW — Procédure opérationnelle

Ce document décrit comment exécuter les passes d'audit/réécriture de `ROUTE` sans dette ni seconde vérité.

Il complète `docs/ROUTE_OPTIMIZATION.md` :
- doctrine = `ROUTE_OPTIMIZATION.md` ;
- exécution = ce document.

## 1. Sources à utiliser

Ordre de priorité :
1. `ROUTE` = scope + état réellement intégré ;
2. `GANYMEDE_AUDIT` = historique de chantier si utilisé ;
3. Ganymède GP0 / GP spécialisés = ordre/mutualisations ;
4. DofusPourLesNoobs / source fiable = vérification factuelle ;
5. miroir exploitable uniquement en soutien, jamais comme vérité métier unique.

Ne jamais reconstruire un ordre depuis la mémoire.

## 2. Travailler par paquet indivisible

Ne pas patcher 2–3 lignes d'un parcours fortement imbriqué.

Un paquet indivisible est la plus petite portion pouvant être réordonnée sans laisser :
- une quête rendue trop tôt ;
- une prise dupliquée ;
- un donjon à deux endroits ;
- un `STEP_ID` réaffecté ;
- une quête active invisible ;
- un même moment joueur éclaté artificiellement en plusieurs cartes ;
- une transition obligatoire perdue entre deux objectifs.

Le paquet passe par :

```text
cartographié → vérifié → écrit en une passe → relu mécaniquement → relu comme un joueur
```

## 3. Cartographier avant d'écrire

Pour chaque paquet :
1. lire toutes les lignes concernées ;
2. relever les `STEP_ID` historiques ;
3. relever l'ordre source ;
4. identifier prises, checkpoints, objectifs mutualisés, donjons, rendus et suites ;
5. marquer le hors-scope ;
6. vérifier positions/lancements ;
7. vérifier les quêtes de blocs futurs déjà IN_SCOPE lançables ici ;
8. déterminer si plusieurs lignes représentent un seul **moment joueur** ;
9. décider les `MOMENT_ID` avant d'écrire ;
10. classer chaque information en **objectif principal**, **transition obligatoire** ou **redondance supprimable**.

## 4. STEP_ID et MOMENT_ID

### STEP_ID
Un `STEP_ID` représente un événement métier stable.

Conserver l'ID si l'événement reste le même. Créer un nouvel ID pour une nouvelle prise, un nouveau checkpoint ou une nouvelle étape réelle.

### MOMENT_ID
Un `MOMENT_ID` représente une frontière de carte éditoriale.

L'utiliser lorsque plusieurs lignes techniques doivent être affichées comme un seul moment joueur, notamment :
- donjon + validation de sortie ;
- fin d'une quête + lancement immédiat de la suivante ;
- transition auprès du même PNJ ;
- suite technique indivisible autour d'un boss.

Règles :
- lignes contiguës ;
- même bloc ;
- un moment fermé ne réapparaît pas ;
- pas de `MOMENT_ID` inventé côté React ;
- une ligne sans `MOMENT_ID` est explicitement une carte autonome.

`MOMENT_ID` définit la carte, mais **ne signifie pas que chaque ligne du moment doit devenir une checkbox ou être affichée textuellement telle quelle**.

## 5. Rendu cible à obtenir pendant la réécriture

Dans un moment mutualisé, produire mentalement le rendu suivant avant d'écrire la donnée :

```text
☐ OBJECTIF 1 — action réellement significative
→ TRANSITION — rendre/prendre/avancer auprès de PNJ [x,y]
☐ OBJECTIF 2 — action réellement significative
→ TRANSITION — seulement si nécessaire
☐ OBJECTIF 3 — action significative · STOP / OCRE si pertinent
```

### Checkbox
Créer un objectif joueur pour :
- donjon/combat ;
- étape de quête réellement accomplie ;
- action majeure ;
- objectif qui mérite un état de complétion distinct.

### Transition sans checkbox
Conserver une ligne intermédiaire si elle est indispensable pour passer au prochain objectif :
- rendre ;
- prendre la suite ;
- avancer la quête ;
- parler au PNJ ;
- remettre/récupérer un objet ;
- action de sortie obligatoire.

Préciser PNJ + position quand ces données sont connues.

### À ne pas afficher comme information autonome
- « FAIRE & VALIDER » si le donjon est déjà nommé ;
- « REPRENDRE / FAIRE » si l'objectif explique déjà l'action ;
- « quête terminée » sans action suivante ;
- retour PNJ répété sur la fin d'une ligne puis au début de la suivante ;
- récapitulatif d'une action déjà accomplie dans la carte précédente.

## 6. POSITION, LANCEMENT, DESTINATION, GUIDE_ITEMS

- `POSITION` = prise de quête ;
- `LANCEMENT` = méthode structurée si aucune coordonnée unique ;
- `LANCEMENT_REQUIS=TRUE` = toute vraie prise ;
- `DESTINATION` = prochain lieu utile ;
- `GUIDE_ITEMS` = actions courtes internes à un moment mutualisé.

Interdit : utiliser `POSITION` comme simple destination.

Pour la passe confort joueur, privilégier la donnée structurée existante pour les transitions. Ne jamais ajouter un parseur React de texte métier pour reconnaître les rendus ou les PNJ.

## 7. Écritures Google Sheets : nettoyage obligatoire

`updateCells` ne vide pas les cellules techniques omises.

Après toute réécriture importante :
1. relire la plage complète jusqu'à `PARALLEL_PHASE` ;
2. vérifier explicitement `STEP_ID` → `PARALLEL_PHASE` ;
3. vider les anciennes valeurs techniques résiduelles ;
4. ne jamais supposer que les anciens numéros de ligne sont encore valides après insertion/suppression.

Une requête batch rejetée doit être considérée comme non appliquée jusqu'à relecture.

## 8. Ordre de validation après chaque paquet

1. rechercher `#ERROR!` ;
2. vérifier `STEP_ID` + doublons ;
3. vérifier chaque prise ;
4. vérifier `POSITION` / `DESTINATION` ;
5. vérifier `GUIDE_ITEMS` ;
6. vérifier `GOAL_ID / GOAL_PHASE` ;
7. vérifier `MOMENT_ID / DISPLAY_ROLE` : contigu, même bloc, sémantiquement cohérent ;
8. vérifier `PARALLEL_ID / PARALLEL_PHASE` si présent ;
9. rechercher l'ancienne prise/fin ailleurs ;
10. vérifier le hors-scope ;
11. relire la carte telle qu'un joueur la verra ;
12. vérifier que chaque checkbox correspond à un objectif significatif ;
13. vérifier que chaque transition obligatoire reste explicitement visible ;
14. supprimer toute redite restante dans la carte.

## 9. Passes globales après la linéarisation

Une route peut être correcte localement et rester mauvaise globalement. Après les paquets/blocs, exécuter les passes suivantes sur **toute la route**.

### Passe 1 — faux verrous
Rechercher les hard locks de niveau personnage et autres prérequis surinterprétés.

Règle : un niveau recommandé/minimum n'est pas une raison suffisante pour créer une carte `VERROU DUR`. Le validateur rejette désormais `NIVEAU <n> — VERROU DUR`.

### Passe 2 — `TERMINER + LANCER`
Rechercher globalement toutes les transitions où la fin et la prise suivante sont un seul moment.

Pour chacune :
- vérifier la vraie disponibilité ;
- structurer la prise ;
- affecter un `MOMENT_ID` commun avec les lignes du même moment si nécessaire.

### Passe 3 — donjon → reprise → suite
Rechercher chaque boss suivi de validations/reprises immédiates.

Question obligatoire : « le joueur doit-il voir une seule carte ou plusieurs décisions distinctes ? »

Si une seule : `MOMENT_ID` explicite.

### Passe 4 — chaînes répétitives
Auditer les chaînes Emma / Alain / Thelma / Anne / Lorie / Tour / Tour du Monde et équivalentes. Elles sont particulièrement sensibles à la fragmentation `donjon → retour PNJ → lancer suite`.

### Passe 5 — goals / hard locks
Vérifier `start → progress → finish`, les verrous associés et l'ordre réel.

### Passe 6 — continuité
Parcourir la route comme un joueur : aucune règle implicite ne doit être nécessaire pour comprendre quand reprendre une quête ou quand lancer sa suite.

### Passe 7 — anti-redondance / confort joueur
Cette passe est obligatoire **lors d'une vraie réécriture structurelle**. Elle ne doit pas être relancée mécaniquement sur une route déjà close sans défaut joueur concret.

Pour une carte ou un paquet réellement problématique :
1. lister les sous-objectifs significatifs ;
2. conserver une checkbox par sous-objectif ;
3. transformer les rendus/prises/avancées nécessaires en transitions sans checkbox ;
4. supprimer les labels techniques et phrases qui répètent les objectifs ;
5. conserver Ocre/STOP/objet/ordre/condition critique ;
6. vérifier qu'une lecture rapide suffit pour jouer ;
7. comparer la fin de la carte N avec le début de N+1 ;
8. absorber les cartes purement administratives quand cela reste un seul moment joueur.

Critère de réussite : moins de bruit sans perte d'action nécessaire.

## 10. Validation mécanique globale minimale

Avant régénération finale :
- 0 `STEP_ID` vide ;
- 0 `STEP_ID` dupliqué ;
- 0 `#ERROR!` ;
- 0 lancement incomplet ;
- 0 position/destination invalide ;
- 0 `MOMENT_ID` non contigu ou multi-blocs ;
- 0 `DISPLAY_ROLE` incohérent ;
- 0 groupe parallèle au lifecycle incomplet ;
- 0 hard lock de niveau personnage ;
- cycles de goals cohérents ;
- exactement 1 `FIN`, dernière étape métier.

Puis :

```bash
pnpm export:route
pnpm test:route
pnpm validate:route
pnpm build
```

Ne pas considérer une passe intégrée tant que le JSON n'a pas été régénéré depuis le Sheet et les contrôles relancés.

## 11. Mutualisation : preuve minimale

Une mutualisation exige :
- coexistence réelle des quêtes ;
- prérequis respectés ;
- aucun rendu bloquant ;
- gain concret ;
- structure de carte compréhensible ;
- transitions nécessaires conservées ;
- absence de répétition inutile avec la carte précédente/suivante.

Si l'information manque : ne pas inventer.
