export const LEVELS = [
    // Level 1: Claustrophobic 1983-Style Cave
    {
        name: "CHAPTER 1: THE TIGHT VEIN",
        bounds: { width: 3000, height: 3000 },
        startPos: { x: 200, y: 500 },
        crystalPos: { x: 2600, y: 2200 },
        escapeTime: 40,
        enemies: [
            // Chamber 2
            { x: 1800, y: 450, type: 'bug' },
            { x: 2300, y: 950, type: 'bug' },
            // Chamber 3
            { x: 2000, y: 2200, type: 'bug' },
            { x: 2500, y: 2500, type: 'bug' }
        ],
        movingHazards: [
            { x: 1200, y: 480, w: 20, h: 100, path: 'vertical', distance: 100, speed: 1200 },
            { x: 2200, y: 1400, w: 100, h: 20, path: 'horizontal', distance: 200, speed: 1800 }
        ],
        whiteMaterial: [
            { x: 1000, y: 480, w: 500, h: 10 },
            { x: 1000, y: 640, w: 500, h: 10 },
            { x: 2200, y: 1900, w: 20, h: 400 }
        ],
        walls: [
            // Chamber 1: CPU Starting Room (Grid)
            { x: 0, y: 0, w: 1000, h: 400 },      // Thick Top
            { x: 0, y: 700, w: 1000, h: 300 },    // Thick Bottom
            { x: 0, y: 400, w: 100, h: 300 },     // Left Boundary
            
            // Tight Tunnel 1 (Narrow: 160px wide)
            { x: 1000, y: 0, w: 500, h: 480 },    // Top
            { x: 1000, y: 650, w: 500, h: 350 },  // Bottom
            
            // Chamber 2: Hazard Room (Narrow and Sharp)
            { x: 1500, y: 0, w: 1200, h: 200 },   // Top
            { x: 1500, y: 1050, w: 1200, h: 150 }, // Bottom
            { x: 2600, y: 200, w: 100, h: 900 },  // Right
            
            // Narrow Vertical Drop (Narrow: 150px wide)
            { x: 1950, y: 1200, w: 100, h: 600 },  // Left Wall
            { x: 2200, y: 1200, w: 100, h: 600 },  // Right Wall
            
            // Chamber 3: The Crystal Tomb (Small: 400px x 400px area)
            { x: 1500, y: 1800, w: 450, h: 1000 }, // Left Wall
            { x: 2300, y: 1800, w: 100, h: 600 },  // Lower Right Wall 1
            { x: 1950, y: 2600, w: 1000, h: 400 }, // Bottom
            { x: 2800, y: 1800, w: 200, h: 800 }   // Far Right Boundary
        ]
    }
];
