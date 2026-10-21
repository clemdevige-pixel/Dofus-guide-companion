# HANDOFF — Dofus Guide Companion / V1

Date : 2026-09-25
Branche : `agent/initial-scaffold`
Version : **1.0.0**

## TL;DR

V1 gelée et prête à distribuer.

État validé :
- route Astrub → Dofus Sylvestre certifiée sur son périmètre métier ;
- **973 étapes / 32 blocs** ;
- **59 PRÉPA** reconstruites autour des consommations réelles ;
- ordre relatif des **943 étapes métier historiques** conservé pendant la refonte blocs/prépas ;
- tests route/progress : **verts sur la CI du correctif Meno/Frimar** ;
- validation route : verte ;
- build frontend : vert ;
- `cargo check` Tauri Windows : vérification CI en cours sur le dernier correctif ;
- recette manuelle validée : save/reload, navigation, progression, compact, DPLN, `/travel`, raccourcis, taille/position fenêtre, console ;
- Sheet `ROUTE` et `data/route.json` synchronisés.

Ne pas relancer une optimisation globale de route sans bug concret ou nouvelle exigence métier.

Dernière refonte UX route intégrée :
- **32 cartes `ENTRÉE`**, exactement une par bloc ;
- **0 carte `PRÉPA` autonome** ;
- 35 préparations globales fusionnées dans les entrées de bloc ;
- 24 préparations tardives déplacées directement sur leur étape de consommation ;
- type éditorial `ENTRÉE` mappé sur le comportement structuré de préparation pour conserver les checklists sans ajouter de logique spécifique dans React ;

Dernière correction métier intégrée :
- Meno mutualisé en **un seul passage** pour `Une voix de crystal` + `Piège de crystal` / `Son nom est Personne` ;
- anciennes étapes du premier passage Meno supprimées ;
- ancienne mécanique « capturer les Frimar » supprimée partout ;
- `La machine à démonter le temps` indique désormais explicitement de **drop 2 Métaux Éternels sur les Frimar** ;
- Royalmouth conservé à **3 passages** après vérification des dépendances du Dofus Pourpre : aucune suppression appliquée.

## Sources de vérité

Source éditoriale : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`.
Runtime : `data/route.json`, généré depuis le Sheet.

Contrats :
- `STEP_ID` = identité métier stable ;
- `MOMENT_ID` = frontière d’une carte multi-step ;
- `DISPLAY_ROLE` = `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- `completedStepIds` = unique vérité de progression ;
- aucune logique spécifique à une quête dans React ;
- aucune correction manuelle de `data/route.json` comme source éditoriale.

## UX V1

- titres joueur nettoyés au runtime, titres source complets conservés en donnée ;
- marqueurs structurés : Alignement / Dofus / Donjon ;
- prérequis conservés pour audit mais masqués côté joueur ;
- actions structurantes conservées dans les séquences ;
- clic sur un bloc incomplet → première carte non validée ;
- prépas locales placées près de leur première consommation réelle.

## Compatibilité des saves

La progression est reconciliée avec la route courante :
- IDs supprimés nettoyés ;
- progression métier conservée via `STEP_ID` ;
- nouvelles PRÉPA historiques antérieures à la dernière étape métier déjà validée fermées lors d’un changement de `routeVersion` ;
- aucune progression n’est déduite d’un simple saut de consultation.

## Flux route

```text
Google Sheet ROUTE
→ pnpm export:route
→ pnpm test:route
→ pnpm validate:route
→ pnpm build
→ commit / push
```

Sous PowerShell Windows, utiliser `pnpm.cmd` si nécessaire.

## Release 1.0.0

Versions synchronisées :
- `package.json` = `1.0.0` ;
- `src-tauri/tauri.conf.json` = `1.0.0` ;
- `src-tauri/Cargo.toml` = `1.0.0` ;
- `src-tauri/Cargo.lock` resynchronisé.

Hygiène repo :
- `*.tsbuildinfo` est ignoré ;
- `tsconfig.tsbuildinfo` n’est pas suivi ;
- aucun workflow temporaire ne doit rester dans `.github/workflows/`.

