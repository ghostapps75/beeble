from rembg import remove
from PIL import Image
import os

assets_dir = 'public/assets'

bg_removal_files = [
    'new_hero.jpg'
]

# We also need to process these files, which we'll find by their exact case on disk.
for filename in os.listdir(assets_dir):
    lower_name = filename.lower()
    if lower_name in bg_removal_files:
        filepath = os.path.join(assets_dir, filename)
        print(f"Processing {filename} with rembg...")
        try:
            # Open the image
            input_image = Image.open(filepath)
            
            # Remove background using rembg directly on the raw image
            # We don't paste it onto a white background to avoid baking in noisy fringes.
            output_image = remove(input_image)
            
            # Save the clean image back
            if filename == 'new_hero.jpg':
                output_image.save(os.path.join(assets_dir, 'beeble.png'), format="PNG")
            else:
                output_image.save(filepath, format="PNG")
            print(f"Successfully cleaned {filename}")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")
