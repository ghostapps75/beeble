import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        // Display loading progress
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '40px monospace',
                fill: '#00ffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        // Load Assets
        this.load.image('player', 'assets/beeble.PNG');
        this.load.spritesheet('bug_sprites', 'assets/bug_sprite_sheet.PNG', { frameWidth: 970, frameHeight: 490 });
        this.load.spritesheet('items', 'assets/items.PNG', { frameWidth: 256, frameHeight: 256 });
        
        this.load.image('crystal', 'assets/crystal.PNG');
        this.load.image('rock_tile', 'assets/rock_sprite.PNG');
        this.load.image('rock_crystal_tile', 'assets/rockcrystal.PNG');
    }

    create() {
        console.log('Preload Sequence Complete. Transitioning to Menu...');
        this.scene.start('Menu');
    }
}
