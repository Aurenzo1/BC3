const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Test login pour obtenir un token
    const loginResponse = await request(app)
      .post('/api/signin')
      .send({
        email: 'garagiste@vroumvroum.fr',
        password: 'Azerty@01'
      });
    
    if (loginResponse.headers['set-cookie']) {
      authToken = loginResponse.headers['set-cookie']
        .find(cookie => cookie.startsWith('token='))
        .split(';')[0];
    }
  });

  describe('Authentication', () => {
    test('Should register a new user', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          firstname: 'Test',
          lastname: 'User',
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Utilisateur créé avec succès');
    });

    test('Should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          firstname: 'Test',
          lastname: 'User',
          email: 'invalid-email',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/signin')
        .send({
          email: 'garagiste@vroumvroum.fr',
          password: 'Azerty@01'
        });

      expect(response.status).toBe(200);
      expect(response.body.auth).toBe(true);
      expect(response.body.role).toBe('admin');
    });

    test('Should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/signin')
        .send({
          email: 'wrong@email.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Email ou mot de passe incorrect');
    });
  });

  describe('Vehicle Management', () => {
    test('Should get all vehicles (admin only)', async () => {
      const response = await request(app)
        .get('/api/vehicules')
        .set('Cookie', authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should create a new vehicle', async () => {
      const newVehicle = {
        marque: 'Toyota',
        modele: 'Corolla',
        annee: 2022,
        name: 'XY-123-ZA',
        type: 'Berline'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authToken)
        .send(newVehicle);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Véhicule ajouté avec succès');
      expect(response.body.id).toBeDefined();
    });

    test('Should not create vehicle with invalid license plate', async () => {
      const invalidVehicle = {
        marque: 'Toyota',
        modele: 'Corolla',
        annee: 2022,
        name: 'INVALID-PLATE',
        type: 'Berline'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authToken)
        .send(invalidVehicle);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('Should not create duplicate license plate', async () => {
      const duplicateVehicle = {
        marque: 'Honda',
        modele: 'Civic',
        annee: 2021,
        name: 'XY-123-ZA', // Same as previous test
        type: 'Berline'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authToken)
        .send(duplicateVehicle);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('plaque d\'immatriculation existe déjà');
    });
  });

  describe('Security', () => {
    test('Should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/vehicules');

      expect(response.status).toBe(401);
    });

    test('Should validate input data', async () => {
      const invalidData = {
        marque: '', // Empty marque
        modele: 'Test',
        annee: 'invalid-year',
        name: 'invalid-plate'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authToken)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });
});

afterAll(() => {
  // Fermer les connexions
  process.exit(0);
});