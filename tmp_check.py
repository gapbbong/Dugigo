import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Check each PDF's metadata and page count to identify year
files = [
    'd:/App/Dukigo/scan/전기기기.pdf',
    'd:/App/Dukigo/scan/전기설비.pdf',
    'd:/App/Dukigo/scan/전기이론.pdf',
]

for path in files:
    doc = fitz.open(path)
    meta = doc.metadata
    print(f"\n=== {path} ===")
    print(f"Total pages: {len(doc)}")
    print(f"Metadata: {meta}")
    
    # Extract first image and save for inspection
    short_name = path.split('/')[-1].replace('.pdf', '')
    page = doc.load_page(0)
    imgs = page.get_images(full=True)
    if imgs:
        base = doc.extract_image(imgs[0][0])
        out_path = f"d:/App/Dukigo/tmp/{short_name}_p1.{base['ext']}"
        with open(out_path, 'wb') as f:
            f.write(base['image'])
        print(f"Saved first page image: {out_path}")
    doc.close()
