# HANDOFF — Dofus Guide Companion / clôture V1

Date : 2026-09-16

## TL;DR

Branche active : `agent/initial-scaffold`.

La route Astrub → Dofus Sylvestre est certifiée sur son périmètre métier et contient toujours :
- **1009 étapes** ;
- **20 blocs** ;
- ordre métier certifié ;
- anti-régressions route actifs ;
- `PRÉREQUIS` conservés dans la donnée mais masqués côté joueur.

Le chantier restant avant clôture V1 n'est plus une reconstruction de route. Il reste une **recette runtime / UX finale**, une vérification de synchronisation Sheet → JSON pour les nouveaux marqueurs, puis un audit release-readiness court.

## 1. Sources de vérité

Projet : **Dofus Guide Companion**  
Repo : `clemdevige-pixel/Dofus-guide-companion`  
Branche : `agent/initial-scaffold`

Source éditoriale : Google Sheet **Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre**, onglet `ROUTE`.  
ID : `1l1eYM3T708s5j74LmsUi4wyzg6sM9xShPzS_ToBtVYg`

Runtime : `data/route.json`.

Références métier :
- Ganymède GP0 + guides spécialisés = ordre relatif / fenêtres / mutualisations ;
- DofusPourLesNoobs = détail de quête, position, interaction, prérequis factuel.

Ne pas réordonner la route par intuition.

## 2. État route métier

Certification clôturée sur le scope actuel. Les gros points déjà sécurisés comprennent notamment :
- Alignement 75→100 ;
- Ordres 4→5 ;
- Tengu / Forêt Pétrifiée / `Si j'avais un marteau` ;
- Fratrie / Ébène / Gang des Toxines ;
- Enutrosor 2 / Enutrosor 3 ;
- Turquoise et ses repassages nécessaires ;
- DDG avec deux passages Comte distincts lorsque requis ;
- Ivoire / Ébène / Six sur six ;
- Tour du Monde jusqu'à Ougah → Merkator → Kralamoure ;
- Valonia / Ilyzaelle ;
- Dom de Pin / Dofus Sylvestre.

`src/route/routeContracts.test.ts` protège les dépendances sensibles.

## 3. Nettoyage UX déjà fait

### Cartes

- blocs `PRÉREQUIS` masqués côté joueur ;
- commentaires internes / notes de routing purgés ;
- message métier des `VERROU DUR` conservé dans les séquences ;
- actions `LANCER / AVANCER / TERMINER / STOP` conservées sur les vrais `OBJECTIVE` des `MOMENT_ID` ;
- `GUIDE_ITEMS` ne sont pas ajoutés dans les séquences juste pour détailler DPLN : le lien DPLN reste la source du déroulé fin.

### Titres joueur

Nouveau contrat : **la donnée conserve les titres éditoriaux complets**, mais l'UI affiche un titre canonique court.

Implémentation :
- `src/route/displayTitle.ts` ;
- `src/route/loader.ts` applique `getPlayerFacingStepTitle()` au runtime après validation de la donnée brute.

Exemples :
- `Dépôt de ravitaillement — avancer jusqu'au verrou Chaud du S.L.I.P.` → `Dépôt de ravitaillement` ;
- `◆ Serre du Royalmouth — PASSAGE #3` → `Serre du Royalmouth`.

Les cartes composites significatives comme `Enutrosor — La quatrième dimension + Crache Test` gardent leur suffixe.

Important : les tests éditoriaux doivent auditer `data/route.json` **avant** cette normalisation UI.

## 4. Marqueurs visuels

Direction validée :
- Alignement → icône bouclier ;
- quête directement rattachée à une série Dofus → icône œuf/Dofus custom ;
- donjon → icône château ;
- maximum 2 marqueurs visibles devant un titre.

Implémentation :
- `src/components/StepMarkers.tsx` ;
- `src/step-markers.css` ;
- `RouteStep.dofusSeries?: string` ;
- `type === 'alignment'` et `type === 'dungeon'` sont réutilisés directement : ne pas créer de tags redondants.

