require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require("csrf");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const tokens = new csrf();
const secretTokenCSRF = process.env.CSRF_SECRET || 'OEKFNEZKkF78EZFH93';
const JWT_SECRET = process.env.JWT_SECRET || 'OEKFNEZKkF78EZFH93023NOEAF';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
});

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'garage_db',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  ssl: false
});

function handleDisconnect() {
  db.connect((err) => {
    if (err) {
      console.log('Error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Connected to MySQL Database');
    }
  });

  db.on('error', (err) => {
    console.log('Database error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();
const verifyTokenAndRole = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Access Denied: No Token Provided!');
    }
    const roles = req.requiredroles || ["admin", "client"]
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      const sql = 'SELECT role FROM users WHERE id = ?';
      db.query(sql, [req.user.id], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Server error');
        }

        if (results.length === 0) {
          return res.status(404).send('User not found');
        }

        const userRole = results[0].role;
        if (!roles.includes(userRole)) {
        return res.status(403).send('Access Denied: You do not have the required role!');
      }

      next();
    })
    } catch (error) {
      res.status(400).send('Invalid Token');
    }
  };

const verifyCSRFToken = (req, res, next) => {
  const token = req.body.token;
  // secretTokenCSRF à remplacer par process.env.CSRF_TOKEN si .env
  if (!token || !tokens.verify(secretTokenCSRF, token)) {
    return res.status(403).send("Invalid CSRF Token");
  }
  next();
};

// Routes

app.get("/api/csrf", function (req, res) {
  const token = tokens.create(secretTokenCSRF);
  res.status(200).send({
    status: 200,
    message: "CSRF récupéré",
    token: token,
  });
});

app.post('/api/signup', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'),
    body('firstname').trim().isLength({ min: 2, max: 50 }).withMessage('Prénom entre 2 et 50 caractères'),
    body('lastname').trim().isLength({ min: 2, max: 50 }).withMessage('Nom entre 2 et 50 caractères')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lastname, firstname, email, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const checkUserSql = 'SELECT id FROM users WHERE email = ?';
    db.query(checkUserSql, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' });
      }
      
      const hashedPassword = bcrypt.hashSync(password, BCRYPT_ROUNDS);
      const sql = 'INSERT INTO users (lastname, firstname, email, password) VALUES (?, ?, ?, ?)';
      
      db.query(sql, [lastname, firstname, email, hashedPassword], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
        }
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
      });
    });
  }
);

app.post('/api/signin', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      const user = results[0];
      const passwordIsValid = bcrypt.compareSync(password, user.password);

      if (!passwordIsValid) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '24h', issuer: 'garage-app', audience: 'garage-users' }
      );
      
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400000 // 24 heures
      });

      res.status(200).json({ auth: true, role: user.role });
    });
  }
);

app.get('/api/clients/count', (req,_res, next) => {
  req.requiredroles = ["admin"]
  next()
},  verifyTokenAndRole, (req, res) => {
  const sql = 'SELECT COUNT(*) AS count FROM users WHERE role = ?';
  db.query(sql, ['client'], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }

    res.status(200).json(results[0]);
  });
});


app.get('/api/clients', (req, _res, next) => {
  console.log(req.cookies)
  req.requiredroles = ["admin"];
  console.table({
    request : req.requiredroles,
    token : req.cookies.token
  })
  next();
}, verifyTokenAndRole, (req, res) => {
  const sql = 'SELECT * FROM users WHERE role = ?';
  db.query(sql, ['client'], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results);
  });
});

// RGPD: Endpoint pour obtenir les données d'un véhicule spécifique (droit d'accès)
app.get('/api/vehicules/:id/gdpr-data', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'ID véhicule invalide' });
  }
  
  const sql = `SELECT v.id, v.marque, v.modele, v.annee, v.name, v.type, v.created_at,
               u.firstname, u.lastname, u.email
               FROM vehicules v 
               LEFT JOIN users u ON v.client_id = u.id
               WHERE v.id = ?`;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }
    
    const vehicle = results[0];
    const gdprData = {
      vehicleId: vehicle.id,
      licensePlate: vehicle.name,
      brand: vehicle.marque,
      model: vehicle.modele,
      year: vehicle.annee,
      type: vehicle.type,
      registrationDate: vehicle.created_at,
      associatedClient: vehicle.firstname && vehicle.lastname ? {
        name: `${vehicle.firstname} ${vehicle.lastname}`,
        email: vehicle.email
      } : null,
      dataProcessingPurpose: 'Gestion des véhicules du garage',
      legalBasis: 'Exécution d\'un contrat ou intérêt légitime',
      retentionPeriod: '7 ans après la dernière intervention',
      rightsInfo: {
        access: 'Vous pouvez demander l\'accès à vos données',
        rectification: 'Vous pouvez demander la correction des données inexactes',
        erasure: 'Vous pouvez demander la suppression de vos données',
        portability: 'Vous pouvez demander le transfert de vos données'
      }
    };
    
    res.status(200).json(gdprData);
  });
});