Build Windows de distribution :

```powershell
pnpm.cmd install
pnpm.cmd tauri build
```

Bundles générés sous `src-tauri/target/release/bundle/`.

## Reprise post-V1

Lire dans l’ordre : `AGENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, `docs/DATA_MODEL.md`, puis ce `HANDOFF.md`.

État de reprise : **V1 maintenue ; refonte des cartes de préparation intégrée ; 973 étapes / 32 blocs ; tests route, validation et build frontend verts ; `cargo check` Windows du dernier commit fonctionnel encore en cours au moment de ce handoff.**


## Update 2026-09-26 — ordre Pandamonium / Cavaliers

- Correction d'un verrou réel de prérequis : `Toute possession dépossède` ne peut pas être faite au bloc 25, car `Quand l'éveil n'est qu'un songe` n'est terminé qu'au bloc 29.
- Paquet indivisible déplacé dans le bloc 29, immédiatement après la fin de `Quand l'éveil n'est qu'un songe` :
  - `Toute possession dépossède`
  - `Le chant du Pandamonium`
  - `Le début de la fin`
- Ce placement est volontairement avant `La danse de la dissonance`, qui dépend de `Le début de la fin`.
- `Les sentiers de la guerre` reste au bloc 25 : ses prérequis amont (`Rêves translucides` et `Chachyène de vie`) sont déjà fermés à cet endroit.
- `Les quatre volontés` reste immédiatement après `Les sentiers de la guerre`.
- Ressources Pandamonium déplacées de l'entrée du bloc 25 vers l'entrée du bloc 29 ; total `Umeshushu` du bloc 29 porté à 7 pour couvrir les besoins cumulés.
- `STEP_ID` conservés ; `moment-route-step-0714` attribué à `Les sentiers de la guerre` pour éviter un `MOMENT_ID` partagé entre deux blocs.
- Source éditoriale `ROUTE` et `data/route.json` resynchronisés.
- Commit de correction : `3f30ee0141ecc88a1cdd5795b2dc187dff81a40c`.
- CI frontend du commit : `test:route`, `validate:route` et build au vert.


## Update 2026-09-26 — audit prérequis blocs 24 à 32

- Audit des prérequis imbriqués effectué sur les blocs 24 à 32, avec recoupement de la ROUTE, de Ganymède GP0 et des pages DPLN utiles.
- Un second verrou critique a été trouvé dans le bloc 24 : la mutualisation Meno Ivoire + Abyssal en un seul passage était impossible.
- Cause : `Une voix de crystal` exige `Son nom est Personne` lancée ou terminée avant le combat contre Meno, tandis que `Son nom est Personne` n'est disponible qu'après avoir terminé `Piège de crystal`, qui exige lui-même un premier Meno.
- Correction : deux passages Meno explicites et linéaires :
  1. `Piège de crystal` → Meno → terminer `Piège de crystal` → lancer/terminer `Son nom est Personne`.
  2. Plus tard dans Nordalie : Nileza → Meno avec `Une voix de crystal` active → partitions → retour via Pichon → terminer `Une voix de crystal`.
- Nouveaux STEP_ID : `route-step-1173`, `route-step-1174`, `route-step-1175`.
- Aucun autre prérequis inversé identifié dans les blocs 24 à 32 après vérification des portes d'entrée, dépendances croisées et chaînes finales Dom de Pin / Qui nous protège / Flovoraison.
- Commit route : `0c780dcc80d54c27680c0e5946ef506f10a3d624`.


## Update 2026-09-26 — correction régression Meno

- Régression identifiée puis corrigée : le Vaisseau du Capitaine Meno doit rester mutualisé en un seul passage pour le Dofus Ivoire + Dofus Abyssal.
- Source de vérité utilisée pour cette convergence : JSON Ganymède GP0 fourni dans la conversation.
- Séquence GP0 confirmée :
  - avancer le guide Ivoire jusqu'au checkpoint Meno ;
  - reprendre le guide Abyssal de l'étape 55 à l'étape 122 ;
  - faire Meno une seule fois ;
  - parler au Capitaine Meno en salle de sortie d'abord pour `Une voix de crystal`, puis pour `Son nom est Personne`.
