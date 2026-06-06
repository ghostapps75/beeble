import os
import shutil
from PIL import Image
from rembg import remove

SOURCE_DIR = r"C:\Agent Asset Library\beeble_images"
DEST_DIR = "public/assets"
os.makedirs(DEST_DIR, exist_ok=True)

def crop_square(img):
    w, h = img.size
    m = min(w, h)
    return img.crop(((w - m) // 2, (h - m) // 2, (w + m) // 2, (h + m) // 2))

# 1. Characters and Background
file_map = {
    "nebula.jpg": [("bg_nebula.jpg", False, None)],
    "beeble.jpg": [("player.png", True, None)],
    "drone.jpg": [("drone_enemy.png", True, None)],
    "bug_sprites.jpg": [
        ("bug_enemy_up.png", True, lambda w, h: (w//3, h//3, (w//3)*2, (h//3)*2)),
        ("bug_enemy_down.png", True, lambda w, h: (w//3, h//3, (w//3)*2, (h//3)*2))
    ]
}

for src_name, actions in file_map.items():
    path = os.path.join(SOURCE_DIR, src_name)
    if os.path.exists(path):
        img = Image.open(path)
        for out_name, do_rembg, crop_func in actions:
            processed = img.copy()
            if crop_func: processed = processed.crop(crop_func(*processed.size))
            if do_rembg: processed = remove(processed)
            processed.save(os.path.join(DEST_DIR, out_name))
        print(f"Processed {src_name}")

# 2. Environment (Rocks, CPU, and Hazard Blocks)
env_map = {
    "rock.jpg": ["rock_tile.png", "rock_crystal_tile.png", "cpu_block.png"],
    "block2.jpg": ["rock_tile2.png"],
    "hblock.jpg": ["hazard_cube.png", "hazard_block.png"]
}

for src_name, out_names in env_map.items():
    path = os.path.join(SOURCE_DIR, src_name)
    if os.path.exists(path):
        clean = remove(crop_square(Image.open(path)))
        for out_name in out_names:
            clean.save(os.path.join(DEST_DIR, out_name))
        print(f"Processed {src_name}")
