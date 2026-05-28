import Phaser from 'phaser';

export default class Bug extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bug_sprites', 0);
        
        // Scale high-res bug (~970px wide) down to a manageable size (~80px)
        this.setScale(0.08);
        
        // Define Animations if needed
        if (!scene.anims.exists('bug_wiggle')) {
            scene.anims.create({
                key: 'bug_wiggle',
                frames: scene.anims.generateFrameNumbers('bug_sprites', { start: 0, end: 2 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        this.play('bug_wiggle');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        scene.enemies.add(this);
        
        // Tighten hitbox
        this.setBodySize(800, 400);
        this.setOffset(80, 40);

        this.body.setAllowGravity(false);
        this.body.setImmovable(true);

        // Simple movement: Tween between targets or patrol
        this.patrolDistance = 300;
        this.startX = x;
        this.setFlipX(false);

        this.patrolTween = scene.tweens.add({
            targets: this,
            x: x + this.patrolDistance,
            duration: 3000,
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
        this.patrolTween.stop();
        this.destroy();
    }
}
