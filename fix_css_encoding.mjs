import fs from 'fs';
const content = `@import "tailwindcss";

@theme {
  --font-sans: var(--font-outfit), sans-serif;
  --color-brand-50: #f5f7ff;
  --color-brand-100: #ebf0ff;
  --color-brand-500: #635bff;
  --color-brand-600: #5851ea;
  --color-brand-700: #4a45cd;
}

:root {
  --background: #fcfcfd;
  --foreground: #1a1f36;
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.8);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0b;
    --foreground: #fcfcfd;
    --glass-bg: rgba(15, 15, 20, 0.7);
    --glass-border: rgba(255, 255, 255, 0.1);
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  overflow-x: hidden;
}

/* 🌈 Stripe-style Mesh Gradient Background */
.mesh-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-color: #f7f9fc;
  background-image: 
    radial-gradient(at 0% 0%, rgba(99, 91, 255, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(131, 102, 255, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(0, 209, 255, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(255, 0, 153, 0.05) 0px, transparent 50%);
  filter: blur(80px);
  animation: mesh-move 20s ease infinite alternate;
}

@keyframes mesh-move {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

/* 🥂 Glassmorphism Utility */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ✨ Interactive Elements */
.btn-primary {
  background: linear-gradient(135deg, #635bff 0%, #a259ff 100%);
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(99, 91, 255, 0.3);
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 91, 255, 0.4);
}

.text-gradient {
  background: linear-gradient(to right, #635bff, #00d1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

/* 📊 Data Tables in Explanations */
.explanation-table table {
  width: 100% !important;
  border-collapse: collapse;
  margin: 1rem 0;
  border: 1.5px solid #e2e8f0 !important;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  font-size: 0.9rem;
}

.explanation-table th {
  background: #f8fafc;
  padding: 0.75rem 0.5rem;
  border: 1.5px solid #e2e8f0 !important;
  font-weight: 800;
  text-align: center;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.explanation-table td {
  padding: 0.75rem 0.5rem;
  border: 1px solid #e2e8f0 !important;
  text-align: center;
  font-weight: 700;
  color: #334155;
}

.explanation-table tr:hover {
  background: #f5f7ff;
}

@media (max-width: 768px) {
  .explanation-table table {
    font-size: 0.75rem;
  }
  .explanation-table th, .explanation-table td {
    padding: 0.4rem 0.2rem;
  }
}
`;
fs.writeFileSync('e:/DugiGo/client/src/app/globals.css', content, 'utf8');
console.log('globals.css fixed with UTF-8 encoding.');
