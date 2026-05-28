import Phaser from 'phaser';

export default class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Scrolling Background
        this.bg = this.add.tileSprite(0, 0, width, height, 'bg_nebula').setOrigin(0);

        // 2. Title Text (Massive, crisp, cyan bloom)
        const title = this.add.text(width / 2, height / 3, 'CAPTAIN BEEBLE 26', {
            font: 'bold 120px monospace',
            fill: '#00ffff'
        }).setOrigin(0.5);
        
        if (title.preFX) title.preFX.addBloom(0x00ffff, 1, 1, 2, 1.5);

        // 3. High Score Text (Below title)
        const highScore = localStorage.getItem('captainBeebleHighScore') || 0;
        this.add.text(width / 2, (height / 3) + 120, `HIGH SCORE: ${highScore}`, {
            font: '40px monospace',
            fill: '#ffaa00'
        }).setOrigin(0.5);

        // 4. CTA Text (Pulsing)
        const ctaText = this.add.text(width / 2, height * (2 / 3), 'PRESS [SPACE] OR TAP TO START', {
            font: '50px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: ctaText,
            alpha: { from: 0.3, to: 1.0 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 5. Input Handling
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Play', { levelIndex: 0, score: 0, lives: 3 });
        });
        this.input.once('pointerdown', () => {
            this.scene.start('Play', { levelIndex: 0, score: 0, lives: 3 });
        });
    }

    update() {
        // Scroll the background tile to give the menu motion
        if (this.bg) {
            this.bg.tilePositionX += 0.5;
        }
    }
}
