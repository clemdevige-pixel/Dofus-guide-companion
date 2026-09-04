# HANDOFF — Dofus Guide Companion

Date: 2026-09-04

## 1. Contexte

Projet : **Dofus Guide Companion**
Repo : `clemdevige-pixel/Dofus-guide-companion`
Branche active : `agent/initial-scaffold`

Objectif : companion desktop Tauri/React affichant la roadmap Astrub → Dofus Sylvestre sous forme de cartes compactes réellement suivables ligne par ligne.

Source éditoriale : Google Sheet `Roadmap ULTIMATE V2 — Astrub → Dofus Sylvestre`, onglet `ROUTE`.
Runtime : `data/route.json`, généré uniquement par `scripts/export-route.ts`.

Avant toute modification lire :
1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md`
6. `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`
7. `HANDOFF.md`

## 2. Décisions structurantes

- une seule vérité éditoriale : `ROUTE` ;
- une seule vérité runtime : `data/route.json` généré ;
- aucune logique spécifique à une quête dans React ;
- `STEP_ID` = identité métier persistante d'une étape technique ;
- `MOMENT_ID` = identité éditoriale d'un moment joueur rendu comme une seule carte ;
- `POSITION` = lancement uniquement ;
- `DESTINATION` = déplacement ;
- `GUIDE_ITEMS` = actions internes courtes d'un moment ;
- `GOAL_ID / GOAL_PHASE` = fils rouges structurés ;
- `completedStepIds` reste la seule vérité de progression utilisateur ;
- une information utile ne doit apparaître qu'une fois dans le flux joueur.

## 3. État du chantier structurel

Les passes précédentes ont déjà fortement réduit la fragmentation de la route :
- suppression de nombreuses cartes purement administratives ;
- suppression des faux hard locks de niveau ;
- suppression des cartes `RÈGLE` résiduelles ;
- mutualisation de nombreuses chaînes `prendre → donjon → rendre → prendre la suivante` ;
- ajout massif de `MOMENT_ID` sur les moments joueur ;
- regroupement de chaînes Tour du Monde, Frigost, Pandala, Eliocalypse, Enutrosor, Cavaliers, fin Sylvestre, etc.

Le runtime a été régénéré et la CI a été verte sur le commit UI `8f1691debe2820d42a208bde8ab90c9e6ed022fb` avant la présente mise à jour documentaire.

## 4. Problème restant identifié

La mutualisation structurelle a réduit le nombre de cartes, mais a déplacé une partie de la dette **à l'intérieur des cartes** :
- trop de micro-étapes techniques affichées ;
- répétitions `REPRENDRE / FAIRE`, `FAIRE & VALIDER`, `REPRENDRE / TERMINER` ;
- même retour PNJ décrit plusieurs fois ;
- fin d'une carte répétée au début de la suivante ;
- cartes restantes dont la seule fonction est de rendre/reprendre/prendre la suite.

Conclusion validée avec le produit : **ne plus corriger ces cas un par un**. Il faut maintenant une passe globale anti-redondance / confort joueur sur toute la route.

## 5. Nouvelle méthodologie autoritaire

### 5.1 Principe central

**Une carte = un moment joueur. Une checkbox = un sous-objectif significatif.**

Les lignes techniques peuvent rester dans `ROUTE` pour la vérité métier et la progression, mais elles ne doivent pas toutes être rendues comme objectifs autonomes.

### 5.2 Deux niveaux dans une carte

#### Objectif principal — avec checkbox
Exemples :
- faire un donjon ;
- accomplir une étape de quête réelle ;
- combat/objectif majeur ;
- action structurante.

#### Transition obligatoire — sans checkbox
Afficher une transition seulement quand le joueur doit réellement faire quelque chose entre deux objectifs :
- rendre la quête ;
- prendre la suivante ;
- avancer la quête ;
- parler à un PNJ ;
- donner/récupérer un objet ;
- effectuer une action de sortie indispensable.

La transition doit préciser le PNJ et la position quand la donnée existe.

### 5.3 Exemple de rendu cible validé

```text
☐ Shin Larve — Donjon des Larves · capturer pour l’Ocre
→ Retourner voir Pat Akess [x,y] — rendre Shin Larve puis prendre Rakoopeur
☐ Rakoopeur — Refuge Sylvestre · capturer pour l’Ocre
→ Retourner voir Pat Akess [x,y] — rendre Rakoopeur puis prendre Craqueleur Légendaire
☐ Craqueleur Légendaire — prendre l’objectif puis STOP
```

La transition finale n'est ajoutée que si elle est réellement nécessaire.

### 5.4 Informations critiques à conserver

Toujours conserver quand pertinent :
- Ocre / capture boss ;
- STOP ;
- objet requis ;
- ordre obligatoire ;
- dialogue de sortie ;
- vraie condition de progression ;
- action nécessaire avant le prochain donjon.

### 5.5 Redondances à supprimer

Faire disparaître :
- labels techniques qui répètent l'objectif ;
- « quête terminée » sans action supplémentaire ;
- retour PNJ écrit en fin d'objectif puis répété dans le suivant ;
- carte autonome de rendu/reprise si elle peut devenir une transition ;
- répétition de la fin de N au début de N+1 ;
- texte explicatif qui répète déjà le titre ou la transition.

## 6. Règle de passe globale à exécuter maintenant

La prochaine intervention doit lancer la **Passe 7 — anti-redondance / confort joueur** décrite dans `docs/ROUTE_OPTIMIZATION_WORKFLOW.md`.

Pour chaque carte puis chaque paire de cartes adjacentes :
1. identifier les sous-objectifs significatifs ;
2. conserver une checkbox par sous-objectif ;
3. convertir les rendus/prises/avancées indispensables en transitions compactes ;
4. supprimer les phrases doublonnées dans la carte ;
5. comparer la fin de N au début de N+1 ;
6. absorber les cartes purement administratives ;
7. conserver Ocre/STOP/objets/ordre/conditions ;
8. vérifier que le joueur sait toujours exactement quoi faire entre deux donjons.

Critère de réussite :
- moins de cartes ;
- moins de texte ;
- aucune transition nécessaire perdue.

## 7. Architecture UI déjà préparée

`src/route/selectors.ts` et `src/App.tsx` ont été modifiés juste avant ce handoff pour commencer à distinguer les sous-objectifs des détails techniques dans les séquences.

Important : cette première adaptation UI **ne suffit pas**. Le chantier demandé est maintenant global et doit aussi nettoyer la source éditoriale quand la redondance est portée par `ROUTE`.

Ne pas ajouter de parsing métier dans React. Utiliser en priorité :
- `MOMENT_ID` ;
- `GUIDE_ITEMS` ;
- types structurés ;
- `POSITION` / `DESTINATION` ;
- autres champs existants.

Si la donnée structurée manque pour une transition importante, enrichir `ROUTE` proprement plutôt que déduire depuis une chaîne de texte côté UI.

## 8. Cas de référence immédiat — Pat Akess / Les sbires du maître

Dans `ROUTE`, lignes autour de 217–221 :
- objectif Shin Larve ;
- Donjon des Larves ;
- objectif Rakoopeur ;
- Refuge Sylvestre ;
- objectif Craqueleur Légendaire / STOP.

Le rendu actuel est encore trop répétitif. Ce paquet doit servir de premier cas de validation de la nouvelle méthode :
- checkbox Shin Larve + capture Ocre ;
- transition Pat Akess : rendre + prendre Rakoopeur ;
- checkbox Rakoopeur + capture Ocre ;
- transition Pat Akess : rendre + prendre Craqueleur ;
- checkbox/objectif Craqueleur + STOP.

Attention : la position de Pat Akess `[5,0]` est déjà structurée ailleurs dans la route ; ne pas l'inventer ni parser un texte pour la récupérer.

## 9. Docs mises à jour pour cette nouvelle phase

Mises à jour le 2026-09-04 :
- `AGENTS.md` ;
- `docs/ROUTE_OPTIMIZATION.md` ;
- `docs/ROUTE_OPTIMIZATION_WORKFLOW.md` ;
- `HANDOFF.md`.

Elles contiennent maintenant le contrat de rendu cible et la passe anti-redondance globale.

## 10. Prochain chantier exact

1. utiliser Pat Akess comme cas témoin ;
2. vérifier que le rendu cible est atteint sans parsing React ;
3. appliquer la même méthode globalement à toutes les cartes mutualisées ;
4. faire l'audit inter-cartes sur toute la route ;
5. supprimer/absorber les cartes administratives restantes ;
6. mettre à jour `ROUTE` quand la redondance vient de la source ;
7. régénérer `data/route.json` ;
8. lancer :

```bash
pnpm export:route
pnpm test:route
pnpm validate:route
pnpm build
```

9. valider ensuite le rendu Tauri Windows.

## 11. Points de vigilance

- ne jamais parser titres/instructions pour reconnaître une quête, un PNJ ou une transition ;
- ne pas supprimer une vraie transition entre deux donjons sous prétexte de compacter ;
- ne jamais transformer chaque ligne technique en checkbox ;
- ne pas conserver une carte uniquement parce qu'elle possède un `STEP_ID` ;
- `STEP_ID` reste nécessaire à la progression même si l'étape devient un détail/transition visuelle ;
- `MOMENT_ID` doit rester contigu et dans un bloc ;
- ne jamais corriger `data/route.json` à la main ;
- relire les cellules techniques après chaque écriture Sheets ;
- ne pas annoncer la passe finie avant audit de la dernière carte et validation mécanique complète.

## 12. État validation au moment de ce handoff

- dernière CI code avant docs : **SUCCESS** sur `8f1691debe2820d42a208bde8ab90c9e6ed022fb` ;
- docs de nouvelle méthodologie : mises à jour après cette CI ;
- passe anti-redondance globale : **À DÉMARRER** ;
- aucun changement Sheet de cette nouvelle passe encore appliqué ;
- prochain export/tests/build requis après les modifications de route/UI de la passe.