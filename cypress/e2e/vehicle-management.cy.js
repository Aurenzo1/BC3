describe('Vehicle Management E2E Tests', () => {
  beforeEach(() => {
    // Se connecter avant chaque test
    cy.visit('/');
    cy.get('input[name="email"]').type('garagiste@vroumvroum.fr');
    cy.get('input[name="password"]').type('Azerty@01');
    cy.get('button[type="submit"]').click();
    
    // Vérifier la redirection vers le dashboard
    cy.url().should('include', '/dashboard');
    
    // Aller à la gestion des véhicules
    cy.contains('Gestion des véhicules').click();
  });

  it('Should display vehicle list', () => {
    cy.contains('Gestion des Véhicules').should('be.visible');
    cy.get('.vehicle-table').should('exist');
  });

  it('Should add a new vehicle', () => {
    cy.contains('Ajouter un véhicule').click();
    
    // Remplir le formulaire
    cy.get('input[name="marque"]').type('Peugeot');
    cy.get('input[name="modele"]').type('208');
    cy.get('input[name="annee"]').type('2023');
    cy.get('input[name="name"]').type('AB-123-CD');
    cy.get('select[name="type"]').select('Citadine');
    
    // Soumettre
    cy.get('button[type="submit"]').click();
    
    // Vérifier la confirmation
    cy.contains('Véhicule ajouté avec succès').should('be.visible');
    
    // Vérifier que le véhicule apparaît dans la liste
    cy.contains('AB-123-CD').should('be.visible');
    cy.contains('Peugeot').should('be.visible');
    cy.contains('208').should('be.visible');
  });

  it('Should edit a vehicle', () => {
    // Cliquer sur modifier pour le premier véhicule
    cy.get('.btn-edit').first().click();
    
    // Modifier les informations
    cy.get('input[name="modele"]').clear().type('308 GTI');
    cy.get('input[name="annee"]').clear().type('2024');
    
    // Soumettre
    cy.get('button[type="submit"]').click();
    
    // Vérifier la confirmation
    cy.contains('Véhicule modifié avec succès').should('be.visible');
    
    // Vérifier les changements
    cy.contains('308 GTI').should('be.visible');
    cy.contains('2024').should('be.visible');
  });

  it('Should delete a vehicle with confirmation', () => {
    // Compter le nombre de véhicules avant suppression
    cy.get('.vehicle-table tbody tr').then($rows => {
      const initialCount = $rows.length;
      
      // Cliquer sur supprimer
      cy.get('.btn-delete').first().click();
      
      // Confirmer la suppression dans la boîte de dialogue
      cy.on('window:confirm', () => true);
      
      // Vérifier la confirmation
      cy.contains('Véhicule supprimé avec succès').should('be.visible');
      
      // Vérifier que le nombre de véhicules a diminué
      cy.get('.vehicle-table tbody tr').should('have.length', initialCount - 1);
    });
  });

  it('Should validate form fields', () => {
    cy.contains('Ajouter un véhicule').click();
    
    // Essayer de soumettre un formulaire vide
    cy.get('button[type="submit"]').click();
    
    // Vérifier les messages d'erreur de validation HTML5
    cy.get('input[name="marque"]:invalid').should('exist');
    cy.get('input[name="modele"]:invalid').should('exist');
    cy.get('input[name="annee"]:invalid').should('exist');
    cy.get('input[name="name"]:invalid').should('exist');
  });

  it('Should validate license plate format', () => {
    cy.contains('Ajouter un véhicule').click();
    
    // Remplir avec une plaque invalide
    cy.get('input[name="marque"]').type('Test');
    cy.get('input[name="modele"]').type('Test');
    cy.get('input[name="annee"]').type('2023');
    cy.get('input[name="name"]').type('INVALID-PLATE');
    
    cy.get('button[type="submit"]').click();
    
    // La validation HTML5 devrait empêcher la soumission
    cy.get('input[name="name"]:invalid').should('exist');
  });

  it('Should be accessible via keyboard navigation', () => {
    // Tester la navigation au clavier
    cy.get('body').tab();
    cy.focused().should('contain', 'Ajouter un véhicule');
    
    // Ouvrir le modal avec Entrée
    cy.focused().type('{enter}');
    cy.get('.modal').should('be.visible');
    
    // Naviguer dans le formulaire
    cy.get('input[name="marque"]').focus().should('be.focused');
    cy.focused().tab();
    cy.focused().should('have.attr', 'name', 'modele');
  });

  it('Should work on mobile viewport', () => {
    // Changer la taille de l'écran pour mobile
    cy.viewport(375, 667);
    
    // Vérifier que l'interface s'adapte
    cy.get('.vehicle-manager').should('be.visible');
    cy.contains('Ajouter un véhicule').should('be.visible');
    
    // Tester l'ajout sur mobile
    cy.contains('Ajouter un véhicule').click();
    cy.get('.modal').should('be.visible');
    
    // Le formulaire devrait être responsive
    cy.get('.vehicle-form').should('be.visible');
    cy.get('input[name="marque"]').should('be.visible');
  });
});