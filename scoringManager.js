/**
 * ScoringManager - Handles score tracking, high score persistence, and difficulty progression
 */
export class ScoringManager {
  constructor() {
    this.currentScore = 0;
    this.highScore = this.loadHighScore();
    this.baseSpeed = 3.0;
    this.baseGap = 4.0;
    this.currentSpeed = this.baseSpeed;
    this.currentGap = this.baseGap;
  }

  /**
   * Load high score from localStorage
   * @returns {number} - High score
   */
  loadHighScore() {
    const stored = localStorage.getItem('flappyBirdHighScore');
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Save high score to localStorage
   */
  saveHighScore() {
    localStorage.setItem('flappyBirdHighScore', this.highScore.toString());
  }

  /**
   * Increment score and update difficulty
   */
  incrementScore() {
    this.currentScore++;
    this.updateDifficulty();
    
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      this.saveHighScore();
      return true; // New high score
    }
    return false;
  }

  /**
   * Update difficulty based on current score
   * Gradually increases speed and decreases gap size
   */
  updateDifficulty() {
    // Increase speed by 2% every 5 points, max 2x base speed
    const speedMultiplier = Math.min(2.0, 1 + (this.currentScore / 5) * 0.02);
    this.currentSpeed = this.baseSpeed * speedMultiplier;

    // Decrease gap by 5% every 10 points, min 60% of base gap
    const gapMultiplier = Math.max(0.6, 1 - (this.currentScore / 10) * 0.05);
    this.currentGap = this.baseGap * gapMultiplier;
  }

  /**
   * Reset score for new game
   */
  reset() {
    this.currentScore = 0;
    this.currentSpeed = this.baseSpeed;
    this.currentGap = this.baseGap;
  }

  /**
   * Get current score
   * @returns {number}
   */
  getScore() {
    return this.currentScore;
  }

  /**
   * Get high score
   * @returns {number}
   */
  getHighScore() {
    return this.highScore;
  }

  /**
   * Get current game speed
   * @returns {number}
   */
  getSpeed() {
    return this.currentSpeed;
  }

  /**
   * Get current pipe gap size
   * @returns {number}
   */
  getGap() {
    return this.currentGap;
  }
}
