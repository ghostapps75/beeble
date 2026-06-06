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
        this.load.image('bg_nebula', '/assets/bg_nebula.jpg');
        this.load.image('cover_art', '/assets/cover_art.jpg');
        this.load.image('player', '/assets/player.png');
        this.load.image('rock_tile', '/assets/rock_tile.png');
        this.load.image('rock_tile2', '/assets/rock_tile2.png');
        this.load.image('rock_crystal_tile', '/assets/rock_crystal_tile.png');
        this.load.image('hazard_cube', '/assets/hazard_cube.png');
        this.load.image('hazard_block', '/assets/hazard_block.png');
        this.load.image('cpu_block', '/assets/cpu-sprite-transparent.png');
        this.load.image('drone_enemy', '/assets/drone_enemy.png');
        this.load.image('bug_enemy_up', '/assets/bug_enemy_up.png');
        this.load.image('bug_enemy_down', '/assets/bug_enemy_down.png');

        this.load.image('life_icon', '/assets/life_icon.png');
        this.load.image('fuel_icon', '/assets/fuel_icon.png');
        this.load.image('gem_icon', '/assets/gem_icon.png');
        this.load.image('crystal', '/assets/crystal.png');
        this.load.image('cloud_hazard', '/assets/cloud_hazasrd.PNG');
    }

    create() {
        console.log('Preload Sequence Complete. Transitioning to Menu...');
        this.scene.start('Menu');
    }
}
