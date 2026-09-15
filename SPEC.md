# SPEC — Dofus Guide Companion

## 1. Vision

Companion desktop compact pour suivre une roadmap Dofus optimisée pendant le jeu.

Le produit est un **roadbook interactif**, pas un bot et pas un outil d’automatisation du client Dofus.

L’utilisateur doit savoir rapidement :
- quoi faire maintenant ;
- où aller ;
- quand s’arrêter ;
- quels objectifs restent actifs ;
- quel est le prochain verrou réel.

## 2. Source de vérité

Le Google Sheet `ROUTE` est la source éditoriale.

L’application consomme `data/route.json`, exporté et validé.

Aucune exception métier spécifique à une quête ne doit être codée dans React.

## 3. Stack V1

- Tauri 2
- React
- TypeScript
- Vite
- données JSON data-driven
- persistance locale

## 4. V1 — fonctionnalités obligatoires

### Overlay

- always-on-top ;
- redimensionnable ;
- déplaçable ;
- mode compact / détaillé ;
- taille et position mémorisées.

### Route

- navigation précédente / suivante ;
- saut direct par numéro de carte ;
- validation / dévalidation ;
- sous-objectifs sur cartes `MOMENT_ID` ;
- progression globale et par bloc ;
- reprise de consultation après relance.

### Cartes

Afficher uniquement ce qui aide à jouer :
- type ;
- titre court ;
- action structurante ;
- position/destination utile ;
- warning critique ;
- instruction/transition nécessaire ;
- lien DPLN.

Les blocs génériques `PRÉREQUIS` ne sont pas affichés côté joueur.

DPLN reste la source du déroulé fin d’une quête. Le Companion ne doit pas recopier inutilement toutes les micro-actions.

### Titres

Le runtime masque les suffixes éditoriaux inutiles :
- `— avancer jusqu’à...` ;
- `— reprise` ;
- métadonnées de passage de donjon (`— PASSAGE #N`) ;
- préfixe legacy `◆` sur les donjons.

Les cartes composites significatives gardent leur titre complet.

### Marqueurs visuels

Devant le titre :
- bouclier = quête d’Alignement ;
- œuf/Dofus = étape appartenant directement à une série Dofus ;
- château = étape de donjon ;
- maximum 2 marqueurs simultanés.

Les marqueurs viennent uniquement de données structurées.

### Fils rouges

Les fils rouges restent dérivés de la progression.

Ils sont consultables dans la vue secondaire et ne doivent pas polluer chaque carte sans contexte.

### Verrous durs

Un hard lock doit être visuellement explicite lorsqu’il devient courant.

Son message métier reste visible, y compris dans une séquence.

### Quêtes parallèles

Le rappel est contextuel : il n’apparaît que sur une carte appartenant réellement au groupe parallèle.

### PRÉPA

Les préparations sont affichées sous forme de checklist compacte et actionnable.

### Raccourcis

Raccourcis globaux configurables pour :
- précédent ;
- suivant ;
- valider/dévalider ;
- afficher/masquer l’overlay.

### Persistance locale

Conserver :
- progression ;
- position de consultation ;
- checklist de préparation ;
- mode compact ;
- raccourcis ;
- taille et position de fenêtre.

Aucun compte utilisateur requis en V1.

## 5. UX V1

### Mode compact

Objectif : garder l’essentiel visible avec un minimum d’encombrement.

Doivent rester accessibles :
- progression ;
- type ;
- titre ;
- action/instruction courte utile ;
- navigation.

Aucune surface secondaire ouverte par défaut.

### Mode détaillé

L’étape courante reste la zone principale.

Les vues secondaires sont accessibles depuis le drawer :
- Progression ;
- Fils rouges ;
- Prochain verrou ;
- Prépa du bloc ;
- Historique ;
- Paramètres.

Une seule vue secondaire ouverte à la fois.

### DPLN

Le titre d’une quête source est directement cliquable pour ouvrir DofusPourLesNoobs dans le navigateur système.

### `/travel`

Les coordonnées structurées utiles peuvent être copiées sous forme `/travel x y`.

## 6. Contrat des cartes mutualisées

- `MOMENT_ID` définit la carte ;
- `DISPLAY_ROLE` définit les sous-objectifs et transitions ;
- `OBJECTIVE` = checkbox ;
- `TRANSITION` / `DETAIL` = contenu rattaché sans checkbox ;
- maximum 5 objectifs par carte ;
- une carte ne doit pas répéter la même information sous plusieurs formes.

`GUIDE_ITEMS` n’est pas affiché automatiquement dans les séquences si cela ne ferait que recopier DPLN.

## 7. Types visuels minimaux

- QUÊTE
- REPRISE
- DONJON
- PRÉPA
- RÈGLE
- JALON
- FIL ROUGE
- VERROU DUR
- ALIGNEMENT
- ORDRE
- GROSSE ÉTAPE
- FIN

Le comportement vient du type/données, jamais d’un parsing du titre.

## 8. Hors scope V1

- OCR ;
- lecture mémoire Dofus ;
- détection automatique de quête ;
- automatisation de clics/touches ;
- bot ;
- compte cloud ;
- synchronisation multi-device ;
- éditeur complet de roadmap dans l’application ;
- click-through de l’overlay.

## 9. Contraintes qualité

- démarrage rapide ;
- faible consommation CPU/RAM ;
- fonctionnement hors ligne avec route exportée ;
- aucune perte de progression après fermeture/reboot ;
- resize fiable ;
- navigation principale toujours accessible ;
- aucune information interne de routing visible au joueur ;
- aucune seconde vérité entre Sheet, JSON et UI.

## 10. Critère de clôture V1

La V1 est gelable lorsque :
- route certifiée et synchronisée ;
- tests route verts ;
- validation verte ;
- build front vert ;
- recette runtime manuelle validée ;
- persistance/reprise testée ;
- DPLN, `/travel`, raccourcis et fenêtre testés ;
- absence d’erreur console bloquante ;
- build Tauri vérifié lorsque l’environnement le permet.
