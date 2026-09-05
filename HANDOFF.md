# HANDOFF — Dofus Guide Companion

Date : 2026-09-05

## 1. Contexte

Projet : **Dofus Guide Companion**  
Repo : `clemdevige-pixel/Dofus-guide-companion`  
Branche active : `agent/initial-scaffold`

Source éditoriale : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`.  
Runtime : `data/route.json`, généré depuis le Sheet.

Avant toute intervention lire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md`
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
7. `HANDOFF.md`

## 2. Contrat data/UI actuel

- `STEP_ID` = identité stable d'une étape technique ;
- `MOMENT_ID` = unique frontière multi-step d'une carte ;
- une ligne sans `MOMENT_ID` = une carte autonome ;
- `DISPLAY_ROLE` dans un moment : `OBJECTIVE`, `TRANSITION`, `DETAIL` ;
- premier membre d'un moment = `OBJECTIVE` ;
- maximum **5 OBJECTIVE par carte** ;
- `PARALLEL_ID / PARALLEL_PHASE` = lifecycle des vraies salves de quêtes à garder actives ensemble ;
- un groupe parallèle peut rester actif en donnée, mais son rappel UI n'est affiché que sur les cartes qui appartiennent réellement à ce groupe ;
- `completedStepIds` reste l'unique vérité de progression ;
- aucune heuristique métier ne doit être reconstruite depuis les titres/instructions.

## 3. État UX / progression intégré

Déjà intégré sur la branche :
- fenêtre stable, zone centrale scrollable, footer fixe ;
- navigation directe par numéro de carte dans le header ;
- cartes/sous-objectifs validés visuellement barrés depuis `completedStepIds` ;
- hard lock mutualisé conservant son identité et sans auto-advance ;
- validation d'une séquence ne peut plus déclencher un saut de **+2 cartes** : le side effect de navigation a été sorti de l'updater React ;
- CI du fix `+2 cartes` : frontend + Tauri verts ;
- rappel des quêtes parallèles corrigé : il n'est plus affiché sur les cartes intermédiaires sans rapport ;
- ancien test qui protégeait ce mauvais comportement supprimé/remplacé ;
- CI du nouveau contrat de rappel parallèle : verte au commit `bbb403a37a8677d0a8a449f36d039011e750c7ed`.

## 4. Audit éditorial / incohérences déjà corrigées

La passe récente a trouvé et corrigé plusieurs reliquats :
- faux titre `Chaque chose en son temps` à l'Akadémie des Gobs ;
- autres titres hérités de mutualisations remis sur le vrai passage/donjon ;
- alignements mal nommés ou manquants, dont alignement 66 `Course-poursuite` ajouté ;
- chaîne alignement 1→100 recontrôlée ;
- `Mort au rat !` nettoyé : suppression du faux besoin de Lailait dans l'instruction ; la Limonade d'Incarnam reste une action de quête.

## 5. Passe ressources — état actuel

**Passe toujours en cours. Ne pas considérer la route ressources comme terminée.**

Règle désormais officielle :
- vérifier les besoins réels DPLN/Ganymède ;
- distinguer ressource à apporter / objet obtenu pendant la quête / prérequis / aide externe ;
- vérifier les **quantités cumulées jusqu'au premier usage** ;
- une ressource déjà consommée ne couvre pas automatiquement un besoin futur ;
- placer les ressources pré-farmables dans une `PRÉPA` avant consommation, de préférence localement quand l'ancien lot est trop éloigné ;
- ne pas répéter une liste de ressources complète dans la description de quête.

