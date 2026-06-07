import Phaser from 'phaser';
import { Soundscape } from '../audio/Soundscape.js';

export default class MobileUIScene extends Phaser.Scene {
    constructor() {
        super('MobileUIScene');
    }

    create() {
        this.states = {
            left: false,
            right: false,
            up: false,      // Legacy mapping
            fire: false,    // Shoot
            isUpJetDown: false // Dedicated Up Jet
        };

        const canvasWidth = this.scale.width;
        const canvasHeight = this.scale.height;
        const sideMargin = (canvasWidth - 1920) / 2;

        // UI Camera covers the entire canvas
        this.cameras.main.setViewport(0, 0, canvasWidth, canvasHeight);

        // Ensure we support multi-touch
        this.input.addPointer(2);

        // ==========================================
        // 1. LEFT MARGIN: 3-BUTTON INVERTED-T
        // ==========================================
        
        // Visuals for the Inverted-T layout
        const buttonGraphics = this.add.graphics();
        buttonGraphics.lineStyle(4, 0x00ffff, 0.8);
        buttonGraphics.fillStyle(0x00ffff, 0.2);

        // Calculate dynamic centers based on actual side margin
        const leftCenterX = sideMargin / 2; // e.g. 105 for 2340 width
        const btnRadius = 60; // Larger button sizes
        const verticalOffset = btnRadius * 2.5;

        const upPos = { x: leftCenterX, y: 850 - verticalOffset }; 
        const leftPos = { x: leftCenterX - btnRadius * 1.1, y: 850 };
        const rightPos = { x: leftCenterX + btnRadius * 1.1, y: 850 };

        // Draw [ UP ]
        buttonGraphics.fillCircle(upPos.x, upPos.y, btnRadius);
        buttonGraphics.strokeCircle(upPos.x, upPos.y, btnRadius);
        this.add.text(upPos.x, upPos.y, 'UP', { font: '32px monospace', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Draw [ LEFT ]
        buttonGraphics.fillCircle(leftPos.x, leftPos.y, btnRadius);
        buttonGraphics.strokeCircle(leftPos.x, leftPos.y, btnRadius);
        this.add.text(leftPos.x, leftPos.y, 'L', { font: '32px monospace', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Draw [ RIGHT ]
        buttonGraphics.fillCircle(rightPos.x, rightPos.y, btnRadius);
        buttonGraphics.strokeCircle(rightPos.x, rightPos.y, btnRadius);
        this.add.text(rightPos.x, rightPos.y, 'R', { font: '32px monospace', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // ==========================================
        // SMART D-PAD TOUCH ZONE
        // ==========================================
        const dpadCenterX = leftCenterX;
        const dpadCenterY = upPos.y + (verticalOffset / 2); // Center between UP and LEFT/RIGHT
        
        // Large invisible zone covering the entire left margin cluster
        const dpadZone = this.add.zone(dpadCenterX, dpadCenterY, Math.max(sideMargin * 1.5, 350), 450)
            .setOrigin(0.5).setInteractive();

        this.dpadPointer = null;

        const evaluateDPad = (pointer) => {
            // X-Axis Evaluation
            let newLeft = false;
            let newRight = false;
            if (pointer.x < dpadCenterX) {
                newLeft = true;
            } else {
                newRight = true;
            }

            // Y-Axis Evaluation
            let newUp = false;
            if (pointer.y < dpadCenterY) {
                newUp = true;
            }

            this.states.left = newLeft;
            this.states.right = newRight;
            this.states.isUpJetDown = newUp;
            this.states.up = newUp; // Provide for legacy compat in Player.js
            
            if (newUp) {
                Soundscape.setThrusting(true);
            } else {
                Soundscape.setThrusting(false);
            }
        };

        const startDPad = (pointer) => {
            if (!this.dpadPointer) {
                this.dpadPointer = pointer;
                evaluateDPad(pointer);
            }
        };

        const moveDPad = (pointer) => {
            if (this.dpadPointer === pointer) {
                evaluateDPad(pointer);
            }
        };

        const resetDPad = (pointer) => {
            if (this.dpadPointer === pointer) {
                this.dpadPointer = null;
                this.states.left = false;
                this.states.right = false;
                this.states.up = false;
                this.states.isUpJetDown = false;
                Soundscape.setThrusting(false);
            }
        };

        dpadZone.on('pointerdown', startDPad);
        dpadZone.on('pointermove', moveDPad);
        dpadZone.on('pointerup', resetDPad);
        dpadZone.on('pointerout', resetDPad);


        // ==========================================
        // 2. RIGHT MARGIN: MEGA FIRE BUTTON
        // ==========================================
        const rightMarginX = canvasWidth - sideMargin; 
        const rightZoneWidth = Math.max(sideMargin * 1.5, 350); // Bleed for easier touch
        const rightZone = this.add.zone(canvasWidth - rightZoneWidth, 0, rightZoneWidth, canvasHeight)
            .setOrigin(0, 0).setInteractive();

        // Single massive fire button packed against the right edge
        const fireButtonX = canvasWidth - (sideMargin / 2); 
        const fireButtonY = 800;
        const fireRadius = 110; // Fits comfortably with slight bleed
        
        const fireGraphics = this.add.graphics();
        
        const drawFireBtn = (isPressed) => {
            fireGraphics.clear();
            const color = isPressed ? 0xff5555 : 0xff0000;
            const alpha = isPressed ? 0.9 : 0.6;
            fireGraphics.fillStyle(color, alpha);
            fireGraphics.fillCircle(fireButtonX, fireButtonY, fireRadius);
            fireGraphics.lineStyle(8, 0xffffff, isPressed ? 1.0 : 0.8);
            fireGraphics.strokeCircle(fireButtonX, fireButtonY, fireRadius);
        };
        
        drawFireBtn(false);

        this.add.text(fireButtonX, fireButtonY, 'FIRE', {
            font: '50px monospace',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        rightZone.on('pointerdown', () => {
            this.states.fire = true;
            drawFireBtn(true);
        });

        const resetFire = () => {
            if (this.states.fire) {
                this.states.fire = false;
                drawFireBtn(false);
            }
        };

        rightZone.on('pointerup', resetFire);
        rightZone.on('pointerout', resetFire);
    }
}
