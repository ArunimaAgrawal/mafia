from rembg import remove
from pathlib import Path
from PIL import Image
import io

images_dir = Path("images")

for img_path in images_dir.glob("*.jpeg"):
    print(f"Processing: {img_path.name}")
    input_img = img_path.read_bytes()
    output_img = remove(input_img)
    # Save as PNG (transparent bg), then convert back to jpeg isn't ideal
    # Save as PNG to preserve transparency
    out_path = img_path.with_suffix(".png")
    out_path.write_bytes(output_img)
    # Remove original jpeg
    img_path.unlink()
    print(f"  Saved: {out_path.name}")

print("\nDone! All backgrounds removed.")
