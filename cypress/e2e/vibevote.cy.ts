describe('Presentation', () => {
  it('Should login with Spotify, create a playlist, add some tracks, upvote and play a track.', () => {
    cy.viewport('macbook-16');
    cy.visit('http://localhost:4200/');
    cy.get('button').contains('Login with Spotify').click();
    cy.origin('https://accounts.spotify.com', () => {
      cy.get('[data-testid="login-username"]').type('idarnigatu@gmail.com');
      cy.get('[data-testid="login-password"]').type('presentationTesting123');
      cy.get('[data-testid="login-button"]').click();
    });
    cy.get('input[placeholder="Party name"] ').type('Presentation');
    cy.get('button').contains('Create Party').click();
    cy.get('button').contains('Add track').click();
    cy.get('input[placeholder="Search track"]').type('shadow of the sun');
    cy.contains('div', 'Max Elto').click();
    cy.get('button').contains('Add track').click();
    cy.get('input[placeholder="Search track"]').type('one');
    cy.contains('div', 'Metallica').click();
    cy.get('button').contains('Add track').click();
    cy.get('input[placeholder="Search track"]').type('all i want');
    cy.contains('div', 'Kodaline').click();
    cy.get('button').contains('Add track').click();
    cy.get('input[placeholder="Search track"]').type('friday');
    cy.contains('div', 'Rebecca').click();
    cy.wait(3000);
    cy.get('div.flex.items-center.justify-between.p-2')
      .contains('Rebecca Black')
      .parent()
      .parent()
      .parent()
      .find('button')
      .click();
  });
});
