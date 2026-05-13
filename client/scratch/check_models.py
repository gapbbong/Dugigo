import google.generativeai as genai

with open(r'E:\Quiz-extraction\keys.txt', 'r') as f:
    key = f.readline().strip()

genai.configure(api_key=key)
print("Available Models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
