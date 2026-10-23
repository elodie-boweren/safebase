-- =============================================================
-- SAFEBASE - Fake PostgreSQL databases for testing backups/restores
-- Runs automatically on the first start of the PostgreSQL container
-- (mounted in /docker-entrypoint-initdb.d), with psql.
-- Can be re-run at any time: it recreates the tables.
-- =============================================================

SET client_min_messages = warning;

-- -------------------------------------------------------------
-- 1. bibliotheque_postgres : library
-- -------------------------------------------------------------
SELECT 'CREATE DATABASE bibliotheque_postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bibliotheque_postgres')\gexec

\connect bibliotheque_postgres

DROP TABLE IF EXISTS emprunts, livres, membres, auteurs CASCADE;

CREATE TABLE auteurs (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  pays VARCHAR(50) NOT NULL,
  naissance INT
);

CREATE TABLE livres (
  id SERIAL PRIMARY KEY,
  auteur_id INT NOT NULL REFERENCES auteurs(id) ON DELETE CASCADE,
  titre VARCHAR(200) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  isbn VARCHAR(20) NOT NULL UNIQUE,
  annee INT NOT NULL,
  exemplaires INT NOT NULL DEFAULT 1
);

CREATE TABLE membres (
  id SERIAL PRIMARY KEY,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  inscrit_le DATE NOT NULL
);

CREATE TABLE emprunts (
  id SERIAL PRIMARY KEY,
  livre_id INT NOT NULL REFERENCES livres(id) ON DELETE CASCADE,
  membre_id INT NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
  emprunte_le DATE NOT NULL,
  rendu_le DATE
);

INSERT INTO auteurs (nom, pays, naissance)
SELECT
  (ARRAY['Victor Hugo', 'Albert Camus', 'Simone de Beauvoir', 'Jules Verne', 'Marguerite Duras',
         'Émile Zola', 'George Sand', 'Gustave Flaubert', 'Colette', 'Boris Vian',
         'Annie Ernaux', 'Romain Gary', 'Marcel Proust', 'Françoise Sagan', 'Alexandre Dumas'])[n],
  (ARRAY['France', 'Algérie', 'France', 'France', 'Indochine'])[1 + n % 5],
  1800 + (n * 13) % 150
FROM generate_series(1, 15) AS n;

INSERT INTO livres (auteur_id, titre, genre, isbn, annee, exemplaires)
SELECT
  1 + n % 15,
  (ARRAY['Le', 'La', 'Les', 'Un', 'Une'])[1 + n % 5] || ' '
    || (ARRAY['voyage', 'mémoire', 'nuit', 'jardin', 'secret', 'rivière', 'lettre', 'promesse'])[1 + (n * 3) % 8]
    || ' ' || (ARRAY['oublié', 'du nord', 'sans fin', 'd''hiver', 'perdu', 'des autres'])[1 + (n * 7) % 6]
    || ' (tome ' || (1 + n % 3) || ')',
  (ARRAY['Roman', 'Essai', 'Poésie', 'Théâtre', 'Science-fiction', 'Policier'])[1 + n % 6],
  '978-2-' || lpad(n::text, 6, '0'),
  1850 + (n * 7) % 175,
  1 + n % 4
FROM generate_series(1, 400) AS n;

INSERT INTO membres (prenom, nom, email, inscrit_le)
SELECT
  (ARRAY['Léa', 'Nathan', 'Manon', 'Hugo', 'Jade', 'Louis', 'Camille', 'Adam', 'Sarah', 'Yanis'])[1 + n % 10],
  (ARRAY['Garcia', 'Lefebvre', 'Roux', 'Fournier', 'Girard', 'Bonnet', 'Mercier', 'Blanc'])[1 + (n * 3) % 8],
  'membre' || n || '@example.com',
  DATE '2022-01-01' + (n * 5) % 1300
FROM generate_series(1, 300) AS n;

INSERT INTO emprunts (livre_id, membre_id, emprunte_le, rendu_le)
SELECT
  1 + (n * 7) % 400,
  1 + (n * 11) % 300,
  DATE '2024-01-01' + (n * 3) % 650,
  CASE WHEN n % 8 = 0 THEN NULL ELSE DATE '2024-01-01' + (n * 3) % 650 + 7 + n % 21 END
FROM generate_series(1, 3000) AS n;

ALTER DATABASE bibliotheque_postgres OWNER TO safebase;
ALTER TABLE auteurs OWNER TO safebase;
ALTER TABLE livres OWNER TO safebase;
ALTER TABLE membres OWNER TO safebase;
ALTER TABLE emprunts OWNER TO safebase;

-- -------------------------------------------------------------
-- 2. rh_postgres : human resources
-- -------------------------------------------------------------
\connect demo_postgres

SELECT 'CREATE DATABASE rh_postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rh_postgres')\gexec

\connect rh_postgres

DROP TABLE IF EXISTS conges, employes, departements CASCADE;

CREATE TABLE departements (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(80) NOT NULL UNIQUE,
  budget NUMERIC(12,2) NOT NULL
);

CREATE TABLE employes (
  id SERIAL PRIMARY KEY,
  departement_id INT NOT NULL REFERENCES departements(id),
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  poste VARCHAR(80) NOT NULL,
  salaire NUMERIC(10,2) NOT NULL,
  embauche_le DATE NOT NULL
);

CREATE TABLE conges (
  id SERIAL PRIMARY KEY,
  employe_id INT NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  debut DATE NOT NULL,
  fin DATE NOT NULL,
  type VARCHAR(30) NOT NULL,
  statut VARCHAR(20) NOT NULL
);

INSERT INTO departements (nom, budget) VALUES
  ('Direction', 450000),
  ('Développement', 1200000),
  ('Marketing', 380000),
  ('Ressources humaines', 220000),
  ('Support client', 310000),
  ('Finance', 290000);

INSERT INTO employes (departement_id, prenom, nom, poste, salaire, embauche_le)
SELECT
  1 + n % 6,
  (ARRAY['Thomas', 'Clara', 'Mehdi', 'Laura', 'Antoine', 'Nadia', 'Maxime', 'Julie', 'Karim', 'Pauline'])[1 + n % 10],
  (ARRAY['Laurent', 'Simon', 'Michel', 'Lefèvre', 'Fontaine', 'Chevalier', 'Rousseau', 'Vincent'])[1 + (n * 3) % 8],
  (ARRAY['Responsable', 'Chargé·e', 'Assistant·e', 'Ingénieur·e', 'Analyste'])[1 + n % 5],
  28000 + (n * 731) % 42000,
  DATE '2015-01-01' + (n * 17) % 3900
FROM generate_series(1, 150) AS n;

INSERT INTO conges (employe_id, debut, fin, type, statut)
SELECT
  1 + (n * 7) % 150,
  DATE '2025-01-01' + (n * 3) % 600,
  DATE '2025-01-01' + (n * 3) % 600 + 1 + n % 14,
  (ARRAY['Congés payés', 'RTT', 'Maladie', 'Sans solde'])[1 + n % 4],
  (ARRAY['validé', 'validé', 'en attente', 'refusé'])[1 + (n * 5) % 4]
FROM generate_series(1, 800) AS n;

ALTER DATABASE rh_postgres OWNER TO safebase;
ALTER TABLE departements OWNER TO safebase;
ALTER TABLE employes OWNER TO safebase;
ALTER TABLE conges OWNER TO safebase;
