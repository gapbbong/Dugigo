import sys
import fitz
import json
import os

def extract_pdf():
    pdf_path = "ElectricExam2015.pdf"
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return

    doc = fitz.open(pdf_path)
    out_dir = "client/public/images/exam2015"
    os.makedirs(out_dir, exist_ok=True)

    questions = []

    for i, page in enumerate(doc):
        text = page.get_text()
        
        # Extract images
        image_list = page.get_images(full=True)
        images_info = []
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            image_name = f"page_{i+1}_img_{img_index+1}.{image_ext}"
            image_path = os.path.join(out_dir, image_name)
            
            with open(image_path, "wb") as f:
                f.write(image_bytes)
                
            images_info.append(f"/images/exam2015/{image_name}")
            
        questions.append({
            "page": i + 1,
            "text": text.strip(),
            "images": images_info
        })

    with open("exam_data_2015.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print("Extraction complete.")

if __name__ == "__main__":
    extract_pdf()
