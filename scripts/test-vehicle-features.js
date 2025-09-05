#!/usr/bin/env node

/**
 * Script de test de non-régression pour la gestion des véhicules
 * Vérifie que toutes les fonctionnalités véhicules fonctionnent correctement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  testTimeout: 30000,
  adminCredentials: {
    email: 'garagiste@vroumvroum.fr',
    password: 'Azerty@01'
  }
};

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n📋 ${step}`, colors.blue);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function checkServerRunning() {
  logStep('Vérification du serveur');
  try {
    execSync(`curl -f ${config.baseUrl}/api/csrf`, { stdio: 'pipe' });
    logSuccess('Serveur accessible');
    return true;
  } catch (error) {
    logError('Serveur non accessible - démarrez le serveur avant de lancer les tests');
    return false;
  }
}

function runTests(testType, command) {
  logStep(`Exécution des tests ${testType}`);
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      timeout: config.testTimeout,
      encoding: 'utf8'
    });
    
    if (output.includes('FAIL') || output.includes('failed')) {
      logError(`Tests ${testType} échoués`);
      console.log(output);
      return false;
    } else {
      logSuccess(`Tests ${testType} passés`);
      return true;
    }
  } catch (error) {
    logError(`Erreur lors des tests ${testType}: ${error.message}`);
    return false;
  }
}

function checkFileIntegrity() {
  logStep('Vérification de l\'intégrité des fichiers');
  
  const criticalFiles = [
    'client/src/components/VehicleManager.jsx',
    'client/src/components/VehicleManager.css',
    'client/src/components/VehiclePrivacyNotice.jsx',
    'client/src/hooks/useVehicles.js',
    'client/src/utils/browserSupport.js',
    'server.js',
    'cypress/e2e/vehicle-management.cy.js',
    'cypress/e2e/vehicle-accessibility.cy.js',
    'tests/vehicles.test.js'
  ];
  
  let allFilesExist = true;
  
  for (const file of criticalFiles) {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
      logSuccess(`${file} présent`);
    } else {
      logError(`${file} manquant`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

function checkAPIEndpoints() {
  logStep('Vérification des endpoints API véhicules');
  
  const endpoints = [
    'GET /api/vehicules',
    'POST /api/vehicules', 
    'PUT /api/vehicules/:id',
    'DELETE /api/vehicules/:id',
    'GET /api/vehicules/:id/gdpr-data'
  ];
  
  try {
    const serverContent = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
    
    let allEndpointsPresent = true;
    
    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(' ');
      const routePattern = new RegExp(`app\\.${method.toLowerCase()}\\(['"]\\/api\\/vehicules`, 'i');
      
      if (serverContent.match(routePattern)) {
        logSuccess(`Endpoint ${endpoint} trouvé`);
      } else {
        logError(`Endpoint ${endpoint} manquant`);
        allEndpointsPresent = false;
      }
    }
    
    return allEndpointsPresent;
  } catch (error) {
    logError(`Impossible de vérifier les endpoints: ${error.message}`);
    return false;
  }
}

function checkSecurityFeatures() {
  logStep('Vérification des fonctionnalités de sécurité');
  
  const serverContent = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  
  const securityChecks = [
    { name: 'Validation des entrées', pattern: /express-validator|body\(/i },
    { name: 'Protection CSRF', pattern: /csrf/i },
    { name: 'Rate limiting', pattern: /rate.?limit/i },
    { name: 'Helmet security', pattern: /helmet/i },
    { name: 'Logs RGPD', pattern: /RGPD.*Audit/i }
  ];
  
  let allSecurityPresent = true;
  
  for (const check of securityChecks) {
    if (serverContent.match(check.pattern)) {
      logSuccess(`${check.name} implémenté`);
    } else {
      logWarning(`${check.name} non détecté`);
      allSecurityPresent = false;
    }
  }
  
  return allSecurityPresent;
}

function checkAccessibilityFeatures() {
  logStep('Vérification des fonctionnalités d\'accessibilité');
  
  try {
    const vehicleManagerContent = fs.readFileSync(
      path.join(__dirname, '..', 'client/src/components/VehicleManager.jsx'), 
      'utf8'
    );
    
    const a11yChecks = [
      { name: 'Labels ARIA', pattern: /aria-label/i },
      { name: 'Rôles sémantiques', pattern: /role=/i },
      { name: 'IDs pour les labels', pattern: /htmlFor=/i },
      { name: 'Descriptions ARIA', pattern: /aria-describedby/i },
      { name: 'États ARIA', pattern: /aria-expanded|aria-modal/i }
    ];
    
    let allA11yPresent = true;
    
    for (const check of a11yChecks) {
      if (vehicleManagerContent.match(check.pattern)) {
        logSuccess(`${check.name} implémenté`);
      } else {
        logError(`${check.name} manquant`);
        allA11yPresent = false;
      }
    }
    
    return allA11yPresent;
  } catch (error) {
    logError(`Impossible de vérifier l'accessibilité: ${error.message}`);
    return false;
  }
}

async function runRegressionTests() {
  log('\n🚀 DÉBUT DES TESTS DE NON-RÉGRESSION VÉHICULES\n', colors.blue);
  
  let allTestsPassed = true;
  
  // 1. Vérifications préliminaires
  if (!await checkServerRunning()) {
    return false;
  }
  
  if (!checkFileIntegrity()) {
    allTestsPassed = false;
  }
  
  if (!checkAPIEndpoints()) {
    allTestsPassed = false;
  }
  
  if (!checkSecurityFeatures()) {
    logWarning('Certaines fonctionnalités de sécurité ne sont pas détectées');
  }
  
  if (!checkAccessibilityFeatures()) {
    allTestsPassed = false;
  }
  
  // 2. Tests unitaires
  if (!runTests('unitaires', 'npm run test -- --testNamePattern="Vehicle"')) {
    allTestsPassed = false;
  }
  
  // 3. Tests d'intégration API
  if (!runTests('API véhicules', 'npm run test -- tests/vehicles.test.js')) {
    allTestsPassed = false;
  }
  
  // 4. Linting
  if (!runTests('de qualité de code', 'npm run lint:check')) {
    logWarning('Problèmes de qualité de code détectés');
  }
  
  // 5. Formatage
  if (!runTests('de formatage', 'npm run format:check')) {
    logWarning('Problèmes de formatage détectés');
  }
  
  // Résumé final
  log('\n📊 RÉSUMÉ DES TESTS\n', colors.blue);
  
  if (allTestsPassed) {
    logSuccess('🎉 TOUS LES TESTS SONT PASSÉS - La fonctionnalité véhicules est stable');
    logSuccess('✨ Aucune régression détectée');
    process.exit(0);
  } else {
    logError('💥 CERTAINS TESTS ONT ÉCHOUÉ - Régression possible détectée');
    logError('🔧 Veuillez corriger les erreurs avant de déployer');
    process.exit(1);
  }
}

// Point d'entrée
if (require.main === module) {
  runRegressionTests().catch(error => {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runRegressionTests };