Corrections déjà appliquées dans le Sheet pendant cette passe :
- Astrub : compléments manquants (Bière d'Astrub, Laine de Bouftou, etc.) ;
- `Le nouveau monde` / accès Otomaï : création d'une **PRÉPA locale Otomaï** juste avant la quête avec 2 Miséricordes du Chafer d'Élite, 1 Oreille de Foufayteur, 1 Huile de Sésame, 1 Tronc de Kokoko, 1 Tranche de Nodkoko, 1 Kokopaille, 1 Coffret maudit du Flib ; Gros Boulet laissé dans le déroulé car obtenu après lancement ;
- `L'île des naufragés` prise en compte dans ce lot local ;
- Turquoise : plusieurs ressources DPLN manquantes ajoutées au complément de prépa ;
- Émeraude : Dragodindes de génération 1 corrigées (plus les anciens libellés « sauvage ») ;
- Frigost : `Hôtel de glace` possède maintenant **le détail complet des composants de craft**, pas seulement les quatre outils finis ;
- Frigost : `La fonte des glaces` vérifiée complète sur ses quatre cartes PRÉPA ; 13 Oreilles de Kaniglou + 13 Poils de barbe du Shamansot prévus pour couvrir `La fonte` puis `L'ombre et la glace` sans compter deux fois des ressources consommées ;
- plusieurs autres besoins déjà remontés : Bière du Chabrulé, lot `Faire le mort`, Chasseur de Renégats, L'arme fatale, Marteau-Aigri, Maître des Illusions, etc.

## 6. Groupes parallèles

La route contient des groupes structurés `PARALLEL_ID / PARALLEL_PHASE` issus des convergences confirmées par la route/Ganymède.

Contrat UI actuel :
- `start` ouvre le groupe ;
- `progress` ajoute/rejoint les checkpoints ;
- `finish` le ferme ;
- le rappel `QUÊTES À AVANCER ENSEMBLE` n'est visible que sur une carte directement concernée par ce groupe ;
- il ne doit pas polluer les cartes intermédiaires ;
- revenir en arrière ne doit pas faire apparaître une info future.

Le cas Blops vu sur la carte `Après lui, le déluge` était un exemple du mauvais comportement historique et a motivé cette correction générique.

## 7. État Sheet / runtime IMPORTANT

**Le Sheet est actuellement EN AVANCE sur `data/route.json`.**

Depuis le dernier export runtime, le Sheet a reçu plusieurs corrections ressources/éditoriales, dont :
- prépa Otomaï locale ;
- détails `Hôtel de glace` ;
- corrections Turquoise / Émeraude / Frigost ;
- corrections éditoriales citées plus haut.

Donc au début du prochain chat :
- **ne pas éditer `data/route.json` à la main** ;
- poursuivre/terminer la passe ressources dans le Sheet ;
- seulement ensuite exécuter un export final et synchroniser le runtime.

## 8. Prochain chantier exact

Ordre recommandé pour la prochaine passe :

1. **Continuer l'audit ressources exhaustif** sur le reste de la route.
2. Reprendre directement par **Ivoire / Ébène** : premières cartes PRÉPA repérées (`Blanc Ivoire`, `Noir d'ébène`) mais l'audit exhaustif DPLN/quantités n'est pas encore clos.
3. Enchaîner sur **Cauchemar / Réminiscence**, puis **Silvosse / Sylvestre**, puis **Valonia / Pandamonium**.
4. Revalider ensuite Turquoise après les ajouts déjà faits, pour vérifier les quantités cumulées après consommations antérieures.
5. Pour chaque ressource, contrôler les **quantités réellement disponibles après les consommations précédentes**, pas seulement l'existence du nom dans une ancienne PRÉPA.
6. Continuer le scan des descriptions de quêtes pour retirer les listes de ressources qui doublonnent une PRÉPA ; conserver uniquement les objets obtenus pendant la quête et les consignes contextuelles.
7. Recontrôler les titres/étapes pseudo-meta hérités d'anciennes mutualisations, comme la passe qui a trouvé `Chaque chose en son temps` au mauvais endroit.
8. Recontrôler les 24 groupes parallèles au rendu : aucun rappel sur une carte sans rapport, aucun membre futur affiché trop tôt.
9. Une fois la passe Sheet fermée : exporter `ROUTE (A:V)` → `data/route.json`, lancer `pnpm test:route`, `pnpm validate:route`, `pnpm build`, puis vérifier Tauri.
10. Refaire un audit visuel court sur quelques checkpoints sensibles après l'export : Otomaï, Blops, Frigost, Turquoise, fin Sylvestre.

### Dernier état de reprise avant changement de chat

Le dernier balayage a confirmé que :
- le bloc Ivoire possède déjà une PRÉPA `Blanc Ivoire`, mais elle doit encore être comparée intégralement aux besoins DPLN des quêtes réellement parcourues ;
- le bloc Ébène possède une PRÉPA `Noir d'ébène`, même statut : présente mais audit de suffisance/quantités non clos ;
- la grosse PRÉPA `Qui nous protège` en fin de parcours contient déjà un lot très large de ressources et clefs : ne pas la dupliquer ailleurs sans vérifier les consommations et checkpoints précédents ;
- aucune nouvelle correction Sheet n'a été appliquée après ces derniers repérages : la prochaine passe peut reprendre directement sur l'analyse Ivoire/Ébène.

## 9. Garde-fous à ne pas réintroduire

- parsing du titre/instruction pour décider du comportement ;
- regroupement automatique sans `MOMENT_ID` ;
- plus de 5 `OBJECTIVE` dans une carte ;
- rappel parallèle persistant sur des cartes intermédiaires sans rapport ;
- liste de ressources cachée uniquement dans une description de quête alors qu'elle peut être préparée avant ;
- compter comme « disponible » une ressource déjà consommée plus tôt ;
- dupliquer une liste entière entre PRÉPA et instruction ;
- correction manuelle de `data/route.json` ;
- export du runtime avant fermeture de la passe Sheet en cours.

## 10. Qualité / état CI

Dernier contrat code vérifié :
- tests route ✅
- validation/build sur les états précédents ✅
- Tauri ✅
- correction rappel parallèle + nouveau test : CI ✅ (`bbb403a...`).

Après les dernières modifications **Sheet**, le runtime n'est volontairement pas encore réexporté : la prochaine validation complète devra se faire après la fin de la passe ressources.
