import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';

const assetsDir = './public/assets';

const bgRemovalFiles = [
    'beeble.png',
    'bug_enemy_up.png',
    'bug_enemy_down.png',
    'drone_enemy.png',
    'crystal.png',
    'life_icon.png',
    'fuel_icon.png',
    'gem_icon.png'
];

const cropFiles = [
    'rock_skin_1.png',
    'rock_skin_2.png',
    'rock_skin_3.png',
    'rock_sprite.png',
    'hazard_cube.png',
    'hazard_block.png'
];

async function removeBackground() {
    for (const file of bgRemovalFiles) {
        const filePath = path.join(assetsDir, file);
        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${file}, not found.`);
            continue;
        }
        console.log(`Processing BG removal for ${file}`);
        try {
            const image = await Jimp.read(filePath);
            
            // Assume the top-left pixel is the background color we want to remove
            const bgPixel = image.getPixelColor(0, 0);
            const bgR = Jimp.intToRGBA(bgPixel).r;
            const bgG = Jimp.intToRGBA(bgPixel).g;
            const bgB = Jimp.intToRGBA(bgPixel).b;

            // only remove if background is mostly white or mostly black
            if ((bgR > 230 && bgG > 230 && bgB > 230) || (bgR < 25 && bgG < 25 && bgB < 25)) {
                 image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
                    const r = this.bitmap.data[idx + 0];
                    const g = this.bitmap.data[idx + 1];
                    const b = this.bitmap.data[idx + 2];
                    
                    // calculate distance
                    const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
                    if (dist < 40) {
                        this.bitmap.data[idx + 3] = 0; // set alpha to 0
                    }
                });
                await image.writeAsync(filePath);
                console.log(`Updated ${file}`);
            } else {
                console.log(`Skipped ${file}, bg color not white/black: ${bgR},${bgG},${bgB}`);
            }
        } catch(e) {
            console.error(`Error processing ${file}:`, e);
        }
    }
}

async function cropSquare() {
    for (const file of cropFiles) {
        const filePath = path.join(assetsDir, file);
        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${file}, not found.`);
            continue;
        }
        console.log(`Processing crop for ${file}`);
        try {
            const image = await Jimp.read(filePath);
            const w = image.bitmap.width;
            const h = image.bitmap.height;
            if (w !== h) {
                const size = Math.min(w, h);
                const x = Math.floor((w - size) / 2);
                const y = Math.floor((h - size) / 2);
                image.crop({ x, y, w: size, h: size }); // Note: jimp > 1.0 crop syntax might differ, let's use standard v0 syntax if possible, wait: .crop(x, y, w, h)
                // Actually Jimp.crop(x,y,w,h) is the v0 API.
                // Let's just use `image.crop(x, y, size, size)`
                image.crop(x, y, size, size);
                await image.writeAsync(filePath);
                console.log(`Cropped ${file} to ${size}x${size}`);
            } else {
                console.log(`${file} is already square.`);
            }
        } catch(e) {
            console.error(`Error processing ${file}:`, e);
        }
    }
}

async function run() {
    await removeBackground();
    await cropSquare();
}

run();
