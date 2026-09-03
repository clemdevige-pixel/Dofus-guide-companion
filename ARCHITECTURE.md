# ARCHITECTURE — Dofus Guide Companion

## 1. Principes

L'architecture doit rester simple, locale et data-driven.

Le companion ne connaît pas les règles métier de chaque quête. Il sait uniquement interpréter une route structurée.

## 2. Flux de données

```text
Google Sheet
    ↓
export / validation
    ↓
data/route.json
    ↓
route loader
    ↓
route state
    ↓
UI overlay
```

La progression utilisateur est séparée des données de route :

```text
route.json            user-progress.json / store local
     ↓                         ↓
     └──────── app state ──────┘
```

Une mise à jour de la route ne doit pas écraser la progression utilisateur tant que les identifiants d'étapes restent stables.

## 3. Stack

### Desktop

Tauri.

Responsabilités :

- fenêtre native ;
- always-on-top ;
- position / dimensions ;
- ouverture des liens externes ;
- persistance locale si nécessaire ;
- futurs raccourcis globaux.

### Front

React + TypeScript + Vite.

Responsabilités :

- rendu de l'étape courante ;
- navigation ;
- composants visuels par type ;
- fils rouges ;
- verrous ;
- progression ;
- préférences UI.

## 4. Modules cibles

```text
src/
├─ app/
│  ├─ App.tsx
│  └─ providers/
├─ route/
│  ├─ schema.ts
│  ├─ loader.ts
│  ├─ selectors.ts
│  └─ validation.ts
├─ progress/
│  ├─ progressStore.ts
│  └─ progressSelectors.ts
├─ overlay/
│  ├─ OverlayShell.tsx
│  └─ useWindowPreferences.ts
├─ features/
│  ├─ current-step/
│  ├─ long-running-goals/
│  ├─ hard-lock/
│  └─ preparation/
└─ ui/
   └─ composants génériques
```

Cette arborescence est indicative : ne pas créer des dossiers vides ou des abstractions avant qu'elles soient nécessaires.

## 5. État

État minimal :

- route chargée ;
- `completedStepIds` ;
- étape courante dérivée ;
- préférences overlay ;
- version de la route.

L'étape courante doit autant que possible être **dérivée** de la première étape non validée plutôt que maintenue comme une deuxième vérité indépendante.

Un pointeur manuel peut exister pour consulter les étapes précédentes/suivantes, mais il ne doit pas remplacer l'état réel de progression.

## 6. Identifiants stables

Chaque étape doit posséder un `id` stable indépendant de son numéro de ligne Google Sheet.

**Interdit :** utiliser `row 523` comme identité métier.

Les insertions dans le Sheet ne doivent pas invalider les sauvegardes locales.

Format recommandé :

```text
block-08-tablette-totankama-fil-rouge
block-08-tablette-totankama-lock
```

ou identifiant généré et ensuite conservé dans la source éditoriale.

## 7. Sélecteurs dérivés

Les comportements suivants doivent être calculés depuis les données :

- première étape non validée ;
- progression globale ;
- progression du bloc ;
- fils rouges actifs ;
- prochain verrou dur ;
- étape précédente / suivante ;
- statut terminé d'un bloc.

Aucun de ces éléments ne doit être dupliqué dans `route.json` s'il peut être dérivé sans ambiguïté.

## 8. Validation de données

Le chargement doit échouer clairement si :

- `id` dupliqué ;
- type inconnu ;
- bloc inexistant ;
- lien invalide ;
- relation de fil rouge/verrou vers un id absent ;
- version de schéma non supportée.

Un export invalide ne doit jamais produire silencieusement une route partiellement cassée.

## 9. Persistance

La sauvegarde locale doit être petite et atomique.

Exemple :

```json
{
  "schemaVersion": 1,
  "routeVersion": "2026-09-03",
  "completedStepIds": [],
  "ui": {
    "compact": true
  }
}
```

La position et la taille native de fenêtre peuvent être gérées séparément si Tauri fournit un mécanisme plus adapté.

## 10. Mise à jour de route

À terme :

1. exporter une nouvelle version ;
2. valider le schéma ;
3. charger la route ;
4. conserver les validations dont les `stepId` existent toujours ;
5. signaler les étapes supprimées ou renommées si nécessaire.

## 11. Anti-patterns interdits

- `if (step.name === "L'éternelle moisson")` dans l'UI ;
- stockage de la même progression dans plusieurs stores ;
- parsing du texte affiché pour deviner le comportement ;
- dépendre des numéros de ligne du Sheet ;
- synchroniser le Sheet en temps réel à chaque navigation ;
- ajouter une API/backend sans besoin V1 démontré.
