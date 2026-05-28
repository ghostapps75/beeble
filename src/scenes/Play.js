import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Bug from '../entities/Bug.js';
import { levels } from '../levels.js';
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
        const levelData = levels[this.levelIndex];
        this.levelData = levelData;
        this.hasCrystal = false;
        this.isGameOver = false;
        this.isDying = false; // New flag for fatal collision freeze
        this.escapeTimeMax = levelData.escapeTime || 40;
        this.escapeTime = this.escapeTimeMax;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // --- Dynamic Level Bounds ---
        const cols = this.levelData.map ? this.levelData.map[0].length : 50;
        const rows = this.levelData.map ? this.levelData.map.length : 15;
        
        // Calculate HUD space (bottom 20%)
        const hudHeight = height * 0.2;
        const playableHeight = height - hudHeight;

        // The absolute key: Force the cell height to fit strictly inside the playable height.
        this.cellW = width / 50; 
        this.cellH = playableHeight / rows; 
        
        const worldWidth = cols * this.cellW;

        // --- Camera & Viewport Setup ---
        // Leave the physics world and camera at full 1080p width/height!
        // Because we squished cellH, the grid will naturally stop drawing at playableHeight.
        this.physics.world.setBounds(0, 0, worldWidth, height);
        this.cameras.main.setBounds(0, 0, worldWidth, height);
        
        // Add the invisible floor so the ship physically bounces off the HUD.
        this.invisibleFloor = this.add.rectangle(worldWidth / 2, playableHeight + 10, worldWidth, 20, 0x000000, 0);
        this.physics.add.existing(this.invisibleFloor, true);
        
        // --- Parallax Background ---
        this.bg = this.add.tileSprite(0, 0, width, height, 'bg_nebula').setOrigin(0).setScrollFactor(0);
        
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // --- Groups ---
        this.caveWalls = this.physics.add.staticGroup();
        this.hazards = this.physics.add.group();
        this.lasers = this.physics.add.group({ runChildUpdate: true });
        this.enemies = this.physics.add.group({ runChildUpdate: true });

        // --- Building the Level from Grid ---
        this.createLevelFromGrid();

        // --- Player Setup ---
        // Spawn coordinates are now set by 'S' in createLevelFromGrid()
        this.player = new Player(this, this.startX, this.startY);
        this.player.setCollideWorldBounds(true);

        // --- Collisions ---
        this.physics.add.collider(this.player, this.caveWalls);
        this.physics.add.collider(this.player, this.invisibleFloor);
        this.physics.add.overlap(this.player, this.hazards, this.fatalCollision, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.fatalCollision, null, this);
        this.physics.add.overlap(this.lasers, this.enemies, (laser, enemy) => { laser.destroy(); enemy.destroyEnemy(); this.updateScore(150); }, null, this);
        this.physics.add.collider(this.lasers, this.caveWalls, (laser) => { laser.destroy(); });
        this.physics.add.overlap(this.player, this.crystal, this.collectCrystal, null, this);
        this.physics.add.overlap(this.player, this.forcefield, this.winLevel, null, this);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // --- HUD ---
        this.create1983HUD();

        this.mobileInput = { left: false, right: false, up: false, fire: false };
        this.createMobileControls();
    }

    createLevelFromGrid() {
        const grid = this.levelData.map;
        const cols = grid[0].length;
        const rows = grid.length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const char = grid[r][c];
                const x = c * this.cellW + this.cellW / 2;
                const y = r * this.cellH + this.cellH / 2;

                if (char === 'X') {
                    // Safe cave wall
                    const rockKey = `rock${Phaser.Math.Between(1, 3)}`;
                    const rock = this.add.sprite(x, y, rockKey);
                    rock.setDisplaySize(this.cellW * 1.1, this.cellH * 1.1);
                    rock.setFlip(Phaser.Math.Between(0, 1) === 1, Phaser.Math.Between(0, 1) === 1);
                    rock.setRotation(Phaser.Math.FloatBetween(-0.1, 0.1));
                    rock.setBlendMode(Phaser.BlendModes.MULTIPLY);
                    
                    const wall = this.add.rectangle(x, y, this.cellW, this.cellH, 0x000000, 0);
                    this.physics.add.existing(wall, true);
                    this.caveWalls.add(wall);
                } else if (char === 'W') {
                    // Deadly white hazard block
                    const haz = this.hazards.create(x, y, 'hazard_cube');
                    haz.setDisplaySize(this.cellW, this.cellH);
                    
                    // CRITICAL: Sync invisible hitbox to match scaled visual size
                    haz.body.setSize(haz.width, haz.height);
                    haz.body.updateFromGameObject();
                    
                    haz.body.setAllowGravity(false).setImmovable(true);
                    
                    // Radioactive visuals
                    haz.setBlendMode(Phaser.BlendModes.ADD);
                    haz.setTint(0x00ffff);
                    
                    // Use opacity throb instead of scale to avoid hitbox expansion
                    this.tweens.add({
                        targets: haz,
                        alpha: { from: 0.5, to: 1.0 },
                        duration: 200,
                        yoyo: true,
                        repeat: -1,
                        onUpdate: () => {
                            haz.setTint(Math.random() > 0.5 ? 0x00ffff : 0xffffff);
                        }
                    });
                } else if (char === 'M') {
                    const haz = this.hazards.create(x, y, 'hazard_cube');
                    // Scale it to be 1 cell wide, but 3 cells tall to plug the entire shaft
                    haz.setDisplaySize(this.cellW, this.cellH * 3.5); 
                    
                    haz.body.setSize(haz.width, haz.height);
                    haz.body.updateFromGameObject();
                    haz.body.setAllowGravity(false).setImmovable(true);
                    
                    haz.setBlendMode(Phaser.BlendModes.ADD);
                    haz.setTint(0x00ffff); // Keep the classic white/cyan glow
                    
                    // Throbbing radiation effect
                    this.tweens.add({
                        targets: haz,
                        alpha: { from: 0.6, to: 1.0 },
                        duration: 200,
                        yoyo: true,
                        repeat: -1
                    });

                    // Massive Horizontal Patrol across the long tunnel
                    this.tweens.add({
                        targets: haz,
                        x: x + (this.cellW * 65), // Sweeps across 65 columns
                        duration: 9000, // Slow, relentless sweep
                        yoyo: true,
                        repeat: -1,
                        ease: 'Linear'
                    });
                } else if (char === 'C') {
                    // Crystal
                    this.crystal = this.physics.add.sprite(x, y, 'crystal');
                    this.crystal.setScale(0.12);
                    this.crystal.body.setAllowGravity(false).setImmovable(true);
                } else if (char === 'E') {
                    new Bug(this, x, y);
                } else if (char === 'B') {
                    // CPU Base
                    this.forcefield = this.add.sprite(x, y, 'items', 0);
                    this.forcefield.setDisplaySize(this.cellW * 2, this.cellH * 2);
                    this.physics.add.existing(this.forcefield, true);
                    
                    const modernBeeble = this.add.sprite(x - 20, y, 'items', 2342);
                    modernBeeble.setScale(1.5);
                    modernBeeble.setTint(0xaaaaaa);
                } else if (char === 'S') {
                    // Player Start
                    this.startX = x;
                    this.startY = y;
                }
            }
        }
    }

    createMobileControls() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const leftBtn = this.add.circle(100, height - 100, 50, 0xffffff).setScrollFactor(0).setDepth(100);
        const rightBtn = this.add.circle(250, height - 100, 50, 0xffffff).setScrollFactor(0).setDepth(100);
        
        const shootBtn = this.add.circle(width - 250, height - 100, 50, 0xffffff).setScrollFactor(0).setDepth(100);
        const thrustBtn = this.add.circle(width - 100, height - 100, 50, 0xffffff).setScrollFactor(0).setDepth(100);

        const addTouch = (btn, action) => {
            btn.setInteractive();
            btn.setAlpha(0.3); // Semi-transparent
            btn.on('pointerdown', () => { this.mobileInput[action] = true; btn.setAlpha(0.6); });
            btn.on('pointerup', () => { this.mobileInput[action] = false; btn.setAlpha(0.3); });
            btn.on('pointerout', () => { this.mobileInput[action] = false; btn.setAlpha(0.3); });
        };
        addTouch(leftBtn, 'left');
        addTouch(rightBtn, 'right');
        addTouch(thrustBtn, 'up');
        addTouch(shootBtn, 'fire');
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
        
        // Top Band: Modern Blue (Lives)
        const topBand = this.add.rectangle(width/2, bandH/2, width, bandH, 0x1a237e, 0.85).setOrigin(0.5);
        this.hudLayer.add(topBand);
        
        // Middle Band: Modern Purple (Fuel)
        const midBand = this.add.rectangle(width/2, bandH * 1.5, width, bandH, 0x4a148c, 0.85).setOrigin(0.5);
        this.hudLayer.add(midBand);
        
        // Bottom Band: Modern Red (Score/High)
        const botBand = this.add.rectangle(width/2, bandH * 2.5, width, bandH, 0xb71c1c, 0.85).setOrigin(0.5);
        this.hudLayer.add(botBand);

        const textStyle = { font: 'bold 36px "Courier New", monospace', fill: '#fff' };

        // Modern Icons from items.PNG
        // Lives: Frame 2098 (Winged Ship)
        this.lifeIcon = this.add.sprite(50, bandH/2, 'items', 2098).setScale(1.2);
        this.livesText = this.add.text(90, bandH/2, `LIVES: ${this.lives}`, textStyle).setOrigin(0, 0.5);
        this.hudLayer.add([this.lifeIcon, this.livesText]);
        
        // Fuel: Frame 2102 (Alien Head)
        this.fuelIcon = this.add.sprite(50, bandH * 1.5, 'items', 2102).setScale(1.2);
        this.fuelHUDText = this.add.text(90, bandH * 1.5, `FUEL: 000`, textStyle).setOrigin(0, 0.5);
        this.hudLayer.add([this.fuelIcon, this.fuelHUDText]);

        // High Score: Frame 2106 (Gem Cluster)
        this.gemIcon = this.add.sprite(width/2 - 120, bandH * 2.5, 'items', 2106).setScale(1.2);
        const highScore = localStorage.getItem('captainBeebleHighScore') || 0;
        this.highScoreHUDText = this.add.text(width/2, bandH * 2.5, `HIGH: ${highScore.toString().padStart(3, '0')}`, textStyle).setOrigin(0.5);
        this.hudLayer.add([this.gemIcon, this.highScoreHUDText]);

        // Raw Score (Right Aligned)
        this.scoreHUDText = this.add.text(width - 50, bandH/2, `SCORE: ${this.score.toString().padStart(3, '0')}`, textStyle).setOrigin(1, 0.5);
        this.hudLayer.add(this.scoreHUDText);

        // --- Fatal Collision Event Layer ---
        this.fatalText = this.add.text(width/2, height/2 - 50, 'FATAL COLLISION', { 
            font: 'bold 80px "Courier New", monospace', 
            fill: '#ff0000', 
            backgroundColor: '#000000' 
        })
        .setOrigin(0.5).setScrollFactor(0).setDepth(2000).setVisible(false);
    }

    update(time, delta) {
        if (this.bg) {
            this.bg.tilePositionX = this.cameras.main.scrollX * 0.2;
        }

        if (this.isGameOver || this.isDying) return;

        if (this.player && !this.player.isDead) {
            this.player.update(time, delta);
            
            // Crystal Volatility Timer & Follow Logic
            if (this.hasCrystal) {
                this.escapeTime -= delta / 1000;
                if (this.escapeTime <= 0) {
                    this.escapeTime = 0;
                    this.fatalCollision(this.player, null);
                }
                
                // Visually attach crystal to the player
                this.crystal.setPosition(this.player.x, this.player.y + 20);
            }

            // Update HUD
            this.fuelHUDText.setText(`FUEL: ${Math.floor(this.player.fuel / 5).toString().padStart(3, '0')}`);
            this.scoreHUDText.setText(`SCORE: ${this.score.toString().padStart(3, '0')}`);
        }
    }

    collectCrystal(player, crystal) {
        if (this.hasCrystal || this.isDying || this.isGameOver) return;
        
        this.hasCrystal = true;
        this.escapeTime = this.escapeTimeMax; // Start countdown
        
        // Disable crystal's physical body
        crystal.body.enable = false;
        
        // Provide visual feedback
        this.cameras.main.flash(200, 0, 255, 255);
    }

    winLevel(player, forcefield) {
        if (!this.hasCrystal || this.isDying || this.isGameOver) return;

        this.hasCrystal = false;
        
        // Detach the crystal and place it at CPU base
        this.crystal.setPosition(forcefield.x, forcefield.y);
        
        console.log("Victory! Crystal delivered.");
        
        this.updateScore(1000);
        
        // Transition to next level or win screen
        this.scene.start('GameOver', { score: this.score, win: true });
    }

    handleWallCollision(player, wall) {
        const speed = player.body.speed || player.body.velocity.length();
        if (speed > 400) {
            this.cameras.main.shake(100, 0.01);
            Soundscape.playBounce(speed);
        }
    }

    fatalCollision(player, hazard) {
        if (this.isDying || this.isGameOver) return;
        this.isDying = true;

        // a. Immediately execute this.physics.pause()
        this.physics.pause();

        // b. Stop all active Tweens on the Hazard blocks
        this.tweens.pauseAll();

        // c. Render center-screen text
        this.fatalText.setVisible(true);

        Soundscape.playExplosion();
        this.cameras.main.shake(500, 0.02);

        // d. 2000ms delayed call
        this.time.delayedCall(2000, () => {
            this.fatalText.setVisible(false);
            this.isDying = false;
            
            // Unpause physics and reset
            this.physics.resume();
            this.tweens.resumeAll();
            
            this.lives--;
            this.livesText.setText(`LIVES: ${this.lives}`);

            if (this.lives > 0) {
                this.player.respawn(this.startX, this.startY);
                this.hasCrystal = false;
                this.crystal.setVisible(true);
                this.crystal.body.enable = true;
            } else {
                this.isGameOver = true;
                this.scene.start('GameOver', { score: this.score, win: false });
            }
        });
    }

    handlePlayerDeath() {
        // Redundant with fatalCollision but used for other deaths like Fuel
        this.fatalCollision(this.player, null);
    }

    updateScore(points) {
        this.score += points;
    }
}
