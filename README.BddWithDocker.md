# Configuration Docker pour la base de données MySQL

Ce fichier explique comment utiliser Docker Compose pour configurer et exécuter la base de données MySQL nécessaire au projet.

## Prérequis

- Docker et Docker Compose installés sur votre machine
- Docker en marche

## Démarrage de la base de données

Pour démarrer la base de données MySQL, exécutez la commande suivante à la racine du projet :

```bash
docker-compose up -d
```

Cela va :
1. Télécharger l'image MySQL 8.0 si nécessaire
2. Créer un conteneur nommé `garage_db`
3. Configurer la base de données avec les paramètres suivants :
   - Nom de la base de données : `garage_db`
   - Utilisateur : `root`
   - Mot de passe : `` (vide)
4. Exécuter automatiquement le script SQL d'initialisation situé dans `./configs/garage.sql`
5. Exposer la base de données sur le port 3306

## Arrêt de la base de données

Pour arrêter la base de données, exécutez :

```bash
docker-compose down
```

Pour arrêter la base de données et supprimer les volumes (ce qui effacera toutes les données), exécutez :

```bash
docker-compose down -v
```

## Connexion à la base de données

Vous pouvez vous connecter à la base de données avec les informations suivantes :

- Hôte : `localhost`
- Port : `3306`
- Utilisateur : `root`
- Mot de passe : `` (vide)
- Base de données : `garage_db`

Ces paramètres correspondent à la configuration dans le fichier `server.js`.