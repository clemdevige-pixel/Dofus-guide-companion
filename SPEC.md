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

## 4. Décisions produit verrouillées

### Nom

Nom affiché : **Dofus Guide Companion**.

### Fenêtre

- largeur par défaut du mode compact : **380 px** ;
- fenêtre librement redimensionnable par l'utilisateur ;
- taille et position mémorisées ;
- aucune largeur métier codée en dur au-delà des minimums nécessaires à une UI exploitable.

### Click-through

- **hors scope V1** ;
- cible V1.1 : option « verrouiller l'overlay » permettant de rendre la fenêtre click-through ;
- l'activation doit rester explicitement réversible par un raccourci ou un mécanisme sûr.

### Export de route

- export via un script TypeScript dédié dans le repo ;
- flux cible : `Google Sheet → validation → data/route.json` ;
- l'application ne dépend pas d'une lecture live du Sheet pendant l'utilisation normale.

### Raccourcis clavier

Les raccourcis globaux sont inclus en V1.

Raccourcis par défaut proposés :

- `Ctrl+Alt+Right` : étape suivante ;
- `Ctrl+Alt+Left` : étape précédente ;
- `Ctrl+Alt+Enter` : valider / dévalider l'étape ;
- `Ctrl+Alt+Space` : afficher / masquer l'overlay.

**Tous les raccourcis doivent être configurables dans les réglages.**

La configuration utilisateur est persistée localement. Les conflits / raccourcis indisponibles doivent produire un retour explicite, jamais un échec silencieux.

## 5. V1 — fonctionnalités obligatoires

### Overlay

- fenêtre desktop always-on-top ;
- redimensionnable librement ;
- déplaçable ;
- largeur compacte par défaut : 380 px ;
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
- reprise automatique sur la première étape non validée au lancement ;
- navigation disponible par boutons et raccourcis globaux.

### Réglages

Au minimum :

- modification des raccourcis globaux ;
- restauration des raccourcis par défaut ;
- mode compact / détaillé ;
- préférences d'affichage utiles à l'overlay.

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
- étape courante dérivée / position de consultation ;
- position et taille de fenêtre ;
- mode compact / détaillé ;
- préférences UI ;
- mapping des raccourcis globaux.

Aucun compte utilisateur requis en V1.

## 6. UX V1 — référence verrouillée

Les wireframes ci-dessous sont la **référence UX V1**. Le scaffold et les composants doivent partir de cette structure sans ajouter de navigation ou de panneaux non prévus tant qu'un besoin concret n'est pas démontré.

### 6.1 Mode compact

Objectif : rester lisible en jeu à environ **380 px de large** avec uniquement l'essentiel.

```text
┌──────────────────────────────────┐
│ 128 / 978  •  QUÊTE              │
│ La raison du plus fort       ↗   │
│ AVANCER / STOP                   │
│ Jusqu'au Directeur Grunob.       │
│                                  │
│ ←       ✓       →                │
└──────────────────────────────────┘
```

Règles :

- aucune section secondaire visible ;
- le nom de l'étape est prioritaire ;
- le lien DPLN est accessible via l'icône `↗` si présent ;
- l'action doit rester visible sans scroll ;
- l'instruction est courte et peut être tronquée proprement si la hauteur est réduite ;
- la navigation `précédent / valider / suivant` reste toujours accessible ;
- le resize utilisateur ne doit jamais faire disparaître les contrôles principaux.

### 6.2 Mode détaillé

Objectif : conserver l'étape courante au centre tout en montrant le contexte utile.

```text
┌──────────────────────────────────────┐
│  DOFUS GUIDE COMPANION               │
│  Étape 128 / 978        13%          │
├──────────────────────────────────────┤
│  QUÊTE                               │
│  La raison du plus fort        ↗ DPLN│
│                                      │
│  AVANCER / STOP                      │
│                                      │
│  Avance jusqu'au Directeur Grunob    │
│  puis STOP avant l'Akadémie des Gobs │
├──────────────────────────────────────┤
│  ⚠ FILS ROUGES ACTIFS                │
│  • L'Éternelle moisson               │
│  • Alignement + Ordres               │
├──────────────────────────────────────┤
│  🔒 PROCHAIN VERROU DUR              │
│  Niveau 80                           │
├──────────────────────────────────────┤
│        ←   ✓ TERMINÉ   →             │
└──────────────────────────────────────┘
```

Règles :

- bloc courant et progression globale visibles sans dominer l'écran ;
- l'étape actuelle reste la zone principale ;
- fils rouges et prochain verrou dur sont des sections secondaires ;
- ces sections sont dérivées des données, jamais écrites en dur ;
- le mode détaillé peut scroller verticalement si nécessaire, mais le footer de navigation doit rester accessible.

### 6.3 Drawer latéral

Accès via `☰`.