- Les trois étapes ajoutées par erreur pour un premier Meno séparé (`route-step-1173`, `route-step-1174`, `route-step-1175`) ont été supprimées.
- `route-step-0671` redevient un checkpoint Abyssal différé : ne pas faire Meno à ce stade.
- `route-step-0837` redevient l'unique donjon Meno `IVOIRE + ABYSSAL`.
- Le contrat de test protège désormais explicitement cette mutualisation à un seul passage.
- Commit route : `62a00062e52d20a3ddb34c483a8399614cf22d10`.
- Commit test : `7f3bbd7b5ae79b813cf8e99b65864de003086fe3`.

## Update 2026-09-27 — trous de route + wording Tougli généralisé

- Audit Tougli recroisé avec les prérequis réels : le Dofus des Veilleurs n'est pas requis pour le Sylvestre et n'a pas été ajouté.
- Ajout de `L'accusé de la réception` avant `Les monstres aboient, la diligence casse`, qui en dépend directement.
- Ajout volontaire de `La dernière barbe avant la fin du monde` après `Frappez, ami, et entrez`, avant `De Brikke et de Brokke`.
- Nouveaux STEP_ID stables :
  - `route-step-accuse-reception`
  - `route-step-derniere-barbe`
- Le moment Martegel `moment-route-step-0849` reste à 5 OBJECTIVE maximum.
- Wording généralisé sur toute la route : 405 instructions runtime reformulées vers un style plus naturel de type « avance X jusqu'à Y, fais Z, puis reprends X », sans modifier l'ordre métier, les STEP_ID, les MOMENT_ID, les groupes parallèles ni les goals.
- Deux drapeaux techniques `LANCEMENT_REQUIS` déjà incohérents ont été remis à TRUE sur `Association de fureteurs` et `La complote des P.O.M.S.` afin de rétablir la compatibilité avec l'exporteur ; aucune logique runtime changée.
- Source éditoriale `ROUTE` et `data/route.json` synchronisés : **975 étapes / 32 blocs**.
- Tests de contrat ajoutés pour protéger :
  - `L'accusé de la réception → Les monstres aboient, la diligence casse` ;
  - `Frappez, ami, et entrez → La dernière barbe avant la fin du monde → De Brikke et de Brokke`.
- Commit route : `9abc462fb6cb75b9d4190bc0ea6dd38b44951dcb`.
- Commit tests : `25684d7dba65f1587b13b48c2cf8ce98f9315cf4`.
- CI frontend du commit tests : `test:route`, `validate:route` et build **verts**.
- `cargo check` Windows : encore en cours au moment de cette mise à jour.

## Update 2026-09-28 — UX Tougli adaptée au Companion

- Refonte des cartes séquence sans modifier le modèle métier :
  - premier objectif incomplet = objectif actif visuellement dominant ;
  - objectifs terminés fortement atténués ;
  - objectifs futurs atténués ;
  - détail d'un objectif repliable/dépliable via chevron ;
  - l'objectif actif s'ouvre automatiquement ;
  - aucune duplication d'objectif ni de progression.
- Code couleur sémantique basé uniquement sur les données structurées existantes :
  - STOP = rouge ;
  - TERMINER = vert ;
  - LANCER = or ;
  - AVANCER / REPRENDRE = bleu ;
  - coordonnées /travel = bleu.
- Vue Progression enrichie d'une mini-roadmap du bloc courant :
  - cartes du bloc listées dans l'ordre ;
  - état terminé / courant / à venir ;
  - numéro réel de carte ;
  - clic direct vers la carte.
- Aucun parsing de titre/instruction ajouté ; aucune donnée métier supplémentaire.
- Fichiers UI concernés : `src/App.tsx`, `src/sequence.css`, `src/styles.css`, `src/progression.css`.

