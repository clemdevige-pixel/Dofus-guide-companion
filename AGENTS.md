# AGENTS.md — Dofus Guide Companion

Ce fichier est le contrat de travail des agents qui interviennent sur ce repo.

## 1. Lire avant de coder

Toujours lire, dans cet ordre :

1. `AGENTS.md`
2. `SPEC.md`
3. `ARCHITECTURE.md`
4. `docs/DATA_MODEL.md`
5. `docs/ROUTE_OPTIMIZATION.md` pour tout chantier touchant à l'ordre, au scope ou aux mutualisations de la route

Ne pas coder sur la base d'une supposition si la spec ou le modèle de données ne tranche pas le sujet.

## 2. Principes non négociables

- Architecture simple, locale et **data-driven**.
- Le Google Sheet est la source éditoriale ; l'app consomme `data/route.json`.
- Aucune logique spécifique à une quête dans React.
- Ne jamais parser du texte d'affichage pour déduire un comportement métier.
- Une seule vérité pour la progression utilisateur.
- Identifiants d'étapes stables, indépendants des numéros de ligne du Sheet.
- Ne pas ajouter backend, API, store global, abstraction ou dépendance sans besoin démontré.
- Réutiliser l'existant avant de créer une nouvelle couche.
- Pour l'optimisation de route : notre Sheet définit le scope ; Ganymède définit l'ordre/mutualisation à étudier ; toute modification reste vérifiée avant intégration.

## 3. Interdictions explicites

Interdit :

```ts
if (step.title === "L'éternelle moisson") { ... }
```

Interdit également :

- utiliser un numéro de ligne Google Sheet comme identifiant métier ;
- dupliquer `completed`, `currentStep` ou la progression dans plusieurs stores ;
- synchroniser le Sheet en live pendant l'usage normal ;
- introduire OCR, lecture mémoire du jeu, automatisation ou injection ;
- ajouter du click-through avant la V1.1 ;
- créer des composants génériques sans au moins deux usages concrets ;
- recopier GP0 en bloc sans filtrer le scope Sylvestre ;
- considérer une même position ou un même donjon comme preuve suffisante de mutualisation sans vérifier les prérequis.

## 4. Stack V1

- Tauri 2
- React
- TypeScript
- Vite
- CSS simple / composants locaux
- persistance locale

Favoriser les API natives Tauri et le code TypeScript standard. Éviter les bibliothèques UI lourdes tant qu'elles ne sont pas nécessaires.

## 5. Organisation du code

L'arborescence doit rester guidée par les besoins réels. Cible générale :

```text
src/
├─ app/
├─ route/
├─ progress/
├─ overlay/
├─ features/
└─ ui/
```

Ne pas créer les dossiers/modules tant qu'un besoin concret ne les justifie pas.

## 6. État et sélecteurs

La progression réelle repose sur `completedStepIds`.

L'étape à faire doit être dérivée autant que possible de la première étape non validée.

Un index de consultation temporaire peut exister pour naviguer, mais ne doit pas devenir une deuxième vérité de progression.

Les éléments suivants doivent être dérivés :

- progression globale ;
- progression du bloc ;
- première étape non validée ;
- fils rouges actifs ;
- prochain verrou dur ;
- bloc terminé.

## 7. UI

Les wireframes de `SPEC.md` sont la référence V1.

Priorités :

1. lisibilité en jeu ;
2. faible encombrement ;
3. navigation immédiate ;
4. cohérence visuelle par `StepType` ;
5. resize sans casse.

Largeur compacte par défaut : 380 px, mais la fenêtre doit rester librement redimensionnable.

Ne pas générer de logique visuelle depuis des mots présents dans `title` ou `instruction` : le rendu dépend de `type` et des champs structurés.

La refonte Ganymède peut rendre nécessaire une future vue « étape de parcours » avec plusieurs quêtes concernées. Ne pas bricoler cette vue depuis le texte : d'abord stabiliser et structurer le modèle de données, ensuite adapter l'UI.

## 8. Raccourcis

Les raccourcis globaux V1 sont configurables et persistés.

Valeurs par défaut :

- `Ctrl+Alt+Right` : suivant
- `Ctrl+Alt+Left` : précédent
- `Ctrl+Alt+Enter` : valider / dévalider
- `Ctrl+Alt+Space` : afficher / masquer

Un conflit doit être remonté explicitement à l'utilisateur.

## 9. Export de route

Le flux cible est :

```text
Google Sheet → script TypeScript → validation stricte → data/route.json
```

L'export doit échouer en cas de :

- type inconnu ;
- id dupliqué ;
- blockId absent ;
- relation vers un goalId invalide ;
- lien invalide ;
- version de schéma non supportée ;
- action de lancement sans `LANCEMENT_REQUIS=TRUE` ;
- lancement requis sans `POSITION` ni `LANCEMENT`.

Ne jamais produire silencieusement un JSON partiellement valide.

`data/route.json` est un artefact généré : ne jamais le modifier manuellement pour corriger la route.

## 10. Qualité

Avant de considérer une phase terminée :

- TypeScript doit compiler ;
- le build front doit passer ;
- le build/check Tauri doit passer lorsque l'environnement le permet ;
- les tests ajoutés pendant la phase doivent passer ;
- aucun warning connu introduit volontairement ne doit être laissé sans justification.

Les tests doivent cibler la logique produite : validation de route, sélecteurs de progression, persistance, raccourcis, etc. Ne pas multiplier les tests de rendu sans valeur métier.

Pour un bloc de route optimisé, ajouter également les contrôles éditoriaux définis dans `docs/ROUTE_OPTIMIZATION.md` avant de le marquer `INTÉGRÉ`.

## 11. Méthode de changement

Pour chaque chantier :

1. comprendre l'existant ;
2. identifier la source de vérité ;
3. modifier le minimum nécessaire ;
4. éviter toute duplication ;
5. tester ce qui a été changé ;
6. mettre à jour la doc seulement si le contrat produit/architecture change.

Pour un chantier de route, suivre en plus le workflow `À AUDITER → EN AUDIT → VALIDÉ → INTÉGRÉ` décrit dans `docs/ROUTE_OPTIMIZATION.md` et suivi dans l'onglet `GANYMEDE_AUDIT` du Sheet.

Si une demande entre en conflit avec `SPEC.md` ou `ARCHITECTURE.md`, ne pas contourner le conflit : le signaler et faire valider la nouvelle décision avant de coder.
