# Tester l'API SafeBase avec Postman

## 1. Lancer le projet

À la racine du projet :

```
docker compose up --build -d
```

Vérifier que tout tourne : `docker compose ps`
Voir les logs de l'API : `docker compose logs -f backend`

> Si une requête renvoie `relation "users" does not exist`, les tables n'ont pas été créées
> (le fichier `db/schema.sql` ne s'exécute qu'à la première création du volume Postgres).
> Lancer `docker compose down -v` puis `docker compose up --build -d`.
> **Attention : `-v` efface les données des bases.**

## 2. Importer la collection

1. Ouvrir Postman → **Import**
2. Choisir le fichier `docs/testings/SafeBase_API.postman_collection.json`
3. Clic droit sur la collection **SafeBase API** → **Run collection** → **Run**

Les requêtes s'exécutent dans l'ordre. Le token de connexion et l'id de la base créée
sont enregistrés automatiquement : il n'y a rien à copier-coller.
Chaque requête contient des tests (onglet **Test Results**) : tout doit être vert.

## 3. Ce qui est testé

| # | Requête | Méthode | Route | Résultat attendu |
|---|---|---|---|---|
| 1 | Health check | GET | `/api/health` | 200 `{"status":"ok"}` |
| 2 | Racine | GET | `/` | 200 `SafeBase API is running` |
| 3 | Connexion à Postgres | GET | `/test-db` | 200 `Base connectée...` |
| 4 | Inscription | POST | `/auth/register` | 201, sans le mot de passe |
| 5 | Inscription, email déjà utilisé | POST | `/auth/register` | 400 |
| 6 | Connexion, mauvais mot de passe | POST | `/auth/login` | 401 `Identifiants invalides` |
| 7 | Connexion | POST | `/auth/login` | 200 + `token` |
| 8 | Profil | GET | `/me` 🔒 | 200 + `user_id` |
| 9 | Sans token | GET | `/databases` | 401 `Token manquant` |
| 10 | Token invalide | GET | `/databases` | 403 `Token invalide ou expiré` |
| 11 | Ajouter une base | POST | `/databases` 🔒 | 201, sans le mot de passe |
| 12 | Lister mes bases | GET | `/databases` 🔒 | 200, contient la base créée |
| 13 | Supprimer une base inexistante | DELETE | `/databases/999999` 🔒 | 404 `Base introuvable` |
| 14 | Supprimer la base | DELETE | `/databases/:id` 🔒 | 200 `Base supprimée` |

🔒 = header `Authorization: Bearer <token>` requis

## 4. Vérifications manuelles (optionnel)

**Le mot de passe des bases est chiffré en base de données.**
Avant l'étape 14 (ou après avoir ajouté une base à la main) :

```
docker exec -it safebase_postgres psql -U safebase -d demo_postgres -c "SELECT name, password FROM databases;"
```

Le mot de passe doit apparaître sous la forme `iv:hexadécimal`, jamais en clair.

**Une utilisatrice ne peut pas supprimer la base d'une autre.**
Créer un 2ᵉ compte, se connecter avec, puis faire `DELETE /databases/<id d'une base du 1er compte>` :
la réponse doit être **404**.

## 5. Limite connue

`POST /databases` sans le champ `password` renvoie une erreur **500** :
il n'y a pas encore de validation des champs.
