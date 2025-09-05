// Cypress support file

// Import commands.js using ES2015 syntax:
import './commands'

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Custom commands for accessibility testing
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('img').each(($img) => {
    if (!$img.attr('alt') && !$img.attr('aria-label')) {
      throw new Error(`Image missing alt text: ${$img[0].outerHTML}`);
    }
  });

  // Check for proper heading hierarchy
  cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
    let previousLevel = 0;
    $headings.each((index, heading) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      if (currentLevel > previousLevel + 1) {
        throw new Error(`Heading level skip detected: ${heading.outerHTML}`);
      }
      previousLevel = currentLevel;
    });
  });

  // Check for proper form labels
  cy.get('input, textarea, select').each(($input) => {
    const id = $input.attr('id');
    const hasLabel = $input.attr('aria-label') || 
                     $input.attr('placeholder') || 
                     (id && Cypress.$(`label[for="${id}"]`).length > 0);
    
    if (!hasLabel) {
      throw new Error(`Form control missing label: ${$input[0].outerHTML}`);
    }
  });
});

// Custom command for tab navigation
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject, options = {}) => {
  const selector = subject ? null : ':focus';
  return cy
    .get(selector)
    .trigger('keydown', { keyCode: 9, which: 9, ...options });
});