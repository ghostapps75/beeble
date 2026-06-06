import Phaser from 'phaser';

export default class Bug extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bug_enemy_up');

        this.setDisplaySize(100, 100); 
        // Phaser automatically scales the physics body when setDisplaySize is used!

        // Simple animation toggling between two images
        this.flapTimer = scene.time.addEvent({
            delay: 175,
            callback: () => {
                this.setTexture(this.texture.key === 'bug_enemy_up' ? 'bug_enemy_down' : 'bug_enemy_up');
            },
            loop: true
        });

        scene.add.existing(this);
        scene.physics.add.existing(this);
        scene.enemies.add(this);


        this.body.setAllowGravity(false);
        this.body.setImmovable(true);

        // Simple movement: Tween between targets or patrol
        this.patrolDistance = 450; // Vastly wider patrol
        this.startX = x;
        this.setFlipX(false);

        this.patrolTween = scene.tweens.add({
            targets: this,
            x: x + this.patrolDistance,
            duration: 4000, // Adjusted for the wider sweep
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onYoyo: () => { this.setFlipX(true); },
            onRepeat: () => { this.setFlipX(false); }
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // Ensure body follows the game object position for collisions
        this.body.x = this.x - this.body.width / 2;
        this.body.y = this.y - this.body.height / 2;
    }

    destroyEnemy() {
        if (this.scene) {
            // Explosion particles
            const boom = this.scene.add.particles(0, 0, 'player_tex', {
                x: this.x,
                y: this.y,
                speed: { min: 100, max: 400 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.1, end: 0 },
                alpha: { start: 1, end: 0 },
                blendMode: 'ADD',
                lifespan: 600,
                quantity: 15
            });
            if (boom.preFX) boom.preFX.addBloom(0x00ff00, 1, 1, 2, 1.2);
            boom.explode(15);
            this.scene.time.delayedCall(600, () => boom.destroy());
        }
        if (this.flapTimer) this.flapTimer.destroy();
        this.patrolTween.stop();
        this.destroy();
    }
}