```text
☰

Progression
Fils rouges
Prochain verrou
Prépa du bloc
Historique
Paramètres
```

Règles :

- drawer fermé par défaut en usage normal ;
- une seule surface secondaire ouverte à la fois ;
- aucune navigation du drawer ne modifie la progression par effet de bord ;
- revenir à l'étape actuelle doit être immédiat ;
- `Paramètres` contient notamment le remapping des raccourcis.

### 6.4 Écrans contextuels par type

#### FIL ROUGE

```text
┌──────────────────────────────────────┐
│  🟣 FIL ROUGE                        │
│  Tablette de Totankama               │
│                                      │
│  Accumule les 25 Trésors au fil      │
│  de la route.                        │
│                                      │
│  PAS BESOIN DE FINIR MAINTENANT      │
│                                      │
│  🔒 Verrou plus tard : étape 441     │
├──────────────────────────────────────┤
│        ←   ✓ VALIDÉ   →              │
└──────────────────────────────────────┘
```

Comportement :

- signaler explicitement que l'objectif ne bloque pas encore ;
- afficher le verrou associé si la donnée existe ;
- rester visible dans la liste des fils rouges actifs jusqu'à sa fermeture ou son verrou.

#### VERROU DUR

```text
┌──────────────────────────────────────┐
│  🔴 VERROU DUR                       │
│                                      │
│  CARTE DE CANIA                      │
│                                      │
│  Tu ne peux pas continuer tant que   │
│  la Carte de Cania n'est pas obtenue.│
│                                      │
│  [ Ouvrir le fil rouge associé ]     │
└──────────────────────────────────────┘
```

Comportement :

- doit être visuellement impossible à confondre avec une étape normale ;
- aucune avance automatique au-delà ;
- si un fil rouge parent existe, permettre de l'ouvrir ;
- l'utilisateur garde la possibilité de naviguer manuellement pour consulter la route, sans que cela valide le verrou.

#### DONJON

- accent visuel plus fort qu'une quête ;
- afficher clairement `FAIRE & VALIDER` ou l'action exportée ;
- mettre en avant les mutualisations et contraintes de sortie présentes dans l'instruction ;
- ne jamais inventer de logique spéciale à partir du nom du donjon.

#### PRÉPA

- rendu sous forme de liste/checklist compacte ;
- séparer visuellement titre et ressources ;
- ne pas dupliquer les ressources dans plusieurs composants ;
- si la préparation est longue, autoriser un scroll interne ou une vue détaillée plutôt que d'agrandir démesurément l'overlay.

#### GROSSE ÉTAPE

- signaler qu'il s'agit d'une session longue ;
- conserver l'action principale et l'objectif de sortie visibles ;
- ne pas la transformer automatiquement en fil rouge si les données ne l'indiquent pas.

#### FIN

- écran dédié de fin de route ;
- aucun bouton `suivant` actif ;
- progression affichée comme terminée.

## 7. Types visuels minimaux

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

## 8. Hors scope V1

- lecture mémoire de Dofus ;
- OCR ;
- détection automatique de quête ;
- automatisation de clics ou touches dans Dofus ;
- bot ;
- compte cloud ;
- synchronisation multi-device ;
- éditeur complet de roadmap dans l'application ;
- click-through de l'overlay.

## 9. Contraintes produit

- démarrage rapide ;
- faible consommation CPU/RAM ;
- aucune dépendance réseau nécessaire pour suivre une route déjà importée ;
- pas de perte de progression après crash/reboot ;
- l'application doit rester utilisable sur une petite largeur d'overlay ;
- le resize utilisateur ne doit jamais casser la navigation principale.

## 10. Critères d'acceptation V1

La V1 est considérée utilisable si :

1. une route JSON valide peut être chargée ;
2. l'étape courante est affichée correctement ;
3. précédent / suivant / valider fonctionnent ;
4. la progression survit à un redémarrage ;
5. les liens DPLN s'ouvrent dans le navigateur ;
6. fils rouges et prochain verrou dur sont calculés depuis les données ;
7. la fenêtre reste au-dessus de Dofus ;
8. le mode compact est utilisable à 380 px par défaut tout en restant redimensionnable ;
9. aucune logique spécifique à une quête n'est hardcodée dans le front ;
10. les raccourcis globaux fonctionnent et peuvent être remappés depuis les réglages ;
11. un conflit de raccourci est signalé clairement ;
12. taille, position et raccourcis personnalisés survivent à un redémarrage ;
13. les wireframes compact/détaillé/drawer sont respectés comme structure de base ;
14. FIL ROUGE et VERROU DUR ont des comportements distincts et dérivés des données ;
15. une étape FIN ne permet pas d'avancer vers une étape inexistante.

## 11. Décisions reportées

### V1.1

- click-through avec toggle explicite ;
- raccourci de secours pour reprendre le contrôle de la fenêtre si le click-through est actif.
