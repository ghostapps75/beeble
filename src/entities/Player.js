import Phaser from 'phaser';
import Laser from './Laser.js';
import { Soundscape } from '../audio/Soundscape.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        // Scale down the high-res 1254x1254 image
        this.setScale(0.18); 

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setDepth(100);

        // Physics properties - No Rotation!
        this.setCollideWorldBounds(true);
        this.setBounce(0.3); 
        // --- DIALED-IN ARCADE PHYSICS ---
        this.setDrag(120, 0);          // Zero vertical drag so you fall smoothly
        this.body.setGravityY(500);    // Much lighter, floaty gravity
        this.setMaxVelocity(400, 600); // Prevents you from ever sinking too fast
        
        // Tightened hitbox (1254x1254 is overall size)
        this.body.setSize(this.width * 0.6, this.height * 0.6);
        this.body.setOffset(this.width * 0.2, this.height * 0.2);

        // Movement variables
        this.thrustForce = 1100;       // Strong enough to catch yourself quickly
        this.horizontalAcceleration = 1200; // Equalized with thrust

        // Game State properties
        this.maxFuel = 4000;
        this.fuel = this.maxFuel;
        this.isDead = false;
        this.lastShotTime = 0;
        this.fireCooldown = 300;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,S,D,SPACE');
        
        // Exhaust Sparks
        this.sparks = scene.add.particles(0, 0, 'player_tex', {
            speed: { min: 100, max: 200 },
            angle: { min: 45, max: 135 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 400,
            emitting: false
        });
    }

    update(time, delta) {
        if (this.isDead) {
            Soundscape.setThrusting(false);
            return;
        }

        let isThrusting = false;
        let drainRate = 2; // Base idle drain
        const mobile = this.scene.mobileInput || {};

        // --- Horizontal Movement & Orientation ---
        if (this.cursors.left.isDown || this.keys.A.isDown || mobile.left) {
            this.setAccelerationX(-this.horizontalAcceleration);
            this.setFlipX(true);
            isThrusting = true;
            drainRate += 5; // Cumulative drain for horizontal
        } else if (this.cursors.right.isDown || this.keys.D.isDown || mobile.right) {
            this.setAccelerationX(this.horizontalAcceleration);
            this.setFlipX(false);
            isThrusting = true;
            drainRate += 5; // Cumulative drain for horizontal
        } else {
            this.setAccelerationX(0);
        }

        // --- Vertical Thrust ---
        if (this.cursors.up.isDown || this.keys.W.isDown || mobile.up) {
            this.setAccelerationY(-this.thrustForce);
            isThrusting = true;
            drainRate += 10; // Cumulative drain for vertical
        } else {
            this.setAccelerationY(0);
        }

        // --- Unified Sensory Feedback (Audio & Particles) ---
        Soundscape.setThrusting(isThrusting);
        if (isThrusting) {
            // Emit sparks based on thrusting state
            // Offset spark position based on flipX
            const sparkX = this.x + (this.flipX ? 35 : -35);
            const sparkY = this.y;
            this.sparks.emitParticleAt(sparkX, sparkY, 1);
        }

        // --- Fuel Management ---
        this.fuel -= (drainRate * delta) / 1000;
        if (this.fuel <= 0) {
            this.fuel = 0;
            if (this.scene.handlePlayerDeath) {
                this.scene.handlePlayerDeath('out_of_fuel');
            }
        }

        // --- Shooting ---
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || mobile.fire) {
            this.fireLaser(time);
        }
    }

    fireLaser(time) {
        if (this.isDead || time < this.lastShotTime + this.fireCooldown) return;
        this.lastShotTime = time;

        this.scene.cameras.main.shake(100, 0.005);

        // Shoot straight ahead (0 degrees if Right, 180 if Left)
        const angle = this.flipX ? Math.PI : 0;
        const spawnX = this.x + (this.flipX ? -75 : 75);
        const spawnY = this.y + 10;

        new Laser(this.scene, spawnX, spawnY, angle);
        Soundscape.playLaser();
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        Soundscape.setThrusting(false);
        this.setAcceleration(0, 0);
        this.setVelocity(0, 0);
        this.body.enable = false;
        this.setVisible(false);
        
        if (this.scene.particles) {
            this.scene.particles.emitParticleAt(this.x, this.y, 40);
        }
    }

    respawn(x, y) {
        this.isDead = false;
        this.fuel = this.maxFuel;
        this.setPosition(x, y);
        this.body.enable = true;
        this.setVisible(true);
        this.setVelocity(0, 0);
        this.setAcceleration(0, 0);
        this.setFlipX(false);
    }
}
