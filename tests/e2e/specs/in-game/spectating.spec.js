import { playerOne, playerTwo } from '../../fixtures/userFixtures';
import {
  username as playerUsername,
  validPassword as playerPassword,
  Card,
  assertGameState,
  assertSnackbarError,
  SnackBarError,
} from '../../support/helpers';
import { assertLoss } from './gameOver.spec';

function setup() {
  cy.wipeDatabase();
  cy.visit('/');
  cy.signupPlayer(playerUsername, playerPassword);
  cy.vueRoute('/');
}

describe('Spectating Games', () => {
  beforeEach(setup);

  it('Spectates a game', () => {
    cy.setupGameAsSpectator();
    cy.loadGameFixture({
      p0Hand: [Card.ACE_OF_SPADES, Card.ACE_OF_CLUBS],
      p0Points: [Card.TEN_OF_SPADES],
      p0FaceCards: [Card.KING_OF_SPADES],
      p1Hand: [Card.ACE_OF_HEARTS, Card.ACE_OF_DIAMONDS, Card.EIGHT_OF_DIAMONDS],
      p1Points: [Card.TEN_OF_HEARTS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    });

    assertGameState(0, {
      p0Hand: [Card.ACE_OF_SPADES, Card.ACE_OF_CLUBS],
      p0Points: [Card.TEN_OF_SPADES],
      p0FaceCards: [Card.KING_OF_SPADES],
      p1Hand: [Card.ACE_OF_HEARTS, Card.ACE_OF_DIAMONDS, Card.EIGHT_OF_DIAMONDS],
      p1Points: [Card.TEN_OF_HEARTS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    }, true);

    // P0 plays ace of spades
    cy.recoverSessionOpponent(playerOne);
    cy.playPointsSpectator(Card.ACE_OF_SPADES, 0);

    assertGameState(0, {
      p0Hand: [Card.ACE_OF_CLUBS],
      p0Points: [Card.TEN_OF_SPADES, Card.ACE_OF_SPADES],
      p0FaceCards: [Card.KING_OF_SPADES],
      p1Hand: [Card.ACE_OF_HEARTS, Card.ACE_OF_DIAMONDS, Card.EIGHT_OF_DIAMONDS],
      p1Points: [Card.TEN_OF_HEARTS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    }, true);

    // Refresh the page
    cy.reload();
    // Game state appears unchanged
    assertGameState(0, {
      p0Hand: [Card.ACE_OF_CLUBS],
      p0Points: [Card.TEN_OF_SPADES, Card.ACE_OF_SPADES],
      p0FaceCards: [Card.KING_OF_SPADES],
      p1Hand: [Card.ACE_OF_HEARTS, Card.ACE_OF_DIAMONDS, Card.EIGHT_OF_DIAMONDS],
      p1Points: [Card.TEN_OF_HEARTS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    }, true);

    // P1 plays Ace of hearts -- UI updates accordingly
    cy.recoverSessionOpponent(playerTwo);
    cy.playPointsSpectator(Card.ACE_OF_HEARTS, 1);

    assertGameState(0, {
      p0Hand: [Card.ACE_OF_CLUBS],
      p0Points: [Card.TEN_OF_SPADES, Card.ACE_OF_SPADES],
      p0FaceCards: [Card.KING_OF_SPADES],
      p1Hand: [Card.ACE_OF_DIAMONDS, Card.EIGHT_OF_DIAMONDS],
      p1Points: [Card.TEN_OF_HEARTS, Card.ACE_OF_HEARTS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    }, true);

    // Disconnect spectator's socket
    cy.window().its('cuttle.app.config.globalProperties.$store').invoke('dispatch', 'disconnectSocket');
  
    // P0 plays ace of clubs
    cy.recoverSessionOpponent(playerOne);
    cy.playPointsSpectator(Card.ACE_OF_CLUBS, 0);

    // Reconnect the socket
    cy.window().its('cuttle.app.config.globalProperties.$store').invoke('dispatch', 'reconnectSocket');

    // Spectator receives the update
    assertGameState(0, {
      p0Hand: [],
      p0Points: [Card.TEN_OF_SPADES, Card.ACE_OF_SPADES, Card.ACE_OF_CLUBS],
      p0FaceCards: [Card.KING_OF_SPADES],
      p1Hand: [Card.ACE_OF_DIAMONDS, Card.EIGHT_OF_DIAMONDS],
      p1Points: [Card.TEN_OF_HEARTS, Card.ACE_OF_HEARTS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    }, true);

    // P1 plays the Eight of Diamonds and wins
    cy.recoverSessionOpponent(playerTwo);
    cy.playPointsSpectator(Card.EIGHT_OF_DIAMONDS, 1);

    assertLoss();
    cy.get('[data-cy=gameover-go-home]').click();
    cy.url().should('not.include', '/game');
  });

  it('Prevents spectator from making moves', () => {
    cy.setupGameAsSpectator();
    cy.loadGameFixture({
      p0Hand: [
        Card.ACE_OF_SPADES,
        Card.ACE_OF_HEARTS,
        Card.TWO_OF_DIAMONDS,
        Card.KING_OF_CLUBS,
        Card.JACK_OF_DIAMONDS,
        Card.THREE_OF_CLUBS
      ],
      p0Points: [],
      p0FaceCards: [],
      p1Hand: [Card.FOUR_OF_CLUBS, Card.ACE_OF_DIAMONDS],
      p1Points: [Card.ACE_OF_CLUBS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    });

    assertGameState(0, {
      p0Hand: [
        Card.ACE_OF_SPADES,
        Card.ACE_OF_HEARTS,
        Card.TWO_OF_DIAMONDS,
        Card.THREE_OF_CLUBS,
        Card.JACK_OF_DIAMONDS,
        Card.KING_OF_CLUBS,
      ],
      p0Points: [],
      p0FaceCards: [],
      p1Hand: [Card.FOUR_OF_CLUBS, Card.ACE_OF_DIAMONDS],
      p1Points: [Card.ACE_OF_CLUBS],
      p1FaceCards: [Card.KING_OF_HEARTS],
    }, true);
    
    // Can't draw
    cy.get('#deck').click()
    assertSnackbarError(SnackBarError.NOT_IN_GAME);
    cy.log('Correctly prevented from drawing from deck');

    // Can't play points
    cy.get('[data-player-hand-card=1-3]').click();
    cy.get('[data-move-choice=points]').click();
    assertSnackbarError(SnackBarError.NOT_IN_GAME);
    cy.log('Correctly prevented from playing points');

    // Can't scuttle
    cy.get('[data-player-hand-card=1-3]').click();
    cy.get('[data-move-choice=scuttle]').click();
    cy.get('[data-opponent-point-card=1-0]').click();
    assertSnackbarError(SnackBarError.NOT_IN_GAME);
    cy.log('Correctly prevented from scuttling');

    // Can't play royal
    cy.get('[data-player-hand-card=13-0]').click();
    cy.get('[data-move-choice=faceCard]').click();
    assertSnackbarError(SnackBarError.NOT_IN_GAME);
    cy.log('Correctly prevented from playing royal');

    // Can't play jack
    cy.get('[data-player-hand-card=11-1]').click();
    cy.get('[data-move-choice=jack]').click();
    cy.get('[data-opponent-point-card=1-0]').click();
    assertSnackbarError(SnackBarError.NOT_IN_GAME);
    cy.log('Correctly prevented from playing jack');

    // Can't play oneOff
    cy.get('[data-player-hand-card=1-3]').click();
    cy.get('[data-move-choice=oneOff]').click();
    assertSnackbarError(SnackBarError.NOT_IN_GAME);
    cy.log('Correctly prevented from untargeted one-off');

    // Can't play targeted oneOff
    cy.get('[data-player-hand-card=2-1]').click();
    cy.get('[data-move-choice=targetedOneOff]').click();
    cy.get('[data-opponent-face-card=13-2]').click();
    assertSnackbarError(SnackBarError.NOT_IN_GAME);
    cy.log('Correctly prevented from targeted one-off');

    // Can't resolve three
    // Can't resolve four
    // Can't resolve seven
    // Can't counter
    // Can't resolve
  });
});