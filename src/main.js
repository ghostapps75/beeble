import './style.css';
import Phaser from 'phaser';
import Boot from './scenes/Boot.js';
import Preload from './scenes/Preload.js';
import Menu from './scenes/Menu.js';
import Play from './scenes/Play.js';
import GameOver from './scenes/GameOver.js';
import MobileUIScene from './scenes/MobileUIScene.js';

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
window.isMobile = isMobile; // Export globally for scenes

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: isMobile ? 2340 : 1920,
    height: 1080,
    backgroundColor: '#0a0a0a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 } // Player handles its own gravity now
        }
    },
    scene: [Boot, Preload, Menu, Play, GameOver, MobileUIScene]
};

const game = new Phaser.Game(config);
