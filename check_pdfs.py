import fitz
import sys

# Check first few pages of 전기기기.pdf
def check_pdf(path):
    print(f"--- Checking {path} ---")
    try:
        doc = fitz.open(path)
        print(f"Total pages: {len(doc)}")
        for i in range(min(5, len(doc))):
            page = doc.load_page(i)
            text = page.get_text("text").strip()
            print(f"Page {i+1} characters: {len(text)}")
            if len(text) > 0:
                print(text[:200]) # Print first 200 chars
                print("...")
            else:
                # If no text, might be a scanned image-only PDF
                print("No text found. Likely scanned image.")
        doc.close()
    except Exception as e:
        print("Error:", e)

check_pdf('d:/App/Dukigo/scan/전기기기.pdf')
check_pdf('d:/App/Dukigo/scan/전기설비.pdf')
check_pdf('d:/App/Dukigo/scan/전기이론.pdf')
