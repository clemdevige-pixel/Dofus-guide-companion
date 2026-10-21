# Audit de concordance Tougli — Incarnam / Astrub

Date : 2026-10-21
Branche : `agent/initial-scaffold`
Périmètre : `block-01`, `block-02`, `block-03`.

## Sources et limites

- Référence Tougli publique historique : https://fr.scribd.com/document/830986226/Copie-de-Tougli-All-Dofus (section « Dofus argenté », notamment Incarnam et Astrub).
- Référence Tougli actuelle : https://tougli.barbofus.com/guide/dofus-argente ; page interactive non exploitable intégralement en lecture automatisée au moment de l'audit.
- La liste historique est un **ordre de quêtes** avec instructions parfois tronquées, **pas** un export fiable de tous les événements LANCER / AVANCER / TERMINER. Une équivalence exacte avec le Tougli actuel n'est donc **pas certifiable** avec ces seules sources.
- Source du projet : Google Sheet `ROUTE`; `data/route.json` est l'artefact généré. Toute réorganisation ultérieure doit modifier le Sheet en premier.

## Constats confirmés

Notre route contient 142 événements sur les 3 premiers blocs (y compris entrées et étapes de circuit) ; la liste Tougli ne compte que les **quêtes**. Ces unités de mesure ne sont pas comparables directement.

### Incarnam

Dans Tougli historique, l'ordre de présentation des quêtes est :
1. L'anneau de tous les dangers ; Sous le regard des dieux ; Réponses à tout ; Le village dans les nuages ; Espoirs et tragédies ;
2. Produits naturels ; Mort au rat ! ; Le métier des aventuriers ; La hache et la pioche ; Transport peu commun ;
3. Boune un jour, boune toujours ; Préparation au combat ; Des vestiges de légende ; Mise à l'épreuve ; Champs de bataille ; Coups d'épée dans l'eau ; Vu du ciel ;
4. Décime-moi des bouftous ; Un peu de pigment ; Chasse aux chapardams ; Leçon d'humilité ; La galette secrète ;
5. Cryptologie ; Des chafers qui marchent ; Dans la gueule du Milimilou ; Destination Astrub.

Notre route intercale les lancements anticipés et objectifs partiels selon les lieux : Transport peu commun est lancé dès l'ouverture, Mise à l'épreuve intervient avant la boucle des métiers, et plusieurs quêtes se poursuivent en parallèle. Le **premier passage** dans le parcours n'est donc pas identique à l'ordre de présentation Tougli.

Lignes de circuit géographique générique corrigées au préalable : `route-step-1106`, `route-step-1107`, `route-step-1109`, `route-step-1111` sont maintenant des transitions sans checkbox.

### Astrub

Tougli historique présente successivement notamment :
Les principes d'Archie m'aident ; Les deux font l'impair ; Les touffes des héros ; On marche sur des œufs ; Conseil de classe ; quête de classe ; Ça sent le gaz ; Balade en forêt ; Ça tombe à l'eau ; Six pieds sous terre ; Tel est pris qui croyait prendre ; L'histoire en mouvement ; Bière qui roule n'amasse pas mousse ; Déjeuner à la fourchette ; Comme un pichon hors de l'eau ; La coupe des vices ; Le génie se meut ; Bûcherons en détresse ; Qui sème le vent récolte l'Art'empeth ; Crise sanitaire ; La petite mission dans la prairie ; Livraison par intérim ; Golémancien ; Le rebelle de la forêt ; Restauration rapide ; De vrais rats de bibliothèque ; Chacha blues ; Les as de la cambriole ; Combat de rue ; Légende d'automne ; L'invasion des profanateurs de sépulture ; Le repos est dans le champ.

Notre ordre diffère notamment :
- `Donjon en mousse` est lancé au début d'Astrub avant la fin des principes d'Archie ;
- `Ça tombe à l'eau` est lancé très tôt avec `On marche sur des œufs` ;
- `Combat de rue` est lancé tôt comme fil rouge avant la fin de l'arc Astrub ;
- le Tour du monde, ses donjons et les reprises de Tainéla sont intercalés avant le Dofus Argenté.

Ces placements peuvent être volontairement optimisés pour la route **vers Sylvestre** ; les déplacer sans consulter l'état exact des quêtes créerait des régressions.

`Les touffes des héros` apparaît dans le Tougli historique ; il faut vérifier si elle appartient au périmètre **actuel** Tougli/Argenté et si elle est réellement requise dans notre route avant tout ajout.

## Décision de sûreté

Ne **pas** déclarer notre route « identique à Tougli » ni déplacer arbitrairement les 142 événements : il manque le relevé intégral ordonné des actions du guide Tougli actuel.

Avant la bascule exacte :
1. Extraire l'ordre et les notes **actuels** de Tougli (avec lancements différés et simultanéités).
2. Construire la correspondance `STEP_ID` / quête / phase take–advance–finish.
3. Comparer chaque paire et isoler les écarts réels (et non les simples lancements anticipés).
4. Appliquer le nouvel ordre sur `ROUTE` sans perdre les quêtes indispensables à la suite Sylvestre, `MOMENT_ID`, `DISPLAY_ROLE`, ressources, positions ni liens DPLN.
5. `pnpm export:route`, `pnpm test:route`, `pnpm validate:route`, `pnpm build`, puis CI.
