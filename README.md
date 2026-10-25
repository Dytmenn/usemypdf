# usemypdf

> **100% Client-Side, Zero-Upload PDF & Document Processing Suite**  
> https://usemypdf.vercel.app

A modern, minimalist, privacy-first web application for all your PDF and document manipulation needs. Everything runs locally inside your browser's RAM — no files are ever sent or stored on any server.

---

## ✨ Features

- **Organize & Edit**:
  - **Split PDF**: Extract custom visual page ranges or split into individual pages.
  - **Merge PDF**: Combine multiple PDF documents with intuitive drag-and-drop reordering.
  - **Organize & Rotate**: Rotate pages clockwise/counter-clockwise directly in canvas.
  - **Remove Pages**: Visually select and delete unwanted pages.
- **Optimize**:
  - **Compress PDF**: Dual-tier adaptive deflation engine (Extreme, Recommended, Less) with live estimated file size.
- **Conversions**:
  - **PDF to JPG / PNG**: High-resolution canvas rendering with instant ZIP download for multi-page docs.
  - **JPG / PNG to PDF**: Convert and arrange images into standard PDF documents.
  - **Office to PDF** (Word, Excel, PowerPoint): 100% in-browser parsing and PDF generation.
  - **PDF to Word / Excel / PowerPoint**: Local client-side structural text and table extraction.

---

## 🔒 Privacy & Architecture

- **Zero-Upload**: Files never leave your local machine.
- **In-Memory**: All operations take place in browser RAM.
- **Static & Fast**: Pre-compiled static CSS with zero server runtime overhead.

---

## 🛠 Tech Stack

- **HTML5 & CSS3** (Pre-compiled Tailwind CSS & Custom Minimalist Dark/Light theme)
- **Lucide Icons**
- **PDF-Lib** & **PDF.js**
- **SheetJS** (On-demand lazy-loaded)
- **JSZip**

---

## 🚀 Deployment

Because this is a completely standalone, static client-side web application, you can deploy it directly to **Vercel**, **GitHub Pages**, or **Cloudflare Pages** without any backend configuration:

```bash
# Push to GitHub
git init
git add .
git commit -m "feat: initial commit usemypdf suite"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```
