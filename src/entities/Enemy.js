import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, isPatrolling = false) {
        const enemyType = Phaser.Math.Between(1, 3);
        const textureKey = `enemy${enemyType}`;
        
        super(scene, x, y, textureKey);
        
        // Scale high-res sprites down
        this.setScale(0.12);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        scene.enemies.add(this);
        
        if (this.preFX) this.preFX.addBloom(0xff00ff, 1, 1, 2, 1.2);
        
        // Tighten hitbox after physics body is created
        this.setBodySize(this.width * 0.8, this.height * 0.8);

        this.body.setAllowGravity(false);
        this.body.setImmovable(true);

        this.isPatrolling = isPatrolling;

        if (this.isPatrolling) {
            // Simple horizontal patrol tween
            scene.tweens.add({
                targets: this,
                x: x + 100,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    destroyEnemy() {
        if (this.scene) {
            // Flash (existing white sparks)
            if (this.scene.particles) {
                this.scene.particles.emitParticleAt(this.x, this.y, 10);
            }
            // Multi-layered ring blast
            const ring = this.scene.add.particles(0, 0, this.texture.key, {
                x: this.x,
                y: this.y,
                speed: { min: 200, max: 500 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.15, end: 0 },
                alpha: { start: 1, end: 0 },
                blendMode: 'ADD',
                lifespan: 500
            });
            if (ring.preFX) ring.preFX.addBloom(0xff00ff, 1, 1, 2, 1.2);
            ring.explode(15);
            this.scene.time.delayedCall(500, () => ring.destroy());
        }
        this.destroy();
    }
}
