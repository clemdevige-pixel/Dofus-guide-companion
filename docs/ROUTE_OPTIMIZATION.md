# ROUTE OPTIMIZATION — Dofus Guide Companion

## 1. Objectif

Transformer la route Astrub → Dofus Sylvestre en script de progression réellement optimisé, sans changer son scope fonctionnel ni créer une seconde vérité.

La route doit minimiser :
- les allers-retours inutiles ;
- les prises tardives ;
- les donjons refaits inutilement ;
- les farms/achats évitables ;
- les rendus qui provoquent un retour immédiat ;
- la fragmentation artificielle d'un même moment joueur en plusieurs cartes ;
- les redites intra-carte ;
- les redites entre cartes adjacentes ;
- les erreurs factuelles pouvant provoquer un blocage ou un nouveau passage de donjon.

Le résultat attendu est un parcours linéaire :

```text
prises compatibles
→ déplacement unique
→ objectifs croisés / drops partagés
→ donjon ou combat mutualisé
→ transitions obligatoires uniquement
→ rendus / reprises au point optimal
→ nouvelles prises
```

Une route optimisée n'est pas automatiquement une route **certifiée** : la certification factuelle exhaustive est une passe finale distincte.

## 2. Sources et responsabilités

### Scope
Le Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`, définit ce qui appartient à la progression.

### Optimisation / trame
Ganymède (GP0 + guides spécialisés) sert à déterminer l'ordre de parcours, les prises anticipées, les quêtes à garder actives, les mutualisations et les rendus différés.

Ganymède est un **squelette d'ordre**, pas un template à copier. Le Companion conserve son wording, sa granularité et son scope.

### Vérification factuelle
DofusPourLesNoobs et sources fiables équivalentes servent à confirmer prérequis, PNJ, positions, drops, ressources, conditions de combat, interactions de sortie et ordre obligatoire.

Ne jamais reconstruire un ordre ou une donnée factuelle depuis la mémoire de l'agent.

## 3. Unité d'optimisation : le moment joueur

L'unité de travail n'est plus « une quête » ni « une ligne Sheet », mais un **moment joueur**.

Un moment peut contenir :
- une ou plusieurs prises ;
- plusieurs checkpoints ;
- un donjon ;
- plusieurs rendus/reprises ;
- un lancement immédiat de la suite ;
- plusieurs lignes techniques nécessaires au suivi stable.

Quand plusieurs lignes appartiennent à un même moment, elles partagent explicitement le même `MOMENT_ID`.

### Règle cardinale

**Une carte UI doit correspondre à un moment joueur, pas à une ligne technique.**

Exemple :

```text
DONJON
→ parler au PNJ de sortie
→ terminer la quête
→ lancer immédiatement la suivante
```

Si, pour le joueur, cet enchaînement est indivisible, les lignes techniques doivent partager un `MOMENT_ID` commun.

Il n'existe plus de regroupement automatique : une ligne sans `MOMENT_ID` est une carte autonome. Toute mutualisation voulue doit être explicite dans `ROUTE`.

## 4. Rendu cible d'une carte mutualisée

Une carte mutualisée ne reproduit pas les micro-étapes techniques.

### 4.1 Contexte avant action

Avant les objectifs, afficher seulement lorsque pertinent :
- `PRÉREQUIS` : ce qui doit déjà être vrai / possédé ;
- `À SAVOIR` : contrainte ou avertissement utile avant l'action.

Ces deux informations sont des données séparées. Elles ne doivent pas être recopiées dans `SUITE / STOP` uniquement parce que l'UI ne les affiche pas encore correctement.

### 4.2 Objectifs principaux

Un objectif principal est une action significative à cocher :
- faire un donjon ;
- terminer une vraie étape de quête ;
- faire un combat/objectif majeur ;
- accomplir une action structurante.

**1 checkbox = 1 sous-objectif significatif.**

Le premier membre d'un `MOMENT_ID` est toujours `OBJECTIVE`. Chaque nouvel `OBJECTIVE` ouvre une nouvelle checkbox ; `TRANSITION` et `DETAIL` se rattachent à l'objectif précédent.

Exemple cible :

```text
☐ Shin Larve — Donjon des Larves · capturer pour l’Ocre
→ Retourner voir Pat Akess [x,y] — rendre Shin Larve puis prendre Rakoopeur
☐ Rakoopeur — Refuge Sylvestre · capturer pour l’Ocre
→ Retourner voir Pat Akess [x,y] — rendre Rakoopeur puis prendre Craqueleur Légendaire
☐ Craqueleur Légendaire — prendre l’objectif puis STOP
```

### 4.3 Transitions obligatoires

Une transition est affichée **sans checkbox** uniquement si le joueur doit réellement faire quelque chose entre deux objectifs :
- rendre une quête ;
- prendre la suivante ;
- avancer une quête ;
- parler à un PNJ ;
- donner/récupérer un objet ;
- effectuer une action de sortie indispensable ;
- changer de zone/PNJ si cela est nécessaire à la compréhension.

La transition doit, quand la donnée existe, préciser :
- l'action ;
- le PNJ ;
- la position.

Une transition sans `instruction` explicite doit rester visible via ses champs structurés `action + title` ; l'UI ne doit jamais la faire disparaître silencieusement.

### 4.4 Informations critiques à conserver

Toujours conserver quand pertinent :
- capture Ocre ;
- STOP ;
- objet requis ;
- ordre obligatoire ;
- dialogue de sortie ;
- condition réelle de progression ;
- action qui doit impérativement être faite avant le prochain donjon.

### 4.5 Convention sortie de donjon

Quand une action oubliée après le boss / dans la salle de sortie peut forcer un nouveau passage ou bloquer la progression, `À SAVOIR` commence par :

```text
⚠ AVANT DE SORTIR DU DONJON — ...
```

Cette convention n'est utilisée que si l'action :
- appartient à notre scope ;
- n'est pas automatique ;
- doit réellement être faite avant de quitter.

Ne pas importer une interaction post-boss Ganymède si elle ne sert qu'à une branche optionnelle hors scope.

### 4.6 Informations à supprimer

Supprimer toute information qui ne fait que répéter une information déjà visible ou évidente :
- `REPRENDRE / FAIRE` si l'objectif indique déjà quoi faire ;
- `FAIRE & VALIDER` si le donjon est déjà nommé comme objectif ;
- « quête terminée » sans action supplémentaire ;
- « retourne voir X » répété dans deux lignes successives ;
- une carte autonome de rendu/reprise si elle peut devenir une transition dans la carte adjacente ;
- la fin d'une carte répétée au début de la suivante ;
- commentaires d'audit ou références internes à Ganymède/blocs/lignes.

**Une information utile ne doit apparaître qu'une fois dans le flux joueur.**

## 5. Frontières de blocs

Les blocs sont éditoriaux, pas des barrières d'optimisation.

Une quête déjà IN_SCOPE peut être lancée plus tôt si :
1. elle est réellement disponible ;
2. son lancement précoce apporte un gain ;
3. aucun prérequis/état n'est cassé ;
4. l'ancienne prise est transformée en reprise au lieu d'être dupliquée.

## 6. Passes globales obligatoires

Après la première linéarisation, la route doit être auditée par **passes globales**, et pas seulement bloc par bloc.

### Passe A — scope / prérequis réels
- supprimer les faux bloqueurs ;
- distinguer niveau recommandé, niveau minimum réel et verrou réellement structurant ;
- ne jamais créer un `VERROU DUR` uniquement parce qu'un niveau personnage est indiqué ;
- vérifier métier, timer, succès, accès, objet, état de quête et conditions réellement bloquantes.

### Passe B — prises / reprises
- chercher les prises qui doivent être avancées ;
- chercher les quêtes lancées deux fois ;
- vérifier tous les `LANCER`, `LANCER LES 2/4`, objets de lancement et salles de sortie ;
- conserver les `STEP_ID` sur le même événement métier uniquement.

### Passe C — donjons / mutualisations
- pour chaque donjon, lister toutes les quêtes pouvant exploiter le même passage ;
- justifier explicitement chaque repassage restant ;
- vérifier captures Ocre, idoles, dialogues de sortie, drops et sauvegardes ;
- confronter chaque mutualisation à l'ordre Ganymède pour éviter les dépendances circulaires.

### Passe D — moments / cartes
- inspecter tous les `TERMINER + LANCER` ;
- inspecter `donjon → reprise → suite` ;
- inspecter les chaînes Tour/Emma/Alain/Thelma/Anne/Lorie et équivalentes ;
- ajouter `MOMENT_ID` lorsqu'un seul moment joueur est encore fragmenté en plusieurs lignes ;
- vérifier que tout `MOMENT_ID` commence par `OBJECTIVE` et que chaque ligne du moment possède un `DISPLAY_ROLE`.

### Passe E — fils rouges / verrous
- vérifier `start → progress → finish` ;
- vérifier les hard locks associés ;
- détecter les goals ouverts sans fermeture ou fermés avant usage ;
- vérifier qu'un verrou arrive au dernier moment utile, pas trop tôt ;
- conserver le comportement de verrou même lorsqu'un hard lock appartient à une carte mutualisée.

### Passe F — continuité finale
- vérifier qu'une ligne peut être suivie strictement sans interprétation externe ;
- vérifier qu'aucune instruction « fais X puis reprends Y plus tard » n'est laissée sans étapes explicites ;
- vérifier la continuité jusqu'au Dofus Sylvestre final.

### Passe G — anti-redondance / confort joueur
Cette passe est obligatoire après la mutualisation structurelle.

Pour **chaque carte** puis **chaque paire de cartes adjacentes** :
1. identifier les objectifs significatifs ;
2. convertir les rendus/prises/avancées indispensables en transitions compactes ;
3. supprimer les cartes purement administratives absorbables ;
4. supprimer les phrases doublonnées dans une même carte ;
5. supprimer toute répétition de la fin de la carte N au début de N+1 ;
6. conserver uniquement les notes critiques ;
7. vérifier que le joueur sait toujours exactement quoi faire entre deux donjons.

Cette passe vise simultanément :
- **moins de cartes** ;
- **moins de texte** ;
- **aucune perte d'action nécessaire**.

### Passe H — certification factuelle exhaustive

Cette passe est obligatoire avant de qualifier la route de « certifiée ».

Pour **chaque carte**, contrôler au minimum :
- prérequis réellement disponibles à cet instant ;
- ressources / quantités / consommation ;
- lancement ;
- checkpoint ;
- boss/donjon ;
- action avant boss ;
- action post-boss / sortie ;
- capture Ocre réellement utile ;
- rendu ;
- mutualisation et repassages ;
- compatibilité avec la trame Ganymède ;
- scope ;
- placement de chaque information dans le bon champ.

Priorité absolue aux erreurs qui peuvent provoquer :
- blocage ;
- donjon à refaire ;
- pierre d'âme gaspillée ;
- ressource consommée trop tôt ;
- quête lancée/rendue au mauvais moment ;
- mutualisation impossible.

## 7. Règles de réécriture

### 7.1 Prises anticipées
Toute prise utilise `POSITION` ou `LANCEMENT`, avec `LANCEMENT_REQUIS=TRUE`.

### 7.2 Destination
`POSITION` = prise de quête.
`DESTINATION` = prochain lieu utile du moment.

Ne jamais détourner `POSITION` pour un farm, atelier, rendu ou donjon.

### 7.3 Quêtes parallèles
Une quête laissée active doit être représentée explicitement :
- `LANCER / STOP` ou `LANCER / FIL ROUGE` ;
- `REPRENDRE / AVANCER` ;
- `REPRENDRE / TERMINER`.

Ces états techniques ne sont pas forcément des cartes ou checkboxes : ils peuvent être rendus comme transitions si c'est plus lisible.

### 7.4 Donjons
Le donjon n'est fait que lorsque les fils compatibles sont prêts, sauf repassage structurel documenté.

Ne jamais fusionner deux passages uniquement parce que les boss sont identiques : les quêtes doivent réellement pouvoir coexister au moment concerné.

### 7.5 Ressources
Avant tout achat/farm, vérifier si une quête précédente fournit la ressource naturellement.

Vérifier les quantités **cumulées jusqu'au point de consommation** : une ressource préparée puis consommée plus tôt n'est plus disponible pour une quête tardive.

### 7.6 Rendus
Différer un rendu s'il évite un retour sans bloquer la suite. Si le rendu est nécessaire entre deux objectifs, le présenter comme transition compacte plutôt que comme carte autonome lorsque possible.

### 7.7 MOMENT_ID
Attribuer un `MOMENT_ID` partagé lorsque plusieurs lignes techniques représentent un seul moment joueur.

Règles :
- contigu ;
- même bloc ;
- pas de réutilisation plus loin ;
- chaque membre possède un `DISPLAY_ROLE` ;
- le premier membre est `OBJECTIVE` ;
- une ligne sans `MOMENT_ID` reste une carte autonome ;
- ne jamais reconstruire le regroupement depuis le texte, le type ou la proximité côté React.

### 7.8 PRÉREQUIS / À SAVOIR

`PRÉREQUIS / RESSOURCES` = conditions déjà satisfaites avant la carte.  
`À SAVOIR` = contexte/alerte avant action.

Ne pas y laisser :
- commentaires d'audit ;
- références à des numéros de bloc/ligne ;
- actions principales qui devraient être dans `GUIDE_ITEMS` ou `SUITE / STOP`.

### 7.9 Scope
Classer les éléments Ganymède :
- `IN_SCOPE` ;
- `SUPPORT` ;
- `OUT_OF_SCOPE` ;
- `EXCEPTION_PARANGON`.

## 8. Exception Vulbis / Parangon

L'exception reste limitée au strict nécessaire pour rendre le Parangon de puissance droppable, puis la quête reste active pendant les gardiens 200 de la route.

Ne pas poursuivre le Vulbis dans cette roadmap.

## 9. Critères de validation d'une mutualisation

Une mutualisation est acceptée seulement si :
- les quêtes peuvent être actives simultanément ;
- aucun prérequis n'est déplacé après usage ;
- aucun rendu ne ferme une autre branche ;
- le gain est réel ;
- la route reste exécutable ligne par ligne ;
- lancements/destinations restent structurés ;
- les transitions obligatoires restent visibles ;
- aucune redite inutile n'est ajoutée ;
- la trame Ganymède ne place pas le second objectif derrière la fermeture obligatoire du premier.

En cas de doute : conserver l'ordre sûr et documenter le point au lieu d'inventer.

## 10. Décisions certifiées à ne pas rouvrir sans preuve

### Totems de Maïmane
- Joie = Klime dédié ;
- Peur = Koutoulou dédié ;
- Colère = Dazak dédié ;
- Dégoût = Nileza dédié ;
- Tristesse = Vortex mutualisé ;
- Surprise = Comte Harebourg mutualisé.

4 repassages dédiés restent nécessaires dans la trame actuelle.

### Forgerons / Bworks
Optimum : **1 Donjon des Forgerons + 1 Donjon des Bworks**.

Le Liquide des Forgerons est précollecté pendant l'unique passage Forgerons et conservé pour l'alignement ultérieur.

### Minotoror
Ne pas capturer le Minotoror au passage : prendre la sauvegarde vers Minotot.

### Grand Ougah
Attendre la convergence `Assassin Suprême + Un pouvoir mérydique` et ne faire qu'un passage partagé.

## 11. Contrôle final global

Après les 20 blocs :
- vérifier scope complet ;
- vérifier doubles lancements et prises déplacées ;
- vérifier tous les repassages de donjon ;
- vérifier tous les `MOMENT_ID` / `DISPLAY_ROLE` ;
- vérifier tous les `TERMINER + LANCER` ;
- vérifier tous les hard locks ;
- vérifier les fils rouges ;
- faire la passe anti-redondance carte par carte et entre cartes adjacentes ;
- faire la **certification factuelle exhaustive** ;
- vérifier les alertes `⚠ AVANT DE SORTIR DU DONJON` ;
- vérifier le rendu réel des transitions et des objectifs-donjons ;
- vérifier la continuité jusqu'au vrai Dofus Sylvestre ;
- régénérer `data/route.json` uniquement depuis le Sheet ;
- lancer tests, validation, build et check Tauri.

Le Google Sheet reste l'unique source éditoriale. `data/route.json` n'est jamais corrigé manuellement.
