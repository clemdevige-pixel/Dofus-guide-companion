# SPEC — Dofus Guide Companion

## 1. Vision

Créer un companion desktop compact permettant de suivre une roadmap Dofus directement pendant le jeu, sans avoir à naviguer dans un Google Sheet.

L'application est un **roadbook interactif**, pas un bot et pas un outil d'automatisation du client Dofus.

## 2. Utilisateur cible

Joueur suivant une route longue et optimisée, principalement en mono-personnage, qui veut savoir en permanence :

1. ce qu'il doit faire maintenant ;
2. ce qu'il ne doit surtout pas faire trop tôt ;
3. quels fils rouges restent actifs ;
4. où se situe le prochain verrou dur.

## 3. Source de vérité

Le Google Sheet reste la source éditoriale de la route.

L'application consomme un export structuré versionné. Toute règle de progression doit venir des données.

**Interdit :** coder dans React des exceptions du type « si étape X alors afficher Y ».

## 4. V1 — fonctionnalités obligatoires

### Overlay

- fenêtre desktop always-on-top ;
- redimensionnable ;
- déplaçable ;
- taille et position mémorisées ;
- mode compact et mode détaillé ;
- possibilité de réduire rapidement l'encombrement.

### Étape actuelle

Afficher :

- index / progression ;
- type ;
- nom ;
- action ;
- instruction courte ;
- lien DPLN si présent ;
- bloc courant.

### Navigation

- étape précédente ;
- étape suivante ;
- valider / dévalider une étape ;
- reprise automatique sur la première étape non validée au lancement.

### Fils rouges

Afficher les fils rouges actuellement ouverts sans qu'ils bloquent la progression.

Exemples de comportement attendu :

- L'Éternelle moisson reste visible tant que son verrou dur n'est pas atteint ;
- Cartes de Cania reste visible comme objectif opportuniste ;
- un fil rouge ne doit jamais apparaître comme une obligation immédiate tant que son verrou n'est pas atteint.

### Verrou dur

Afficher clairement le prochain verrou dur.

Lorsqu'il devient l'étape actuelle, l'UI doit indiquer sans ambiguïté qu'on ne doit pas avancer tant que la condition n'est pas validée.

### PRÉPA

Les étapes de préparation doivent être lisibles sous forme de checklist ou liste compacte, sans reproduire le bruit visuel du Sheet.

### Persistance locale

Conserver localement :

- étapes validées ;
- étape courante ;
- position et taille de fenêtre ;
- mode compact / détaillé ;
- préférences UI.

Aucun compte utilisateur requis en V1.

## 5. UX cible

### Mode compact

Afficher uniquement :

```text
128 / 978  • QUÊTE
La raison du plus fort        ↗
AVANCER / STOP
Jusqu'au Directeur Grunob.

←        ✓        →
```

### Mode détaillé

Ajouter :

- bloc courant ;
- détail de l'instruction ;
- fils rouges actifs ;
- prochain verrou dur ;
- préparation utile.

## 6. Types visuels minimaux

L'UI doit pouvoir distinguer au minimum :

- QUÊTE
- REPRISE
- DONJON
- PRÉPA
- RÈGLE
- JALON
- FIL ROUGE
- VERROU DUR
- ALIGNEMENT / ORDRE
- GROSSE ÉTAPE
- FIN

Le rendu dépend du type de donnée, pas du texte de l'étape.

## 7. Hors scope V1

- lecture mémoire de Dofus ;
- OCR ;
- détection automatique de quête ;
- automatisation de clics ou touches dans Dofus ;
- bot ;
- compte cloud ;
- synchronisation multi-device ;
- éditeur complet de roadmap dans l'application.

## 8. Contraintes produit

- démarrage rapide ;
- faible consommation CPU/RAM ;
- aucune dépendance réseau nécessaire pour suivre une route déjà importée ;
- pas de perte de progression après crash/reboot ;
- l'application doit rester utilisable sur une petite largeur d'overlay.

## 9. Critères d'acceptation V1

La V1 est considérée utilisable si :

1. une route JSON valide peut être chargée ;
2. l'étape courante est affichée correctement ;
3. précédent / suivant / valider fonctionnent ;
4. la progression survit à un redémarrage ;
5. les liens DPLN s'ouvrent dans le navigateur ;
6. fils rouges et prochain verrou dur sont calculés depuis les données ;
7. la fenêtre reste au-dessus de Dofus ;
8. le mode compact tient dans un panneau étroit ;
9. aucune logique spécifique à une quête n'est hardcodée dans le front.

## 10. Décisions à valider avant scaffold

- nom final affiché de l'application ;
- largeur cible du mode compact ;
- comportement click-through éventuel ;
- mécanisme d'export du Google Sheet vers `route.json` ;
- raccourcis clavier globaux en V1 ou V1.1.
