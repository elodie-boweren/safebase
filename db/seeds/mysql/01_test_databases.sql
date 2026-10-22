-- =============================================================
-- SAFEBASE - Fake MySQL databases for testing backups/restores
-- Runs automatically on the first start of the MySQL container
-- (mounted in /docker-entrypoint-initdb.d), as root.
-- Can be re-run at any time: it recreates the tables.
-- =============================================================

SET NAMES utf8mb4;
SET SESSION cte_max_recursion_depth = 10000;

-- -------------------------------------------------------------
-- 1. boutique_mysql : online shop
-- -------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS boutique_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON boutique_mysql.* TO 'safebase'@'%';
USE boutique_mysql;

DROP TABLE IF EXISTS lignes_commande, commandes, produits, clients;

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  ville VARCHAR(80) NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE produits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(120) NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  prix DECIMAL(8,2) NOT NULL,
  stock INT NOT NULL
);

CREATE TABLE commandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  statut VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE lignes_commande (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commande_id INT NOT NULL,
  produit_id INT NOT NULL,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produits(id)
);

INSERT INTO clients (prenom, nom, email, ville, created_at)
WITH RECURSIVE seq (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 500)
SELECT
  ELT(1 + n % 12, 'Alice', 'Bruno', 'Chloé', 'David', 'Emma', 'Farid', 'Gaëlle', 'Hugo', 'Inès', 'Julien', 'Karima', 'Lucas'),
  ELT(1 + (n * 7) % 10, 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'),
  CONCAT('client', n, '@example.com'),
  ELT(1 + (n * 3) % 8, 'Marseille', 'Lyon', 'Paris', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Lille'),
  TIMESTAMP('2025-01-01') + INTERVAL (n * 13) % 640 DAY + INTERVAL n % 24 HOUR
FROM seq;

INSERT INTO produits (nom, categorie, prix, stock)
WITH RECURSIVE seq (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 80)
SELECT
  CONCAT(ELT(1 + n % 8, 'Clavier', 'Souris', 'Écran', 'Casque', 'Webcam', 'Disque SSD', 'Câble USB-C', 'Hub'), ' modèle ', n),
  ELT(1 + n % 4, 'Périphériques', 'Audio', 'Stockage', 'Accessoires'),
  ROUND(5 + (n * 37) % 300 + 0.99, 2),
  (n * 11) % 150
FROM seq;

INSERT INTO commandes (client_id, statut, created_at)
WITH RECURSIVE seq (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 2000)
SELECT
  1 + (n * 17) % 500,
  ELT(1 + n % 5, 'livrée', 'livrée', 'expédiée', 'en attente', 'annulée'),
  TIMESTAMP('2025-03-01') + INTERVAL (n * 7) % 590 DAY + INTERVAL (n * 5) % 1440 MINUTE
FROM seq;

INSERT INTO lignes_commande (commande_id, produit_id, quantite, prix_unitaire)
WITH RECURSIVE seq (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 5000)
SELECT
  1 + (n - 1) % 2000,
  p.id,
  1 + n % 4,
  p.prix
FROM seq
JOIN produits p ON p.id = 1 + (n * 13) % 80;

-- -------------------------------------------------------------
-- 2. blog_mysql : blog
-- -------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS blog_mysql CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON blog_mysql.* TO 'safebase'@'%';
USE blog_mysql;

DROP TABLE IF EXISTS commentaires, articles, auteurs;

CREATE TABLE auteurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pseudo VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL,
  bio TEXT
);

CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auteur_id INT NOT NULL,
  titre VARCHAR(200) NOT NULL,
  contenu TEXT NOT NULL,
  publie BOOLEAN NOT NULL DEFAULT TRUE,
  published_at DATETIME NOT NULL,
  FOREIGN KEY (auteur_id) REFERENCES auteurs(id) ON DELETE CASCADE
);

CREATE TABLE commentaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  pseudo VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

INSERT INTO auteurs (pseudo, email, bio)
WITH RECURSIVE seq (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 15)
SELECT
  CONCAT('auteur_', n),
  CONCAT('auteur', n, '@blog.example.com'),
  CONCAT('Passionné·e de ', ELT(1 + n % 5, 'cuisine', 'voyage', 'développement web', 'photographie', 'jardinage'), '.')
FROM seq;

INSERT INTO articles (auteur_id, titre, contenu, publie, published_at)
WITH RECURSIVE seq (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 300)
SELECT
  1 + n % 15,
  CONCAT(ELT(1 + n % 6, '10 astuces pour ', 'Pourquoi j''aime ', 'Guide complet : ', 'Mon avis sur ', 'Débuter avec ', 'Les erreurs à éviter en '),
         ELT(1 + (n * 7) % 5, 'la cuisine', 'le voyage', 'le développement web', 'la photographie', 'le jardinage'), ' #', n),
  REPEAT('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ', 20 + n % 30),
  n % 10 <> 0,
  TIMESTAMP('2024-06-01') + INTERVAL (n * 3) % 850 DAY
FROM seq;

INSERT INTO commentaires (article_id, pseudo, message, created_at)
WITH RECURSIVE seq (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 1500)
SELECT
  1 + (n * 7) % 300,
  CONCAT('lecteur', n % 120),
  ELT(1 + n % 5, 'Super article, merci !', 'Je ne suis pas d''accord sur le point 3.', 'Très utile, je partage.', 'Vous auriez une source ?', 'J''ai testé, ça marche !'),
  TIMESTAMP('2024-06-15') + INTERVAL (n * 11) % 840 DAY
FROM seq;

FLUSH PRIVILEGES;
