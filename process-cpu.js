import Jimp from 'jimp';

async function processImage() {
    try {
        const image = await Jimp.read('public/assets/cpu.jpg');
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        
        // Convert to a format that supports alpha
        image.rgba(true);
        
        const visited = new Uint8Array(w * h);
        const q = [];
        
        function tryAdd(x, y) {
            if (x < 0 || x >= w || y < 0 || y >= h) return;
            const i = y * w + x;
            if (visited[i]) return;
            
            const idx = (y * w + x) << 2;
            const r = image.bitmap.data[idx + 0];
            const g = image.bitmap.data[idx + 1];
            const b = image.bitmap.data[idx + 2];
            
            // Background is dark grey grid. Assume grid lines are not purely black but dark.
            if (r < 130 && g < 130 && b < 130) {
                visited[i] = 1;
                q.push({x, y});
                image.bitmap.data[idx + 3] = 0; // Set transparent
            }
        }

        for (let x = 0; x < w; x++) { tryAdd(x, 0); tryAdd(x, h - 1); }
        for (let y = 0; y < h; y++) { tryAdd(0, y); tryAdd(w - 1, y); }
        
        let head = 0;
        while(head < q.length) {
            const {x, y} = q[head++];
            tryAdd(x+1, y);
            tryAdd(x-1, y);
            tryAdd(x, y+1);
            tryAdd(x, y-1);
        }
        
        await image.writeAsync('public/assets/cpu-sprite-transparent.png');
        console.log('Successfully processed cpu.jpg into cpu-sprite-transparent.png');
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

processImage();