La colonne `DOFUS_SERIES` a été ajoutée à la source Sheet et `scripts/export-route.ts` sait l'exporter.

**À vérifier une dernière fois avant gel V1 :** la parité complète entre les valeurs `DOFUS_SERIES` du Sheet et `data/route.json`. Le runtime actuel contient les marqueurs utilisés pour le test visuel, mais le prochain agent doit considérer le Sheet comme source éditoriale finale.

## 5. Deux tests qui étaient rouges et viennent d'être corrigés

Le dernier run utilisateur montrait 46/48 tests verts, avec deux faux échecs :

1. `Flovoraison` apparaissait deux fois après normalisation UI du titre.  
   Cause : `routeContracts.test.ts` utilisait `loadBundledRoute()`, donc auditait les titres déjà nettoyés.  
   Correction poussée : le test audite maintenant directement `data/route.json` validé, donc les checkpoints éditoriaux distincts restent distinguables.

2. `DISPLAY_ROLE decides checkbox boundaries...` attendait encore qu'aucune action ne survive dans une séquence.  
   Cause : ancien contrat de test.  
   Correction poussée : les actions restent sur les `OBJECTIVE`, mais sont supprimées des `DETAIL` / `TRANSITION`.

Après pull, repasser :

```powershell
pnpm.cmd test:route
pnpm.cmd validate:route
pnpm.cmd build
```

État attendu : **48/48 tests verts**, route valide, build vert.

Le warning Vite `chunk > 500 kB` n'est pas un échec.

## 6. Ce qu'il reste avant clôture V1

### A — Validation immédiate

1. Pull les derniers commits distants.
2. Repasser les 3 commandes ci-dessus.
3. Vérifier visuellement au moins :
   - une quête d'Alignement avec bouclier ;
   - une quête Dofus avec œuf ;
   - un donjon avec château ;
   - un titre `— avancer jusqu'à...` affiché sans suffixe ;
   - un donjon `— PASSAGE #N` affiché sans suffixe ;
   - une carte composite qui garde son suffixe utile.

### B — Vérification source → runtime

Faire une dernière comparaison `ROUTE!DOFUS_SERIES` → `data/route.json` puis réexporter depuis le Sheet si nécessaire.

Flux officiel :

```text
Google Sheet ROUTE
→ scripts/export-route.ts
→ data/route.json
→ test:route
→ validate:route
→ build
```

Ne pas maintenir une version JSON manuelle différente du Sheet.

### C — Audit release-readiness court

Une fois A+B verts :
- vérifier persistence/reprise de progression après fermeture ;
- vérifier navigation précédent/suivant + saut de carte + progression par bloc ;
- vérifier mode compact ;
- vérifier ouverture DPLN et copie `/travel` ;
- vérifier absence d'erreur console bloquante ;
- décider si `tsconfig.tsbuildinfo` doit rester suivi ou être ignoré ;
- ne traiter le warning bundle >500 kB que si une vraie raison performance existe, pas juste pour faire disparaître le warning.

### D — Gel V1

Quand A+B+C sont verts :
- figer la route V1 ;
- mettre à jour ce handoff avec le commit/tag de référence ;
- ne plus modifier la route sans bug concret ou nouvelle exigence métier ;
- passer aux évolutions produit post-V1.

## 7. Règles pour le prochain agent

- Ne jamais certifier une modification de route après quelques checks ciblés seulement.
- Ne jamais déplacer une chaîne juste parce qu'elle diffère de Ganymède.
- Ne pas dupliquer de logique métier dans React.
- Réutiliser les champs data existants avant d'ajouter une nouvelle métadonnée.
- Le titre éditorial complet reste dans la source ; le titre joueur court est un concern de présentation.
- `STEP_ID` reste l'identité stable.
- `MOMENT_ID` reste la seule frontière de carte multi-step.
- `completedStepIds` reste l'unique vérité de progression.

État de reprise attendu : **route métier figée, nettoyage UX presque terminé, tests à repasser après les deux corrections ci-dessus, puis recette finale et gel V1**.
