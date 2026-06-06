import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Bug from '../entities/Bug.js';
import Enemy from '../entities/Enemy.js';
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
        this.vMult = 1.6;
        this.wMult = 0.9;
        this.uMult = 0.7;
        this.mMult = 1.6;
    }

    create() {
        const levelData = levels[this.levelIndex];
        this.levelData = levelData;
        this.hasCrystal = false;
        this.crystal = null;
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

        // --- EXACT WORLD BOUNDS BLOCK ---
        // Lock cell width to screen columns, but make cell height perfectly square!
        this.cellW = width / 50; 
        this.cellH = this.cellW; 

        const worldWidth = cols * this.cellW;
        const worldHeight = rows * this.cellH; // World is now as deep as the map array!

        // Expand physics and camera to the TRUE bottom of the pits
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        // Move the floor to the absolute bottom of the new world height
        this.invisibleFloor = this.add.rectangle(worldWidth / 2, worldHeight + 10, worldWidth, 20, 0x000000, 0);
        this.physics.add.existing(this.invisibleFloor, true);
        // --------------------------------

        // --- Parallax Background ---
        this.bg = this.add.tileSprite(0, 0, width, height, 'bg_nebula').setOrigin(0).setScrollFactor(0);

        this.cameras.main.fadeIn(500, 0, 0, 0);

        // --- Groups ---
        this.caveWalls = this.physics.add.staticGroup();
        this.destructibleWalls = this.physics.add.staticGroup();
        this.destructibleCrystalWalls = this.physics.add.staticGroup();
        this.hazards = this.physics.add.group();
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.lasers = this.physics.add.group({ runChildUpdate: true });
        this.crystalsGroup = this.physics.add.group();

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

        // Destructible Wall Collision
        this.physics.add.collider(this.lasers, this.destructibleWalls, (laser, wall) => {
            laser.destroy();
            this.destroyWall(wall);
        });

        // Crystal Wall Collision
        this.physics.add.collider(this.lasers, this.destructibleCrystalWalls, (laser, wall) => {
            laser.destroy();
            const wx = wall.x;
            const wy = wall.y;
            this.destroyWall(wall);
            
            const newCrystal = this.physics.add.sprite(wx, wy, 'gem_icon');
            newCrystal.setDisplaySize(this.cellW * 2, this.cellH * 2); // 2x2 Crystal
            newCrystal.setBlendMode(Phaser.BlendModes.ADD);
            newCrystal.body.setAllowGravity(false).setImmovable(true);
            this.crystalsGroup.add(newCrystal);
            this.tweens.add({ targets: newCrystal, y: wy - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });

        this.physics.add.collider(this.player, this.destructibleWalls);
        this.physics.add.collider(this.player, this.destructibleCrystalWalls);

        this.physics.add.overlap(this.player, this.crystalsGroup, this.collectCrystal, null, this);
        this.physics.add.overlap(this.player, this.forcefield, this.winLevel, null, this);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // --- HUD ---
        this.create1983HUD();

        // Audio Context Failsafe
        if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }
    }

    createLevelFromGrid() {
        const grid = this.levelData.map;
        const cols = grid[0].length;
        const rows = grid.length;

        for (let r = 0; r < rows; r++) {
            let c = 0;
            while (c < cols) {
                const char = grid[r][c];

                if (char === 'X' || char === 'P') {
                    const w = this.cellW;
                    const h = this.cellH;
                    const x = c * this.cellW + w / 2;
                    const y = r * this.cellH + h / 2;

                    // 1. Invisible Physics Block
                    const wall = this.add.rectangle(x, y, w, h, 0x000000, 0);
                    this.physics.add.existing(wall, true);
                    this.caveWalls.add(wall);

                    if (char === 'X') {
                        // Randomly pick between rock 1 and rock 2
                        const texture = Math.random() > 0.5 ? 'rock_tile' : 'rock_tile2';
                        const rock = this.add.sprite(x, y, texture);
                        
                        // 2. Draw rock 40% LARGER to overlap and hide the grid
                        rock.setDisplaySize(w * 1.4, h * 1.4);
                        
                        // 3. Random rotation and flip
                        const angles = [0, Math.PI/2, Math.PI, Math.PI * 1.5];
                        rock.setRotation(angles[Math.floor(Math.random() * angles.length)]);
                        if (Math.random() > 0.5) rock.setFlipX(true);
                        if (Math.random() > 0.5) rock.setFlipY(true);
                    } else if (char === 'P') {
                        const cpu = this.add.sprite(x, y, 'cpu_block');
                        cpu.setDisplaySize(w, h);
                        cpu.setTint(0x0055ff); // Tint blue to distinguish it as the safe base
                    }
                    c++;
                    continue;
                }

                // Normal per-cell parsing for other elements
                const x = c * this.cellW + this.cellW / 2;
                const y = r * this.cellH + this.cellH / 2;

                if (char === 'D' || char === 'K') {
                    // Fill the gap visually
                    const rock = this.add.sprite(x, y, char === 'D' ? 'rock_tile' : 'rock_crystal_tile');
                    rock.setDisplaySize(this.cellW * 6, this.cellH * 6); 
                    rock.setRotation(Math.random() * Math.PI);
                    rock.setTint(char === 'D' ? 0xffaaaa : 0xff00ff); 
                    
                    // Appropriate physics wall for the gap
                    const wall = this.add.rectangle(x, y, this.cellW * 4, this.cellH * 4, 0x000000, 0);
                    this.physics.add.existing(wall, true);
                    wall.visual = rock;
                    if (char === 'D') this.destructibleWalls.add(wall);
                    else this.destructibleCrystalWalls.add(wall);
                } else if (char === 'M') {
                    const haz = this.hazards.create(x, y, 'hazard_block');
                    haz.setDisplaySize(this.cellW * 8, this.cellH * 8);
                    haz.body.setAllowGravity(false).setImmovable(true);
                    this.tweens.add({ targets: haz, alpha: { from: 0.6, to: 1.0 }, duration: 400, yoyo: true, repeat: -1 });

                    // Dynamic duration for the horizontal block
                    this.tweens.add({ targets: haz, x: x + (this.cellW * 160), duration: 22000 / this.mMult, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                } else if (char === 'V' || char === 'W' || char === 'U') {
                    const haz = this.hazards.create(x, y, 'hazard_block');
                    haz.setDisplaySize(this.cellW * 8, this.cellH * 8); 
                    haz.body.setAllowGravity(false).setImmovable(true);
                    this.tweens.add({ targets: haz, alpha: { from: 0.6, to: 1.0 }, duration: 400, yoyo: true, repeat: -1 });
                    
                    // Base durations divided by the Dev Tool multipliers
                    const baseDuration = (char === 'V' || char === 'W') ? 2500 : 1500;
                    const mult = char === 'V' ? this.vMult : (char === 'W' ? this.wMult : this.uMult);
                    const finalDuration = baseDuration / mult;
                    
                    // Calculate exact drop distances to hit the varying floor heights below them
                    let dropCells = 10.5;
                    if (char === 'V') dropCells = 9.5;
                    else if (char === 'W') dropCells = 10.5;
                    else if (char === 'U') dropCells = 6.5;
                    
                    this.tweens.add({ 
                        targets: haz, 
                        y: y + (this.cellH * dropCells), 
                        duration: finalDuration, 
                        yoyo: true, 
                        repeat: -1, 
                        ease: 'Sine.easeInOut' 
                    });
                } else if (char === 'C') {
                    const newCrystal = this.physics.add.sprite(x, y, 'gem_icon');
                    newCrystal.setDisplaySize(this.cellW * 2, this.cellH * 2); // 2x2 Crystal
                    newCrystal.setBlendMode(Phaser.BlendModes.ADD);
                    newCrystal.body.setAllowGravity(false).setImmovable(true);
                    this.crystalsGroup.add(newCrystal);
                    this.tweens.add({ targets: newCrystal, y: y - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                } else if (char === 'E') {
                    new Bug(this, x, y);
                } else if (char === 'R') {
                    new Enemy(this, x, y, true);
                } else if (char === 'B') {
                    this.forcefield = this.add.sprite(x, y, 'cpu_block');
                    this.forcefield.setDisplaySize(this.cellW * 8, this.cellH * 8); // Giant Safe Zone Base
                    this.forcefield.setTint(0x00ff00);
                    this.physics.add.existing(this.forcefield, true);
                } else if (char === 'S') {
                    // Player Start
                    this.startX = x;
                    this.startY = y;
                }

                c++; // manually advance for non-contiguous items
            }
        }
    }

    destroyWall(wall) {
        // Emit particles
        if (this.particles) {
            this.particles.emitParticleAt(wall.x, wall.y, 10);
        }
        // Small explosion ring
        const ring = this.add.particles(0, 0, wall.texture.key, {
            x: wall.x,
            y: wall.y,
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 300
        });
        ring.explode(8);
        this.time.delayedCall(300, () => ring.destroy());

        if (wall.visual) wall.visual.destroy();
        wall.destroy();
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
        const topBand = this.add.rectangle(width / 2, bandH / 2, width, bandH, 0x1a237e, 0.85).setOrigin(0.5);
        this.hudLayer.add(topBand);

        // Middle Band: Modern Purple (Fuel)
        const midBand = this.add.rectangle(width / 2, bandH * 1.5, width, bandH, 0x4a148c, 0.85).setOrigin(0.5);
        this.hudLayer.add(midBand);

        // Bottom Band: Modern Red (Score/High)
        const botBand = this.add.rectangle(width / 2, bandH * 2.5, width, bandH, 0xb71c1c, 0.85).setOrigin(0.5);
        this.hudLayer.add(botBand);

        const textStyle = { font: 'bold 36px "Courier New", monospace', fill: '#fff' };

        // Modern Icons from individual images
        // Lives
        this.lifeIcon = this.add.sprite(50, bandH / 2, 'life_icon').setDisplaySize(50, 50);
        this.livesText = this.add.text(90, bandH / 2, `LIVES: ${this.lives}`, textStyle).setOrigin(0, 0.5);
        this.hudLayer.add([this.lifeIcon, this.livesText]);

        // Fuel
        this.fuelIcon = this.add.sprite(50, bandH * 1.5, 'fuel_icon').setDisplaySize(50, 50);
        this.fuelHUDText = this.add.text(90, bandH * 1.5, `FUEL: 000`, textStyle).setOrigin(0, 0.5);
        this.hudLayer.add([this.fuelIcon, this.fuelHUDText]);

        // High Score
        this.gemIcon = this.add.sprite(width / 2 - 120, bandH * 2.5, 'gem_icon').setDisplaySize(50, 50);
        const highScore = localStorage.getItem('captainBeebleHighScore') || 0;
        this.highScoreHUDText = this.add.text(width / 2, bandH * 2.5, `HIGH: ${highScore.toString().padStart(3, '0')}`, textStyle).setOrigin(0.5);
        this.hudLayer.add([this.gemIcon, this.highScoreHUDText]);

        // Raw Score (Right Aligned)
        this.scoreHUDText = this.add.text(width - 50, bandH / 2, `SCORE: ${this.score.toString().padStart(3, '0')}`, textStyle).setOrigin(1, 0.5);
        this.hudLayer.add(this.scoreHUDText);

        // --- Fatal Collision Event Layer ---
        this.fatalText = this.add.text(width / 2, height / 2 - 50, 'FATAL COLLISION', {
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
            if (this.hasCrystal && this.crystal) {
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
        this.crystal = crystal; // Track the specific crystal we picked up
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
        if (this.levelIndex + 1 < levels.length) {
            this.scene.start('Play', { 
                levelIndex: this.levelIndex + 1, 
                score: this.score, 
                lives: this.lives
            });
        } else {
            Soundscape.setThrusting(false);
            this.scene.start('GameOver', { score: this.score, win: true });
        }
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

                // THE FIX: Check if the crystal is actually an active object!
                if (this.crystal && this.crystal.active) {
                    this.crystal.setVisible(true);
                    this.crystal.body.enable = true;
                }
            } else {
                this.isGameOver = true;
                Soundscape.setThrusting(false);
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
