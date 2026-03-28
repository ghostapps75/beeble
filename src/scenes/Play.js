import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Bug from '../entities/Bug.js';
import { LEVELS } from '../levels.js';
import { Soundscape } from '../audio/Soundscape.js';

export default class Play extends Phaser.Scene {
    constructor() {
        super('Play');
    }

    init(data) {
        this.levelIndex = data.levelIndex || 0;
        this.score = data.score || 0;
        this.lives = data.lives !== undefined ? data.lives : 3;
    }

    create() {
        const levelData = LEVELS[this.levelIndex];
        this.levelData = levelData;
        this.hasCrystal = false;
        this.isGameOver = false;
        this.isDying = false; // New flag for fatal collision freeze
        this.escapeTimeMax = levelData.escapeTime;
        this.escapeTime = this.escapeTimeMax;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // --- Camera & Viewport Setup (Top 80% for Gameplay) ---
        this.physics.world.setBounds(0, 0, levelData.bounds.width, levelData.bounds.height);
        this.cameras.main.setViewport(0, 0, width, height * 0.8);
        this.cameras.main.setBounds(0, 0, levelData.bounds.width, levelData.bounds.height);
        this.cameras.main.setBackgroundColor('#000033'); // Deep space blue
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // --- Groups ---
        this.caveWalls = this.physics.add.staticGroup();
        this.whiteHazards = this.physics.add.staticGroup();
        this.movingHazards = this.physics.add.group();
        this.lasers = this.physics.add.group({ runChildUpdate: true });
        this.enemies = this.physics.add.group({ runChildUpdate: true });

        // --- Building the World ---
        
        // Static Rock Walls (Rigid Grid)
        levelData.walls.forEach(r => {
            const wallSprite = this.add.tileSprite(r.x + r.w/2, r.y + r.h/2, r.w, r.h, 'rock_tile');
            wallSprite.setTileScale(0.3);
            wallSprite.setTint(0x555577);
            
            const wall = this.add.rectangle(r.x + r.w/2, r.y + r.h/2, r.w, r.h, 0x000000, 0);
            this.physics.add.existing(wall, true);
            this.caveWalls.add(wall);
        });

        if (!this.textures.exists('white_hazard_tex')) {
            const g = this.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 32, 32);
            g.generateTexture('white_hazard_tex', 32, 32);
            g.destroy();
        }

        levelData.whiteMaterial.forEach(wh => {
            const hazard = this.add.tileSprite(wh.x + wh.w/2, wh.y + wh.h/2, wh.w, wh.h, 'white_hazard_tex');
            if (hazard.preFX) hazard.preFX.addBloom(0xffffff, 1, 1, 2, 1.5);
            this.physics.add.existing(hazard, true);
            this.whiteHazards.add(hazard);
        });

