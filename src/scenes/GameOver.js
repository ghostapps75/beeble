import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.levelReached = data.levelReached || 'Unknown';
        this.win = data.win || false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#050510');
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Title
        const titleString = this.win ? 'MISSION ACCOMPLISHED' : 'GAME OVER';
        const titleColor = this.win ? '#00ffaa' : '#ff0000';
        
        const title = this.add.text(width / 2, height / 2 - 200, titleString, {
            font: '80px "Courier New", monospace',
            fill: titleColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        if (title.preFX) title.preFX.addBloom(parseInt(titleColor.replace('#', '0x')), 1, 1, 2, 1.5);

        // Stats
        this.add.text(width / 2, height / 2 - 50, `LEVEL REACHED: ${this.levelReached}`, {
            font: '24px "Courier New", monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const scoreTxt = this.add.text(width / 2, height / 2 + 20, `FINAL SCORE: ${this.finalScore}`, {
            font: '32px "Courier New", monospace',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        if (scoreTxt.preFX) scoreTxt.preFX.addBloom(0x00ffff, 1, 1, 1, 1);

        // Check High Score
        const savedHighScore = parseInt(localStorage.getItem('captainBeebleHighScore')) || 0;
        let isNewHigh = false;

        if (this.finalScore > savedHighScore) {
            localStorage.setItem('captainBeebleHighScore', this.finalScore);
            isNewHigh = true;
        }

        if (isNewHigh) {
            const newHighText = this.add.text(width / 2, height / 2 + 120, 'NEW HIGH SCORE!', {
                font: '60px Arial',
                fill: '#ffaa00',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            if (newHighText.preFX) newHighText.preFX.addBloom(0xffaa00, 1, 1, 2, 1.2);
            
            this.tweens.add({
                targets: newHighText,
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Restart Prompt
        const restartText = this.add.text(width / 2, height / 2 + 250, 'PRESS [SPACE] FOR MAIN MENU', {
            font: '24px "Courier New", monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Menu');
            });
        });
    }
}
