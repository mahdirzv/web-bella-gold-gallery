# Bella Gold Gallery — Web IA & Design Directions (`web-bella-gold-gallery`)

An interactive, high-fidelity luxury jewellery e-commerce prototype showcasing **Information Architecture (IA) wireframes**, **dual visual design directions**, **semantic token inspection**, and **real-time bilingual (LTR/RTL) rendering**.

---

## ✨ Features & Highlights

### 1. 📐 Information Architecture (IA) Wireframe
* **Structured E-Commerce Hierarchy**: Sequential layout planning designed for luxury jewelry conversion:
  1. Campaign Hero & Announcement Banner
  2. Shop by Category Grid
  3. Best Sellers / New Arrivals Carousel
  4. Signature Collection Storytelling
  5. Shop by Intent (Everyday, Gifting, Occasion)
  6. Craft & Material Reassurance
  7. Client Services & Care Guarantee
  8. Newsletter & Global Footer
* **Site Map & Phase Roadmap**: Visual sitemap breakdown demarcating **MVP (Launch Requirements)** vs. **P2 (Operational Expansion)** vs. **If Valid** features.

### 2. 🎨 Dual Visual Design System Directions
Compare two distinct visual identities in real-time:
* **Archive Heirloom (Vintage)**:
  * Warm, collected, and quietly ceremonial aesthetic.
  * Classic serif typography ([Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)).
  * Framed media slots, 0px border-radii, hairline borders, and double-rule ornamental accents.
* **Precision Atelier (Modern)**:
  * Quietly technical and contemporary.
  * Display serif ([Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif)) paired with clean sans-serif body ([Manrope](https://fonts.google.com/specimen/Manrope)).
  * Rounded media corners (18px), pill button controls, asymmetrical layouts, and confident negative space.

### 3. 🌍 Full Bilingual Support (English & Farsi / LTR & RTL)
* Instant UI translation toggle between **English (EN)** and **Farsi (فا)**.
* Automatic layout direction switching (**LTR** ↔ **RTL**) with typography adaptation using [Noto Naskh Arabic](https://fonts.google.com/specimen/Noto+Naskh+Arabic) and [Vazirmatn](https://fonts.google.com/specimen/Vazirmatn).

### 4. 🌗 Theme & Viewport Controls
* Live **Light Mode** vs. **Dark Mode** color palette switching.
* **Desktop** (1180px page container) vs. **Mobile** (390px viewport frame) responsive rendering.
* **Design Token Inspector**: Live color swatches, font specs, spacing tokens, and component DNA breakdown.

### 5. 🖼️ Asset & Image Slot Manager
* Interactive image gallery picker allowing custom slot overrides (Hero, Categories, Products, Editorial Story, Craft).
* Image adjustment tools: **Fill / Fit crop modes**, **9-point focal point alignment**, and **custom image upload support**.

---

## 🚀 How to Get It to Work

### Option 1: Direct Browser Opening (No Installation Needed)
Simply double-click or open either of the standalone HTML files directly in your favorite web browser (Safari, Chrome, Firefox, Edge):
* Open `Jewellery Design Directions.html` for the interactive design direction preview.
* Open `Jewellery IA Wireframe.html` for the information architecture wireframe.

---

### Option 2: Run via Local HTTP Server (Recommended)
Running through a local web server enables full runtime features and relative asset loading.

#### Using Python (Pre-installed on macOS/Linux):
```bash
# Navigate to the project directory
cd web-bella-gold-gallery

# Start a local web server on port 8085
python3 -m http.server 8085
```
Then open your browser to:
* **Design Directions**: [http://localhost:8085/Jewellery%20Design%20Directions.html](http://localhost:8085/Jewellery%20Design%20Directions.html)
* **IA Wireframe**: [http://localhost:8085/Jewellery%20IA%20Wireframe.html](http://localhost:8085/Jewellery%20IA%20Wireframe.html)
* **Interactive DesignDoc Engine**: [http://localhost:8085/Jewellery%20Design%20Directions.dc.html](http://localhost:8085/Jewellery%20Design%20Directions.dc.html)

#### Using Node.js / `npx`:
```bash
npx http-server . -p 8085
```

---

## 📁 Repository Directory Structure

```
web-bella-gold-gallery/
├── Jewellery Design Directions.html    # Standalone HTML preview (Design Directions)
├── Jewellery IA Wireframe.html           # Standalone HTML preview (IA Wireframe)
├── Jewellery Design Directions.dc.html  # Interactive DesignDoc template source
├── Jewellery IA Wireframe.dc.html        # Interactive IA Wireframe template source
├── support.js                           # DesignDoc component runtime engine
├── react.production.min.js              # Bundled React 18 UMD (offline support)
├── react-dom.production.min.js          # Bundled ReactDOM 18 UMD (offline support)
├── assets/                              # Brand and product photography assets
│   ├── brand/                           # Logos and brand mark graphics
│   └── jewellery/                       # Product gallery image library (27 images)
├── research/                            # Architectural design documents & source reference
├── uploads/                             # Preview screenshots and exported HTML build artifacts
├── README.md                            # Documentation and usage guide
└── .gitignore                           # Git ignore configuration
```

---

## 🛠️ Technology Stack

* **Core**: HTML5, Vanilla JavaScript (ES6+), React 18 UMD Runtime (`support.js`)
* **Styling**: Vanilla CSS, CSS Custom Properties (CSS Variables), Responsive Grid & Flexbox
* **Typography**: Google Fonts (*Cormorant Garamond*, *Instrument Serif*, *Manrope*, *Noto Naskh Arabic*, *Vazirmatn*)
* **Internationalization**: LTR / RTL bidirectional layout support & Persian translation dictionary

---

## 📄 License

Created for **Bella Gold Gallery**. All rights reserved.