## Update 2026-09-28 — flow UX global inspiré Tougli

- Méthode validée puis déployée sur toute la route : pas de texte macro sur les cartes évidentes ; contexte ajouté uniquement pour checkpoint, reprise, branches imbriquées, convergence ou mutualisation.
- Nouvelle métadonnée player-facing structurée : `FLOW_NOTE` (colonne X du Sheet, `RouteStep.flowNote` au runtime).
- `NOTE / OPTI` reste une colonne éditoriale interne et n'est pas exposée au joueur.
- Export Sheet étendu à `ROUTE!A5:X`.
- **61 flow notes** ajoutées sur les moments réellement complexes, réparties du bloc 1 au bloc 32.
- Wording macro calé sur les patterns Tougli : « avance X jusqu'à Y », « fais les branches », « puis reprends X », « reprise prévue plus tard ».
- Les détails opérationnels déjà plus précis dans notre route (coordonnées, STOP, sortie de donjon, objets/interactions critiques) restent dans `instruction` / `warning`.
- Exemples couverts explicitement : Incarnam, Restauration rapide/Mage Ax, L'épée du rocher, Meno Ivoire+Abyssal, Main dans la main, Nordalie, Un remède draconien, Cavaliers, Prise de conscience, Totems, Protecteur/Flovoraison.
- UI : la flow note est affichée une seule fois au niveau carte, avant les objectifs, sous forme de callout compact.
- Validation : une flow note d'un `MOMENT_ID` doit être portée par le premier `OBJECTIVE`.
- Test de contrat : au moins 50 flow notes + checkpoints sensibles protégés.
- CI frontend du commit `14ebf3728beedb53cb7d5fa1aa5e9e52ebce2569` : `test:route`, `validate:route` et build **verts**.
- `cargo check` Windows était encore en cours au dernier contrôle.

## Update 2026-09-28 — audit lifecycle / wording des reprises

- Passe globale sur les FLOW_NOTE + reprises :
  - `reprends` réservé aux vraies étapes de reprise ;
  - dans une même carte : `poursuis` / `termine` ;
  - `ferme/fermer` remplacé par `termine/terminer` côté joueur ;
  - toute instruction de type reprise sur un step `resume` porte désormais aussi `REPRENDRE` dans ACTION.
- Les instructions présentes sous une FLOW_NOTE utilisent maintenant le même langage visuel de callout pour éviter le mélange de styles.
- Trou de route corrigé : `Pêche en eaux gelées` possède désormais une étape explicite `REPRENDRE / TERMINER` après le Mansot Royal et avant `La pêche à Mel`.
- Trou de route corrigé : `Piège de crystal` est désormais explicitement terminé après Meno, puis `Son nom est Personne` est lancé dans la salle de sortie avant de poursuivre les objectifs Abyssal/Ivoire.
- `La mère des Dragoeufs` :
  - avant tout donjon niveau 200, la quête doit être avancée jusqu'à l'objectif exact `Obtenir un Parangon de puissance` ;
  - le drop du Parangon est alors actif sur les gardiens de donjon 200 ;
  - cette condition est protégée par test avant le premier passage Nileza 200 de la route.
- Tests ajoutés :
  - un FLOW_NOTE contenant `reprends` exige ACTION `REPRENDRE` ;
  - aucun FLOW_NOTE ne peut utiliser `ferme/fermer` ;
  - toute reprise annoncée doit avoir une vraie reprise ou fin ultérieure ;
  - lifecycle explicite de Pêche en eaux gelées ;
  - lifecycle explicite Piège de crystal → Son nom est Personne ;
  - checkpoint Parangon avant les donjons 200.
- État runtime : 977 steps / 349 cards.
- CI frontend du commit `517637e336c137c6061e870043f57fa9dfb3cacf` : tests route, validate route et build verts.
- `cargo check` Windows encore en cours au dernier contrôle.
- Point restant volontairement non étendu : terminer complètement `La mère des Dragoeufs` après le Parangon demanderait d'ajouter `Perdu dans le temps` puis la suite Vulbis. La route conserve pour l'instant uniquement le checkpoint Parangon utile aux donjons 200.

