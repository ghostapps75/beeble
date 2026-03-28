import Phaser from 'phaser';

export default class Laser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, rotation) {
        // Create simple laser texture if it doesn't exist
        if (!scene.textures.exists('laser_tex')) {
            const graphics = scene.add.graphics();
            graphics.fillStyle(0xff8800, 1);
            graphics.fillRect(0, 0, 20, 6);
            graphics.generateTexture('laser_tex', 20, 6);
            graphics.destroy();
        }

        super(scene, x, y, 'laser_tex');
        if (this.preFX) this.preFX.addBloom(0xff4400, 1, 1, 3, 1.2);

        scene.add.existing(this);
        scene.lasers.add(this);

        // Core visual/physics
        this.setRotation(rotation);
        
        // Use a high speed
        const speed = 1200;
        this.body.setVelocity(
            Math.cos(rotation) * speed,
            Math.sin(rotation) * speed
        );
        
        this.body.setAllowGravity(false);
        this.body.collideWorldBounds = false; // Destroy if leaves world or hits wall

        // Visual FX over time
        this.scene.time.delayedCall(2000, () => {
            if (this.active) this.destroy();
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // Destroy if hitting walls (handled via collider in Play.js normally)
        if (this.x < 0 || this.x > this.scene.physics.world.bounds.width ||
            this.y < 0 || this.y > this.scene.physics.world.bounds.height) {
            this.destroy();
        }
    }
}
