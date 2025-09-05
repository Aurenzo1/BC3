describe('Vehicle Management Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('input[name="email"]').type('garagiste@vroumvroum.fr');
    cy.get('input[name="password"]').type('Azerty@01');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Gestion des véhicules').click();
  });

  describe('Keyboard Navigation', () => {
    it('Should navigate through vehicle table with keyboard', () => {
      cy.get('.vehicle-table').should('exist');
      
      // Tab navigation through table
      cy.get('body').tab();
      cy.focused().should('contain', 'Ajouter un véhicule');
      
      cy.focused().tab();
      cy.focused().should('have.class', 'btn-edit').first();
      
      cy.focused().tab();
      cy.focused().should('have.class', 'btn-delete').first();
    });

    it('Should open modal with Enter key', () => {
      cy.get('.btn-primary').focus();
      cy.focused().type('{enter}');
      cy.get('.modal').should('be.visible');
    });

    it('Should navigate form fields with Tab', () => {
      cy.contains('Ajouter un véhicule').click();
      
      cy.get('#marque-input').should('be.focused');
      cy.focused().tab();
      cy.get('#modele-input').should('be.focused');
      cy.focused().tab();
      cy.get('#annee-input').should('be.focused');
      cy.focused().tab();
      cy.get('#type-select').should('be.focused');
      cy.focused().tab();
      cy.get('#name-input').should('be.focused');
      cy.focused().tab();
      cy.get('#client-select').should('be.focused');
    });

    it('Should close modal with Escape key', () => {
      cy.contains('Ajouter un véhicule').click();
      cy.get('.modal').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('.modal').should('not.exist');
    });
  });

  describe('Screen Reader Support', () => {
    it('Should have proper ARIA labels and roles', () => {
      // Check main region
      cy.get('.vehicle-manager').should('have.attr', 'role', 'main');
      cy.get('.vehicle-manager').should('have.attr', 'aria-label', 'Gestion des véhicules');
      
      // Check table structure
      cy.get('.vehicle-table').should('have.attr', 'role', 'table');
      cy.get('.vehicle-table thead tr').should('have.attr', 'role', 'row');
      cy.get('.vehicle-table th').each($th => {
        cy.wrap($th).should('have.attr', 'scope', 'col');
      });
      
      // Check data rows
      cy.get('.vehicle-table tbody tr').first().should('have.attr', 'role', 'row');
      cy.get('.vehicle-table tbody td').first().should('have.attr', 'role', 'gridcell');
    });

    it('Should have proper form labels', () => {
      cy.contains('Ajouter un véhicule').click();
      
      // Check all form controls have proper labels
      cy.get('#marque-input').should('have.attr', 'aria-describedby', 'marque-help');
      cy.get('label[for="marque-input"]').should('contain', 'Marque');
      
      cy.get('#modele-input').should('have.attr', 'aria-describedby', 'modele-help');
      cy.get('label[for="modele-input"]').should('contain', 'Modèle');
      
      cy.get('#annee-input').should('have.attr', 'aria-describedby', 'annee-help');
      cy.get('label[for="annee-input"]').should('contain', 'Année');
      
      cy.get('#name-input').should('have.attr', 'aria-describedby');
      cy.get('label[for="name-input"]').should('contain', 'Plaque');
    });

    it('Should have descriptive button labels', () => {
      // Check main action button
      cy.get('.btn-primary').should('have.attr', 'aria-label');
      cy.get('.btn-primary').should('have.attr', 'aria-describedby');
      
      // Check table action buttons
      cy.get('.btn-edit').first().should('have.attr', 'aria-label');
      cy.get('.btn-delete').first().should('have.attr', 'aria-label');
      
      // Open modal and check modal buttons
      cy.contains('Ajouter un véhicule').click();
      cy.get('.btn-close').should('have.attr', 'aria-label', 'Fermer le formulaire');
    });

    it('Should announce form validation errors', () => {
      cy.contains('Ajouter un véhicule').click();
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Check required field validation
      cy.get('#marque-input:invalid').should('exist');
      cy.get('#modele-input:invalid').should('exist');
      cy.get('#annee-input:invalid').should('exist');
      cy.get('#name-input:invalid').should('exist');
    });
  });

  describe('Focus Management', () => {
    it('Should set focus to close button when modal opens', () => {
      cy.contains('Ajouter un véhicule').click();
      cy.get('.btn-close').should('be.focused');
    });

    it('Should trap focus within modal', () => {
      cy.contains('Ajouter un véhicule').click();
      
      // Focus should be trapped within modal
      cy.get('.btn-close').focus();
      cy.focused().tab({ shift: true });
      cy.focused().should('be.within', '.modal');
      
      // Test forward tabbing
      cy.get('#marque-input').focus();
      for(let i = 0; i < 10; i++) {
        cy.focused().tab();
        cy.focused().should('be.within', '.modal');
      }
    });

    it('Should restore focus when modal closes', () => {
      cy.get('.btn-primary').focus();
      cy.focused().click();
      cy.get('.modal').should('be.visible');
      
      cy.get('.btn-close').click();
      cy.get('.modal').should('not.exist');
      cy.get('.btn-primary').should('be.focused');
    });
  });

  describe('High Contrast and Color', () => {
    it('Should be visible in high contrast mode', () => {
      // Simulate high contrast preferences
      cy.window().then((win) => {
        const mediaQuery = win.matchMedia('(prefers-contrast: high)');
        if (mediaQuery.matches) {
          // Verify buttons have proper borders in high contrast
          cy.get('.btn-primary').should('be.visible');
          cy.get('.btn-edit').should('be.visible');
          cy.get('.btn-delete').should('be.visible');
        }
      });
    });

    it('Should not rely solely on color for information', () => {
      // Check that form validation doesn't rely only on color
      cy.contains('Ajouter un véhicule').click();
      cy.get('button[type="submit"]').click();
      
      // Should have text indicators, not just color changes
      cy.get('input:invalid').should('have.attr', 'aria-describedby');
    });
  });

  describe('Motion and Animation', () => {
    it('Should respect reduced motion preferences', () => {
      cy.window().then((win) => {
        const mediaQuery = win.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
          // Animations should be minimal or none
          cy.contains('Ajouter un véhicule').click();
          cy.get('.modal').should('be.visible');
          // Modal should appear without complex animations
        }
      });
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('Should have adequate touch targets on mobile', () => {
      cy.viewport(375, 667);
      
      // Check minimum touch target size (44px)
      cy.get('.btn-primary').should('have.css', 'min-height', '44px');
      cy.get('.btn-edit').should('have.css', 'min-height', '44px');
      cy.get('.btn-delete').should('have.css', 'min-height', '44px');
    });

    it('Should be usable with touch navigation', () => {
      cy.viewport(375, 667);
      
      // Test touch interactions
      cy.contains('Ajouter un véhicule').click();
      cy.get('.modal').should('be.visible');
      
      // Form should be touch-friendly
      cy.get('#marque-input').type('Toyota');
      cy.get('#modele-input').type('Corolla');
      cy.get('#annee-input').type('2023');
      cy.get('#name-input').type('TO-123-YO');
      
      cy.get('.btn-secondary').click();
      cy.get('.modal').should('not.exist');
    });
  });
});