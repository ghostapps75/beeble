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
        this.load.image('player', '/assets/beeble.PNG');
        this.load.image('bg_nebula', '/assets/bg_nebula.jpg');
        this.load.image('rock1', '/assets/rock_skin_1.PNG');
        this.load.image('rock2', '/assets/rock_skin_2.PNG');
        this.load.image('rock3', '/assets/rock_skin_3.PNG');
        this.load.image('hazard_cube', '/assets/hazard_cube.PNG');
        this.load.image('drone_enemy', '/assets/drone_enemy.PNG');

        this.load.spritesheet('bug_sprites', '/assets/bug_sprite_sheet.PNG', { frameWidth: 970, frameHeight: 490 });
        this.load.spritesheet('items', '/assets/items.PNG', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hero_sprites', '/assets/hero_sprites.PNG', { frameWidth: 32, frameHeight: 32 });
        
        this.load.image('crystal', '/assets/crystal.PNG');
        this.load.image('rock_tile', '/assets/rock_sprite.PNG');
        this.load.image('rock_crystal_tile', '/assets/rockcrystal.PNG');
        this.load.image('hazard', '/assets/hazard_block.PNG');
    }

    create() {
        console.log('Preload Sequence Complete. Transitioning to Menu...');
        this.scene.start('Menu');
    }
}
