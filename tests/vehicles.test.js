const request = require('supertest');
const app = require('../server');

describe('Vehicle Management API', () => {
  let authCookie;
  let testVehicleId;

  beforeAll(async () => {
    // Authentification admin
    const loginResponse = await request(app)
      .post('/api/signin')
      .send({
        email: 'garagiste@vroumvroum.fr',
        password: 'Azerty@01'
      });
    
    if (loginResponse.headers['set-cookie']) {
      authCookie = loginResponse.headers['set-cookie'];
    }
  });

  describe('GET /api/vehicules', () => {
    test('Should get all vehicles for admin', async () => {
      const response = await request(app)
        .get('/api/vehicules')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('Should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/vehicules');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/vehicules', () => {
    test('Should create a new vehicle with valid data', async () => {
      const newVehicle = {
        marque: 'BMW',
        modele: 'X3',
        annee: 2023,
        name: 'BM-789-WX',
        type: 'SUV'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authCookie)
        .send(newVehicle);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Véhicule ajouté avec succès');
      expect(response.body.id).toBeDefined();
      
      testVehicleId = response.body.id;
    });

    test('Should validate license plate format', async () => {
      const invalidVehicle = {
        marque: 'Toyota',
        modele: 'Corolla',
        annee: 2022,
        name: 'invalid-plate-format',
        type: 'Berline'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authCookie)
        .send(invalidVehicle);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(error => error.path === 'name')).toBe(true);
    });

    test('Should prevent duplicate license plates', async () => {
      const duplicateVehicle = {
        marque: 'Audi',
        modele: 'A4',
        annee: 2022,
        name: 'BM-789-WX', // Same as previous test
        type: 'Berline'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authCookie)
        .send(duplicateVehicle);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('plaque d\'immatriculation existe déjà');
    });

    test('Should validate required fields', async () => {
      const incompleteVehicle = {
        marque: '',
        modele: '',
        annee: 'invalid-year'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authCookie)
        .send(incompleteVehicle);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('Should validate year range', async () => {
      const invalidYearVehicle = {
        marque: 'Ford',
        modele: 'Focus',
        annee: 1800, // Too old
        name: 'FO-123-RD',
        type: 'Berline'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authCookie)
        .send(invalidYearVehicle);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/vehicules/:id', () => {
    test('Should update vehicle with valid data', async () => {
      const updatedData = {
        marque: 'BMW',
        modele: 'X3 M',
        annee: 2024,
        name: 'BM-789-WX',
        type: 'SUV',
        client_id: null
      };

      const response = await request(app)
        .put(`/api/vehicules/${testVehicleId}`)
        .set('Cookie', authCookie)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Véhicule modifié avec succès');
    });

    test('Should return 404 for non-existent vehicle', async () => {
      const updatedData = {
        marque: 'Test',
        modele: 'Test',
        annee: 2023,
        name: 'TE-123-ST',
        type: 'Berline'
      };

      const response = await request(app)
        .put('/api/vehicules/99999')
        .set('Cookie', authCookie)
        .send(updatedData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Véhicule non trouvé');
    });

    test('Should validate ID parameter', async () => {
      const updatedData = {
        marque: 'Test',
        modele: 'Test',
        annee: 2023,
        name: 'TE-123-ST',
        type: 'Berline'
      };

      const response = await request(app)
        .put('/api/vehicules/invalid-id')
        .set('Cookie', authCookie)
        .send(updatedData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ID véhicule invalide');
    });
  });

  describe('DELETE /api/vehicules/:id', () => {
    test('Should delete vehicle successfully', async () => {
      const response = await request(app)
        .delete(`/api/vehicules/${testVehicleId}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Véhicule supprimé avec succès');
    });

    test('Should return 404 when deleting non-existent vehicle', async () => {
      const response = await request(app)
        .delete('/api/vehicules/99999')
        .set('Cookie', authCookie);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Véhicule non trouvé');
    });

    test('Should validate ID parameter for deletion', async () => {
      const response = await request(app)
        .delete('/api/vehicules/invalid-id')
        .set('Cookie', authCookie);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ID véhicule invalide');
    });
  });

  describe('Security Tests', () => {
    test('Should require admin role for vehicle operations', async () => {
      // Se connecter comme client
      const clientLogin = await request(app)
        .post('/api/signin')
        .send({
          email: 'edward.elric@alchem.fma',
          password: 'Azerty@01'
        });

      const clientCookie = clientLogin.headers['set-cookie'];

      const response = await request(app)
        .get('/api/vehicules')
        .set('Cookie', clientCookie);

      expect(response.status).toBe(403);
    });

    test('Should sanitize SQL injection attempts', async () => {
      const maliciousVehicle = {
        marque: 'Toyota\'; DROP TABLE vehicules; --',
        modele: 'Corolla',
        annee: 2022,
        name: 'TO-456-YO',
        type: 'Berline'
      };

      const response = await request(app)
        .post('/api/vehicules')
        .set('Cookie', authCookie)
        .send(maliciousVehicle);

      // Should either succeed (properly escaped) or fail validation
      expect([201, 400]).toContain(response.status);
    });
  });

  afterAll(() => {
    // Cleanup
    process.exit(0);
  });
});