// Routes pour les véhicules
app.get('/api/vehicules', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  // RGPD: Logging de l'accès aux données personnelles
  console.log(`RGPD Audit: Accès aux données véhicules par l'utilisateur ${req.user.id} à ${new Date().toISOString()}`);
  
  const sql = `SELECT v.id, v.marque, v.modele, v.annee, v.name, v.type, v.created_at,
               u.firstname, u.lastname 
               FROM vehicules v 
               LEFT JOIN users u ON v.client_id = u.id`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    res.status(200).json(results);
  });
});

app.post('/api/vehicules', 
  [
    body('marque').trim().isLength({ min: 1, max: 50 }).withMessage('Marque requise (1-50 caractères)'),
    body('modele').trim().isLength({ min: 1, max: 50 }).withMessage('Modèle requis (1-50 caractères)'),
    body('annee').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
    body('name').trim().isLength({ min: 1, max: 255 }).matches(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/).withMessage('Plaque d\'immatriculation invalide (format: AA-123-BB)'),
    body('type').optional().isLength({ max: 50 }).withMessage('Type trop long (max 50 caractères)'),
    body('client_id').optional().isInt().withMessage('ID client invalide')
  ],
  (req, _res, next) => {
    req.requiredroles = ["admin"];
    next();
  }, 
  verifyTokenAndRole, 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { marque, modele, annee, client_id, name, type } = req.body;
    
    // Vérifier l'unicité de la plaque
    const checkPlateSql = 'SELECT id FROM vehicules WHERE name = ?';
    db.query(checkPlateSql, [name], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ error: 'Cette plaque d\'immatriculation existe déjà' });
      }
      
      const sql = 'INSERT INTO vehicules (marque, modele, annee, client_id, name, type) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(sql, [marque, modele, annee, client_id || null, name, type], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Erreur lors de l\'ajout du véhicule' });
        }
        res.status(201).json({ id: result.insertId, message: 'Véhicule ajouté avec succès' });
      });
    });
  }
);

app.put('/api/vehicules/:id', 
  [
    body('marque').trim().isLength({ min: 1, max: 50 }).withMessage('Marque requise (1-50 caractères)'),
    body('modele').trim().isLength({ min: 1, max: 50 }).withMessage('Modèle requis (1-50 caractères)'),
    body('annee').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
    body('name').trim().isLength({ min: 1, max: 255 }).matches(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/).withMessage('Plaque d\'immatriculation invalide (format: AA-123-BB)'),
    body('type').optional().isLength({ max: 50 }).withMessage('Type trop long (max 50 caractères)'),
    body('client_id').optional().isInt().withMessage('ID client invalide')
  ],
  (req, _res, next) => {
    req.requiredroles = ["admin"];
    next();
  }, 
  verifyTokenAndRole, 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { marque, modele, annee, client_id, name, type } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID véhicule invalide' });
    }
    
    // Vérifier l'unicité de la plaque (exclure le véhicule actuel)
    const checkPlateSql = 'SELECT id FROM vehicules WHERE name = ? AND id != ?';
    db.query(checkPlateSql, [name, id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      if (results.length > 0) {
        return res.status(409).json({ error: 'Cette plaque d\'immatriculation existe déjà' });
      }
      
      const sql = 'UPDATE vehicules SET marque = ?, modele = ?, annee = ?, client_id = ?, name = ?, type = ? WHERE id = ?';
      db.query(sql, [marque, modele, annee, client_id || null, name, type, id], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Erreur lors de la modification' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Véhicule non trouvé' });
        }
        res.status(200).json({ message: 'Véhicule modifié avec succès' });
      });
    });
  }
);

app.delete('/api/vehicules/:id', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'ID véhicule invalide' });
  }
  
  // RGPD: Audit de suppression (droit à l'effacement)
  const auditSql = 'SELECT name, marque, modele FROM vehicules WHERE id = ?';
  db.query(auditSql, [id], (auditErr, auditResult) => {
    if (auditErr) {
      console.error('Audit error:', auditErr);
    } else if (auditResult.length > 0) {
      console.log(`RGPD Audit: Suppression véhicule ${auditResult[0].name} ${auditResult[0].marque} ${auditResult[0].modele} par utilisateur ${req.user.id} à ${new Date().toISOString()}`);
    }
    
    const sql = 'DELETE FROM vehicules WHERE id = ?';
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Erreur lors de la suppression' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Véhicule non trouvé' });
      }
      
      res.status(200).json({ 
        message: 'Véhicule supprimé avec succès',
        gdprCompliance: 'Données supprimées conformément au droit à l\'effacement (RGPD Art. 17)' 
      });
    });
  });
});

app.use(express.static(path.join(__dirname, "./client/dist")))
app.get("*", (_, res) => {
    res.sendFile(
      path.join(__dirname, "./client/dist/index.html")
    )
})
// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
module.exports = app;