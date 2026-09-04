# ROUTE OPTIMIZATION — Dofus Guide Companion

## 1. Objectif

Transformer la route Astrub → Dofus Sylvestre en script de progression réellement optimisé, sans changer son scope fonctionnel ni créer une seconde vérité.

La route doit minimiser :
- les allers-retours inutiles ;
- les prises tardives ;
- les donjons refaits inutilement ;
- les farms/achats évitables ;
- les rendus qui provoquent un retour immédiat ;
- la fragmentation artificielle d'un même moment joueur en plusieurs cartes.

Le résultat attendu est un parcours linéaire :

```text
prises compatibles
→ déplacement unique
→ objectifs croisés / drops partagés
→ donjon ou combat mutualisé
→ rendus / reprises au point optimal
→ nouvelles prises
```

## 2. Sources et responsabilités

### Scope
Le Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`, définit ce qui appartient à la progression.

### Optimisation
Ganymède (GP0 + guides spécialisés) sert à déterminer l'ordre de parcours, les prises anticipées, les quêtes à garder actives, les mutualisations et les rendus différés.

### Vérification factuelle
DofusPourLesNoobs et sources fiables équivalentes servent à confirmer prérequis, PNJ, positions, drops, conditions et ordre obligatoire.

Ne jamais reconstruire un ordre depuis la mémoire de l'agent.

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

Le regroupement automatique par paquets est seulement un fallback pour les étapes ordinaires ; il ne doit jamais remplacer un regroupement éditorial explicite.

## 4. Frontières de blocs

Les blocs sont éditoriaux, pas des barrières d'optimisation.

Une quête déjà IN_SCOPE peut être lancée plus tôt si :
1. elle est réellement disponible ;
2. son lancement précoce apporte un gain ;
3. aucun prérequis/état n'est cassé ;
4. l'ancienne prise est transformée en reprise au lieu d'être dupliquée.

## 5. Passes globales obligatoires

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
- vérifier captures Ocre, idoles, dialogues de sortie, drops et sauvegardes.

### Passe D — moments / cartes
- inspecter tous les `TERMINER + LANCER` ;
- inspecter `donjon → reprise → suite` ;
- inspecter les chaînes Tour/Emma/Alain/Thelma/Anne/Lorie et équivalentes ;
- ajouter `MOMENT_ID` lorsqu'un seul moment joueur est encore fragmenté en plusieurs lignes ;
- ne pas compter sur une limite automatique de 8 étapes pour définir les cartes.

### Passe E — fils rouges / verrous
- vérifier `start → progress → finish` ;
- vérifier les hard locks associés ;
- détecter les goals ouverts sans fermeture ou fermés avant usage ;
- vérifier qu'un verrou arrive au dernier moment utile, pas trop tôt.

### Passe F — continuité finale
- vérifier qu'une ligne peut être suivie strictement sans interprétation externe ;
- vérifier qu'aucune instruction « fais X puis reprends Y plus tard » n'est laissée sans étapes explicites ;
- vérifier la continuité jusqu'au Dofus Sylvestre final.

## 6. Règles de réécriture

### 6.1 Prises anticipées
Toute prise utilise `POSITION` ou `LANCEMENT`, avec `LANCEMENT_REQUIS=TRUE`.

### 6.2 Destination
`POSITION` = prise de quête.
`DESTINATION` = prochain lieu utile du moment.

Ne jamais détourner `POSITION` pour un farm, atelier, rendu ou donjon.

### 6.3 Quêtes parallèles
Une quête laissée active doit être représentée explicitement :
- `LANCER / STOP` ou `LANCER / FIL ROUGE` ;
- `REPRENDRE / AVANCER` ;
- `REPRENDRE / TERMINER`.

### 6.4 Donjons
Le donjon n'est fait que lorsque les fils compatibles sont prêts, sauf repassage structurel documenté.

### 6.5 Ressources
Avant tout achat/farm, vérifier si une quête précédente fournit la ressource naturellement.

### 6.6 Rendus
Différer un rendu s'il évite un retour sans bloquer la suite.

### 6.7 MOMENT_ID
Attribuer un `MOMENT_ID` partagé lorsque plusieurs lignes techniques représentent un seul objectif joueur.

Règles :
- contigu ;
- même bloc ;
- pas de réutilisation plus loin ;
- ne jamais reconstruire le regroupement depuis le texte côté React.

### 6.8 Scope
Classer les éléments Ganymède :
- `IN_SCOPE` ;
- `SUPPORT` ;
- `OUT_OF_SCOPE` ;
- `EXCEPTION_PARANGON`.

## 7. Exception Vulbis / Parangon

L'exception reste limitée au strict nécessaire pour rendre le Parangon de puissance droppable, puis la quête reste active pendant les gardiens 200 de la route.

Ne pas poursuivre le Vulbis dans cette roadmap.

## 8. Critères de validation d'une mutualisation

Une mutualisation est acceptée seulement si :
- les quêtes peuvent être actives simultanément ;
- aucun prérequis n'est déplacé après usage ;
- aucun rendu ne ferme une autre branche ;
- le gain est réel ;
- la route reste exécutable ligne par ligne ;
- lancements/destinations restent structurés.

En cas de doute : conserver l'ordre sûr et documenter le point au lieu d'inventer.

## 9. Contrôle final global

Après les 20 blocs :
- vérifier scope complet ;
- vérifier doubles lancements et prises déplacées ;
- vérifier tous les repassages de donjon ;
- vérifier tous les `MOMENT_ID` ;
- vérifier tous les `TERMINER + LANCER` ;
- vérifier tous les hard locks ;
- vérifier les fils rouges ;
- vérifier la continuité jusqu'au vrai Dofus Sylvestre ;
- régénérer `data/route.json` uniquement depuis le Sheet ;
- lancer tests, validation et build.

Le Google Sheet reste l'unique source éditoriale. `data/route.json` n'est jamais corrigé manuellement.