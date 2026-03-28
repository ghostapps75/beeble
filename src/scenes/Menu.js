import Phaser from 'phaser';

export default class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#050510');

        // Title
        const title = this.add.text(width / 2, height / 2 - 150, 'CAPTAIN BEEBLE 26', {
            font: '100px "Courier New", monospace',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        if (title.preFX) title.preFX.addBloom(0x00ffff, 1, 1, 2, 1.5);

        // High Score
        const highScore = localStorage.getItem('captainBeebleHighScore') || 0;
        const scoreText = this.add.text(width / 2, height / 2, `HIGH SCORE: ${highScore}`, {
            font: '32px "Courier New", monospace',
            fill: '#ff0055',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        if (scoreText.preFX) scoreText.preFX.addBloom(0xff0055, 1, 1, 2, 1.2);

        // Start Prompt
        const startText = this.add.text(width / 2, height / 2 + 150, 'PRESS [SPACE] TO START MISSION', {
            font: '28px "Courier New", monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Blinking literal
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            ease: 'Linear',
            yoyo: true,
            repeat: -1
        });

        // Input
        // Reset camera fade just in case
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Play', { levelIndex: 0, score: 0, lives: 3 });
            });
        });
    }
}
