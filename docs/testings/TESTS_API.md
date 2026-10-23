# Testing SafeBase API with Postman

## 1. Start the project

At the project root :

```
docker compose up --build -d
```

Check that everything is running : `docker compose ps`
See API logs : `docker compose logs -f backend`

> If the request comes back with `relation "users" does not exist`, the tables haven't been created
> (the file `db/schema.sql` only runsupon creation of the Postgres volume).
> Run `docker compose down -v` then `docker compose up --build -d`.
> **Attention : `-v` deletes data from the databases.**

## 2. Import the collection

1. Open Postman → **Import**
2. Select the file `docs/testings/SafeBase_API.postman_collection.json`
3. Right click on the collection **SafeBase API** → **Run collection** → **Run**

The requests are run in the order they are shown. The connection token and base id of the base created are saved automatically: there is nothing to copy-paste.
Every request conatins tests (tab **Test Results**) : everything must be green. 

## 3. What is tested

| # | Request | Method | Route | Expected results |
|---|---|---|---|---|
| 1 | Health check | GET | `/api/health` | 200 `{"status":"ok"}` |
| 2 | Racine | GET | `/` | 200 `SafeBase API is running` |
| 3 | Connection to Postgres | GET | `/test-db` | 200 `Base connectée...` |
| 4 | Inscription | POST | `/auth/register` | 201, without the password |
| 5 | Registration, email already used | POST | `/auth/register` | 400 |
| 6 | Connection, incorrect password | POST | `/auth/login` | 401 `Identifiants invalides` |
| 7 | Connection | POST | `/auth/login` | 200 + `token` |
| 8 | Profile | GET | `/me` 🔒 | 200 + `user_id` |
| 9 | Without token | GET | `/databases` | 401 `Token manquant` |
| 10 | Invalid token | GET | `/databases` | 403 `Token invalide ou expiré` |
| 11 | Add a base | POST | `/databases` 🔒 | 201, sans le mot de passe |
| 12 | List my databases | GET | `/databases` 🔒 | 200, contains the base created |
| 13 | Delete a non-existing base | DELETE | `/databases/999999` 🔒 | 404 `Base introuvable` |
| 14 | Delete a base | DELETE | `/databases/:id` 🔒 | 200 `Base supprimée` |

🔒 = header `Authorization: Bearer <token>` necessary

## 4. Manual verification (optionnal)

**The bases password is encrypted in the database.**
Before step 14 (or after having added a database manually) :

```
docker exec -it safebase_postgres psql -U safebase -d demo_postgres -c "SELECT name, password FROM databases;"
```

The password must appear in `iv:cipher`, never in plain text.

**A user can never delete the database of someone else.**
Create a second account, connect with it, then do `DELETE /databases/<id of a database of the first user account>` :
the reply must be **404**.

## 5. Known limit

`POST /databases` without the password field `password` sends back a **500** error :
there is no field validation yet.
