# Data

Ce dossier contiendra les données de route consommées par l'application.

## Cible V1

```text
data/
├─ route.json
└─ route.schema.json   # optionnel si validation runtime via TypeScript/Zod
```

## Règles

- `route.json` est généré depuis la roadmap éditoriale ;
- ne pas éditer manuellement une copie différente de la logique métier dans le code ;
- chaque étape doit conserver un identifiant stable ;
- un export invalide doit échouer avant d'être livré à l'application ;
- les colonnes internes d'audit du Google Sheet ne sont pas des données produit.

Voir `docs/DATA_MODEL.md` avant d'implémenter l'exporteur.