## Update 2026-09-28 — passe finale flow / reprises / fins explicites

- Règle UX consolidée :
  - `FLOW_NOTE` = logique macro de la carte ;
  - l’`instruction` du même step ne garde que l’info micro réellement unique ;
  - aucune duplication volontaire flow + instruction ;
  - `reprends` n’est utilisé qu’au moment d’une vraie reprise ;
  - `termine` est préféré à `ferme` dans le wording joueur.
- 58 instructions portées par des flow notes ont été nettoyées ; 30 gardent uniquement un détail micro utile (PNJ, ressource, verrou, interaction critique).
- Actions de reprise corrigées notamment sur `Recouvrement de dette à la Tabasse` et `L'heure des adieux`.
- 4 fins de quêtes auparavant implicites sont maintenant des étapes visibles :
  - `route-step-dan-lavy-finish` — À la recherche de Dan Lavy ;
  - `route-step-lahaut-montagne-finish` — Là-haut sur la montagne ;
  - `route-step-pic-qui-glace-finish` — Le pic qui glace ;
  - `route-step-flovoraison-finish` — Flovoraison.
- `Pêche en eaux gelées` reste protégée par `route-step-peche-eaux-gelees-finish`.
- `La mère des Dragoeufs` est conservée : avant tout donjon 200, elle doit être avancée exactement jusqu'à l'objectif « Obtenir un Parangon de puissance » ; la quête reste ensuite active pour le drop. La suite Vulbis reste hors scope et est explicitement clôturée côté Companion par `FIN DU SUIVI`.
- `Qui nous protège du Protecteur ?` est maintenant repris/terminé après une étape séparée de fin de Flovoraison.
- Route runtime : **981 étapes / 32 blocs**.
- Contrats ajoutés :
  - aucun `flowNote` avec « ferme/fermer » ;
  - « reprends » uniquement avec action `REPRENDRE` ;
  - toute reprise annoncée possède une vraie reprise/fin ultérieure ;
  - fins explicites Dan Lavy / Là-haut / Pic qui glace / Flovoraison ;
  - Pêche en eaux gelées terminée après Mansot ;
  - checkpoint Parangon avant Nileza, premier donjon 200 de la série.
- CI frontend du commit `49227a96310ce3596277f55fa399228e1bacb77c` : tests route, validation et build **verts**.
- `cargo check` Windows encore en cours au dernier contrôle.



## Update 2026-09-28 — retrait de FLOW_NOTE

- Décision UX : `FLOW_NOTE` n'est plus une couche d'affichage séparée.
- Les 62 flow notes ont été réintégrées dans les `instruction` des étapes concernées, avec purge des redondances `warning` / `instruction`.
- Cas Parangon : la logique « avant tout donjon 200 → Obtenir un Parangon de puissance → drop actif » est désormais portée directement par `La mère des Dragoeufs`.
- Runtime : `RouteStep.flowNote` supprimé.
- UI : callout `flow-note` supprimé ; les descriptions utilisent le rendu normal d'`instruction`.
- Export Sheet : `FLOW_NOTE` retiré ; plage ramenée à `ROUTE!A5:W`.
- Validation / contrats : les contrats dédiés aux flow notes ont été migrés vers les descriptions intégrées.
- Règle éditoriale courante : une information joueur ne doit exister qu'à un seul endroit ; `warning` = risque/contrainte, `instruction` = action + contexte utile.

## Update 2026-10-16 — anticipation des Totems avant l'Ébène

