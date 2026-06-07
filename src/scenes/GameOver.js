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

        // 1. Scrolling Background
        this.bg = this.add.tileSprite(0, 0, width, height, 'bg_nebula').setOrigin(0);

        this.cameras.main.fadeIn(500, 0, 0, 0);

        // 2. Dynamic Title
        const titleString = this.win ? 'MISSION ACCOMPLISHED' : 'GAME OVER';
        const titleColor = this.win ? '#00ffaa' : '#ff0000';
        
        const title = this.add.text(width / 2, height / 2 - 200, titleString, {
            font: 'bold 100px monospace',
            fill: titleColor
        }).setOrigin(0.5);
        
        if (title.preFX) title.preFX.addBloom(parseInt(titleColor.replace('#', '0x')), 1, 1, 2, 1.5);

        // 3. Stats Text
        this.add.text(width / 2, height / 2 - 50, `LEVEL REACHED: ${this.levelReached}`, {
            font: '36px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const scoreTxt = this.add.text(width / 2, height / 2 + 20, `FINAL SCORE: ${this.finalScore}`, {
            font: 'bold 50px monospace',
            fill: '#00ffff'
        }).setOrigin(0.5);
        if (scoreTxt.preFX) scoreTxt.preFX.addBloom(0x00ffff, 1, 1, 1, 1);

        // 4. High Score Alert
        const savedHighScore = parseInt(localStorage.getItem('captainBeebleHighScore')) || 0;
        let isNewHigh = false;

        if (this.finalScore > savedHighScore) {
            localStorage.setItem('captainBeebleHighScore', this.finalScore);
            isNewHigh = true;
        }

        if (isNewHigh) {
            const newHighText = this.add.text(width / 2, height / 2 + 120, 'NEW HIGH SCORE!', {
                font: 'bold 80px monospace',
                fill: '#ffaa00'
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

        // 5. CTA Text
        const restartText = this.add.text(width / 2, height / 2 + 250, 'PRESS [SPACE] OR TAP FOR MAIN MENU', {
            font: '40px monospace',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setInteractive();

        this.tweens.add({
            targets: restartText,
            alpha: { from: 0.3, to: 1.0 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Menu');
            });
        });
        
        restartText.once('pointerdown', () => {
            if (this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
                if (!this.scale.isFullscreen) {
                    this.scale.startFullscreen();
                }
            }
            this.cameras.main.fade(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Menu');
            });
        });
    }

    update() {
        if (this.bg) {
            this.bg.tilePositionX += 0.5;
        }
    }
}