        levelData.movingHazards.forEach(mh => {
            const hazard = this.add.tileSprite(mh.x + mh.w/2, mh.y + mh.h/2, mh.w, mh.h, 'white_hazard_tex');
            if (hazard.preFX) hazard.preFX.addBloom(0xffffff, 1, 1, 2, 1.5);
            this.physics.add.existing(hazard, false);
            hazard.body.setAllowGravity(false);
            hazard.body.setImmovable(true);
            this.movingHazards.add(hazard);

            const prop = mh.path === 'horizontal' ? 'x' : 'y';
            this.tweens.add({
                targets: hazard,
                [prop]: (mh.path === 'horizontal' ? mh.x : mh.y) + mh.distance,
                duration: mh.speed,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    if (hazard.body) {
                        hazard.body.x = hazard.x - hazard.body.width / 2;
                        hazard.body.y = hazard.y - hazard.body.height / 2;
                    }
                }
            });
        });

        // --- Player & Objects ---
        this.startX = levelData.startPos.x;
        this.startY = levelData.startPos.y;

        this.forcefield = this.add.sprite(this.startX, this.startY + 40, 'items', 32);
        this.forcefield.setScale(0.35);
        this.forcefield.setAlpha(0.6);
        this.physics.add.existing(this.forcefield, true);
        this.forcefield.body.setSize(180, 180).setOffset(38, 38);

        this.crystal = this.physics.add.sprite(levelData.crystalPos.x, levelData.crystalPos.y, 'crystal');
        this.crystal.setScale(0.08); 
        this.crystal.body.setAllowGravity(false).setImmovable(true);

        levelData.enemies.forEach(e => {
            if (e.type === 'bug') new Bug(this, e.x, e.y);
        });

        this.particles = this.add.particles(0, 0, 'player_tex', {
            speed: { min: -200, max: 200 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            emitting: false
        });

        this.player = new Player(this, this.startX, this.startY);

        // --- Collisions ---
        this.physics.add.collider(this.player, this.caveWalls, this.handleWallCollision, null, this);
        this.physics.add.collider(this.player, this.whiteHazards, this.handleHazardCollision, null, this);
        this.physics.add.collider(this.player, this.movingHazards, this.handleHazardCollision, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handleHazardCollision, null, this);
        this.physics.add.collider(this.lasers, this.caveWalls, (laser) => laser.destroy());
        this.physics.add.overlap(this.lasers, this.enemies, this.handleLaserEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.crystal, this.collectCrystal, null, this);
        this.physics.add.overlap(this.player, this.forcefield, this.winLevel, null, this);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // --- 1983 Viewport Dashboard (Fixed Bottom 20%) ---
        this.create1983HUD();
    }

    create1983HUD() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hudH = height * 0.2;
        const hudY = height * 0.8;

        // HUD Layer (Fixed)
        this.hudLayer = this.add.container(0, hudY).setScrollFactor(0).setDepth(1000);
        
        // 3 Bands
        const bandH = hudH / 3;
        
        // Top Band: Blue (Lives, Score)
        const topBand = this.add.rectangle(width/2, bandH/2, width, bandH, 0x0000ff).setOrigin(0.5);
        this.hudLayer.add(topBand);
        
        // Middle Band: Purple (Fuel Icon, Fuel Count)
        const midBand = this.add.rectangle(width/2, bandH * 1.5, width, bandH, 0x800080).setOrigin(0.5);
        this.hudLayer.add(midBand);
        
        // Bottom Band: Red (High Score)
        const botBand = this.add.rectangle(width/2, bandH * 2.5, width, bandH, 0xff0000).setOrigin(0.5);
        this.hudLayer.add(botBand);

        const textStyle = { font: 'bold 36px "Courier New", monospace', fill: '#fff' };

        // Lives
        this.lifeIcon = this.add.sprite(50, bandH/2, 'hero_sprites', 0).setScale(0.06).setFlipX(false);
        this.livesText = this.add.text(90, bandH/2, `LIVES: ${this.lives}`, textStyle).setOrigin(0, 0.5);
        this.hudLayer.add([this.lifeIcon, this.livesText]);
        
        // Score
        this.scoreHUDText = this.add.text(width - 50, bandH/2, `SCORE: ${this.score.toString().padStart(3, '0')}`, textStyle).setOrigin(1, 0.5);
        this.hudLayer.add(this.scoreHUDText);

        // Fuel
        if (!this.textures.exists('fuel_diamond')) {
            const dg = this.add.graphics();
            dg.fillStyle(0x00ffff, 1);
            dg.beginPath();
            dg.moveTo(10, 0); dg.lineTo(20, 10); dg.lineTo(10, 20); dg.lineTo(0, 10); dg.closePath();
            dg.fillPath();
            dg.generateTexture('fuel_diamond', 20, 20);
            dg.destroy();
        }
        this.fuelIcon = this.add.sprite(50, bandH * 1.5, 'fuel_diamond').setOrigin(0, 0.5);
        this.fuelHUDText = this.add.text(90, bandH * 1.5, `FUEL: 000`, textStyle).setOrigin(0, 0.5);
        this.hudLayer.add([this.fuelIcon, this.fuelHUDText]);

        // High Score
        const highScore = localStorage.getItem('captainBeebleHighScore') || 0;
        this.highScoreHUDText = this.add.text(width/2, bandH * 2.5, `HIGH: ${highScore.toString().padStart(3, '0')}`, textStyle).setOrigin(0.5);
        this.hudLayer.add(this.highScoreHUDText);

        // --- Fatal Collision Event Layer ---
        this.fatalText = this.add.text(width/2, height/2 - 50, 'FATAL COLLISION', { 
            font: 'bold 80px "Courier New", monospace', 
            fill: '#ff0000', 
            backgroundColor: '#000000' 
        })
        .setOrigin(0.5).setScrollFactor(0).setDepth(2000).setVisible(false);
    }

    update(time, delta) {
        if (this.isGameOver || this.isDying) return;

        if (this.player && !this.player.isDead) {
            this.player.update(time, delta);
            
            // Update HUD
            this.fuelHUDText.setText(`FUEL: ${Math.floor(this.player.fuel / 5).toString().padStart(3, '0')}`);
            this.scoreHUDText.setText(`SCORE: ${this.score.toString().padStart(3, '0')}`);
        }
    }

    handleWallCollision(player, wall) {
        const speed = player.body.speed || player.body.velocity.length();
        if (speed > 400) {
            this.cameras.main.shake(100, 0.01);
            Soundscape.playBounce(speed);
        }
    }

    handleHazardCollision(player, hazard) {
        if (!player.isDead && !this.isGameOver && !this.isDying) {
            this.handlePlayerDeath('collision');
        }
    }

    handleLaserEnemyCollision(laser, enemy) {
        laser.destroy();
        if (enemy.destroyEnemy) enemy.destroyEnemy();
        else enemy.destroy();
        this.updateScore(10);
    }

    collectCrystal(player, crystal) {
        if (!this.hasCrystal && !player.isDead) {
            this.hasCrystal = true;
            crystal.setVisible(false);
            crystal.body.enable = false;
        }
    }

    winLevel() {
        if (this.hasCrystal && !this.isGameOver && !this.isDying) {
            this.isGameOver = true;
            this.scene.start('GameOver', { score: this.score, levelReached: this.levelData.name, win: true });
        }
    }

    handlePlayerDeath() {
        if (this.isDying || this.isGameOver) return;
        
        this.isDying = true;
        this.player.die();
        this.cameras.main.shake(500, 0.02);
        Soundscape.playExplosion();

        // Fatal Collision UI Event
        this.fatalText.setVisible(true);
        this.time.addEvent({
            delay: 150,
            callback: () => { this.fatalText.setVisible(!this.fatalText.visible); },
            repeat: 12
        });

        this.lives--;
        this.livesText.setText(`LIVES: ${this.lives}`);

        this.time.delayedCall(2000, () => {
            this.fatalText.setVisible(false);
            if (this.lives > 0) {
                this.isDying = false;
                this.player.respawn(this.startX, this.startY);
                this.hasCrystal = false;
                // Note: Re-enabling the crystal if it was dropped is usually needed
            } else {
                this.isGameOver = true;
                this.scene.start('GameOver', { score: this.score, levelReached: this.levelData.name, win: false });
            }
        });
    }

    updateScore(points) {
        this.score += points;
    }
}