- Source éditoriale `ROUTE` et `data/route.json` réordonnés sur la branche `agent/initial-scaffold`. **981 étapes / 32 blocs** : tous les `STEP_ID` existants conservés et ordre Sheet/JSON vérifié à l'identique.
- Bloc 25 inchangé sur la clôture des Quatre Volontés. Nouveau bloc 26 : `Jusqu'au bout du rêve` (Rêve d'harmonie), `Prise de conscience`, Dofus Tacheté, Pandamonium jusqu'à `Le début de la fin`, Cauchemar jusqu'à `Descendre aux cendres`, puis ouverture d'`Un héritage tourmenté` et des `Totems de Maïmane`.
- Bloc 27 : Dofus Ébène avec cinq Totems sur les passages déjà nécessaires : Bethel/Dégoût (`0943`), Koutoulou/Peur (`0941`), Dazak/Colère (`0942`, conserve la mutualisation Martegel), Klime/Joie (`0940`) et Reine des Voleurs/Surprise (même étape `0882`). Les quatre étapes de Totem conservent leurs IDs mais sont rattachées aux moments des donjons Ébène.
- Bloc 28 : `Dans la gueule du dragon` et `Le silence est d'Aure`, désormais après l'Ébène. La branche `Prise de conscience` n'est plus dupliquée ici.
- Bloc 29 : Valonia et quêtes nécessitant l'Ébène ; bloc 30 : `S'armer contre le destin`, Vortex/Tristesse, Comte Harebourg sans Totem Surprise, remise des six Totems et conclusions.
- `La bête au bois dormant` reste en bloc 31 après `Entretemps, une renaissance` et `Le serment de l'ambre`.
- Correction d'ordre indépendante imposée par le test existant : `Flovoraison — TERMINER` passe avant la reprise de `Qui nous protège du Protecteur ?`.
- Tests anti-régression ajoutés sur l'ouverture des Totems avant l'Ébène et les mutualisations réelles.
- **Source et JSON contrôlés** : 981 identifiants dans le même ordre, aucune divergence observée sur titres, actions, instructions, prérequis, blocs, moments, rôles ou séries Dofus. Liens DPLN restaurés sur les lignes déplacées.
- CI frontend vérifiée sur le commit `8f2f3922dece9448eab9e1845379126bb607c259` : `test:route`, `validate:route` et `build` verts ; `cargo check` Windows encore en cours au dernier contrôle.
- **À vérifier en recette manuelle** : lisibilité de la préparation longue du bloc 26, récupération effective des Totems pendant chacun des cinq combats mutualisés, et reprise des sauvegardes antérieures à ce changement d'ordre.

## Update 2026-10-21 — polish UI, navigation, sauvegarde de secours

- **A — visuel :** hiérarchie du titre de carte et badges resserrée, cibles footer agrandies, objectifs terminés/futurs moins pâles, bloc courant et titres à deux lignes plus visibles dans Progression ; prise en compte de `prefers-reduced-motion`.
- **B — interactions :** avance automatique conservée après validation ; `Annuler` restaure le dernier instantané des coches et revient à la carte d'origine ; détails de séquence accessibles par Entrée/Espace sur l'élément focalisé. La progression reste portée uniquement par `completedStepIds`.
- **C — robustesse :** `saveProgress` entouré d'un traitement d'erreur visible en Paramètres, export JSON de secours depuis Paramètres, import JSON validé puis réconcilié avec les IDs de route ; tests supplémentaires sur la restauration et les fichiers invalides. Pas de modification du format de sauvegarde locale `v1`.
- Périmètre code : `src/App.tsx`, `src/styles.css`, `src/sequence.css`, `src/progression.css`, `src/progress/storage.ts`, `src/progress/storage.test.ts`.
- Aucun changement de `ROUTE`, `data/route.json` ou des identifiants.
- CI frontend du commit `76e2e729df6974dc097271ccb687f5a1b411702e` : tests route, validation et build verts.
- **Recette Windows restant à faire :** vérifier que le WebView Tauri télécharge bien le backup Blob, réimporte le fichier, affiche les erreurs de quota, conserve l'état après fermeture/relaunch, et que resize/déplacement multi-écrans/raccourcis restent fiables ; `cargo check` ne remplace pas la recette runtime.

## 2026-10-21 — Cartes visuelles d'obtention des Dofus

- 13 acquisitions vérifiées dans `data/route.json` ; aucune carte de célébration Abyssal (aucune obtention).
- `src/route/dofusRewards.ts` associe chaque acquisition réelle à son `STEP_ID`, nom, image et niveau d'affichage ; `src/route/dofusRewards.test.ts` vérifie que tous les identifiants existent.
- `src/App.tsx` affiche une célébration après une validation effective, y compris à l'intérieur d'un `MOMENT_ID`, avec bouton Continuer ; pas de nouveau `STEP_ID` et aucune modification de l'état persisté. Annuler restaure les coches et ferme la célébration.
- `src/styles.css` : overlay thématisé, adaptable à la fenêtre, avec visuel PNG et secours si asset absent.
- Les 13 images PNG transparentes `2x` sont dans `public/dofus/`, extraites des assets DOFUS via `scripts/import_dofus_art.py` et `.github/workflows/import-dofus-art.yml` (release source épinglée `v6.0_3.7.12.12`). Vérification : 13 fichiers PNG retrouvés et workflow d'import vert, commit `4c3f024`.
- Tests route, validation et build frontend verts avant l'import des PNG (CI `39598742117`).
- À vérifier dans Tauri Windows : affichage des 13 images / leur alpha, déclenchement uniquement à l'obtention, annulation, séquences, fenêtre étroite et réouverture avec progression déjà cochée.

## 2026-10-21 — Profils multi-personnages (V1 locale)

- Stockage `src/progress/profiles.ts` sous `dofus-guide-companion.profiles.v2`, migration **non destructive** de l'ancienne clé `dofus-guide-companion.progress.v1`, conservée telle quelle.
- Un profil possède son `completedStepIds` (vérité de progression), ses coches de préparation, son curseur et son mode compact. Les raccourcis et la géométrie de fenêtre restent globaux.
- UI `src/App.tsx` : accès par le nom du personnage dans l'en-tête ou menu « Personnages » ; création à zéro, sélection, renommage, duplication, suppression avec confirmation, reset ciblé avec confirmation. Conserve toujours au moins un profil.
- Import/export JSON dans Paramètres concerne le personnage actif ; la sauvegarde v1 reste compatible.
- Aucune modification de `data/route.json`, des `STEP_ID` ni de la progression métier.
- Tests `src/progress/profiles.test.ts` : migration, isolation, duplication, reset, suppression, renommage, sauvegarde corrompue ; frontend CI verte sur `5f38c6622`.
- Recette Windows restante : importer l'existant ; créer A et B ; valider des étapes sur A ; passer B ; rouvrir l'app ; vérifier A/B indépendants ; exporter/importer dans B ; dupliquer A ; supprimer et reset un profil avec confirmation ; vérifier vue compacte et raccourcis globaux.

## 2026-10-21 — Profils : page dédiée, classes, progression Dofus

- Feedback Windows : ancien panneau de profils superposé au guide et `window.prompt` natif inadaptés à la petite fenêtre.
- Nouvelle vraie page `Personnages` à défilement vertical indépendant, avec retour au guide ; aucune carte/navigateur/footer de guide rendu sur cette page.
- Chaque fiche de personnage a une barre de progression globale, un accordéon affichant les 13 séries Dofus (pourcentage dérivé des `dofusSeries` balisées dans la route, 100 % à l'acquisition), actions de sélection/renommage/suppression, et choix de classe.
- Classe facultative parmi 19, persistée sous `classId` dans `profiles.v2`, compatible avec profils anciens. Portraits PNG récupérés dans `public/classes/` via workflow `import-dofus-classes.yml`; source `bilalsaaoud/dofus-stuff-builder`.
- Renommage désormais en formulaire intégré, plus de `window.prompt`.
- Tests frontend / validation route / build verts sur commit `0cb693a0c`; `cargo check` Windows à attendre. Nouveau test pour persistance des classes ajouté.
- Contrôles manuels : réduire fenêtre au minimum, vérifier scrolling et boutons, ouvrir plusieurs profils, déplier séries, renommer sans boîte native, changer classe, vérifier visuel et conservation après redémarrage ; pour un Dofus non couvert par `dofusSeries`, le pourcentage peut refléter uniquement l'acquisition.
