import Phaser from 'phaser';

export default class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background Cover Art
        this.bg = this.add.image(width / 2, height / 2, 'cover_art');
        const scaleX = width / this.bg.width;
        const scaleY = height / this.bg.height;
        this.bg.setScale(Math.max(scaleX, scaleY));

        // 2. High Score Text (Lower right)
        const highScore = localStorage.getItem('captainBeebleHighScore') || 0;
        this.add.text(width - 150, height - 200, `HIGH SCORE: ${highScore}`, {
            font: '30px monospace',
            fill: '#ffaa00'
        }).setOrigin(1, 0.5);

        // 3. CTA Text (Lower right, pulsing)
        const ctaText = this.add.text(width - 150, height - 150, 'PRESS [SPACE] OR TAP TO START', {
            font: '30px monospace',
            fill: '#ffffff'
        }).setOrigin(1, 0.5);

        this.tweens.add({
            targets: ctaText,
            alpha: { from: 0.3, to: 1.0 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 4. Input Handling
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Play', { levelIndex: 0, score: 0, lives: 3 });
        });
        this.input.once('pointerdown', () => {
            this.scene.start('Play', { levelIndex: 0, score: 0, lives: 3 });
        });
        
        // Developer shortcut to start at Level 2
        this.input.keyboard.once('keydown-TWO', () => {
            this.scene.start('Play', { levelIndex: 1, score: 0, lives: 3 });
        });
    }

    update() {
        // No scrolling needed for static cover art
    }
}
