// Custom commands for testing

Cypress.Commands.add('login', (email = 'garagiste@vroumvroum.fr', password = 'Azerty@01') => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/signin',
    body: { email, password },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      // Store cookie for subsequent requests
      const cookie = response.headers['set-cookie']?.[0];
      if (cookie) {
        cy.setCookie('token', cookie.split('token=')[1].split(';')[0]);
      }
    }
  });
});

Cypress.Commands.add('logout', () => {
  cy.clearCookies();
  cy.visit('/');
});

// Command for testing performance
Cypress.Commands.add('measurePerformance', (name) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
    return cy.wrap(null).then(() => {
      win.performance.mark(`${name}-end`);
      win.performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = win.performance.getEntriesByName(name)[0];
      cy.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
      expect(measure.duration).to.be.lessThan(3000); // Should be under 3 seconds
    });
  });
});