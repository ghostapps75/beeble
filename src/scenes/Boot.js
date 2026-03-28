import Phaser from 'phaser';

export default class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create() {
        // Any global init logic goes here
        console.log('Boot Sequence Complete. Transitioning to Preload...');
        this.scene.start('Preload');
    }
}
