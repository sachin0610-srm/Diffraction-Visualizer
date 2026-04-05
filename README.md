# 🔬 Diffraction Pattern Visualizer

> **QtHack04 — Track 01: Applied Optics & Photonics | Problem #03**
> Team **Null_Point** · SRM Institute of Science and Technology, Kattankulathur

An interactive, browser-based simulator for **single-slit and multi-slit (grating) diffraction** built with physically accurate wave optics equations. Adjust wavelength, slit geometry, and screen distance in real time and watch the intensity pattern, 3D surface, phasor diagram, and live equations all update instantly — no installation required.

---

## 🌐 Live Demo

> Open `index.html` directly in any modern browser, or deploy to Vercel in one click (see [Deployment](#deployment)).

---

## ✨ Features

### Core Simulation
| Feature | Description |
|---|---|
| **Single-Slit Mode** | Fraunhofer diffraction using `I(θ) = I₀[sin(β)/β]²` |
| **N-Slit Grating Mode** | Full grating equation with diffraction envelope × interference factor |
| **Real-Time Updates** | All plots refresh on every slider change via `requestAnimationFrame` |
| **1200-point resolution** | High-resolution angle sweep for smooth, accurate patterns |

### Visualizations (4 Tabs)
| Tab | What You See |
|---|---|
| 📈 **2D Intensity** | Intensity vs. diffraction angle with annotated maxima (▼) and minima (dashed lines) |
| 🌐 **3D Surface** | 2D intensity map on observation screen rendered as an interactive Plotly surface |
| ⚖️ **Comparison** | Overlay two independent parameter sets (Set A vs Set B) on one chart |
| 🔄 **Phasor Diagram** | N-phasor chain showing constructive/destructive interference at any chosen angle |

### Interactive Controls
- **Wavelength λ** — 380 nm to 700 nm with physically accurate RGB color swatch and spectrum-gradient slider track
- **Slit Width a** — 0.5 μm to 20 μm
- **Slit Spacing d** — 1 μm to 50 μm (grating mode)
- **Number of Slits N** — 2 to 20 (grating mode)
- **Screen Distance L** — 0.1 m to 5 m
- **Phasor Angle θ** — 0° to 30° observation angle for phasor tab

### Educational Tools
- **Live LaTeX Equations** — MathJax renders the full diffraction formula with your current parameter values substituted in real time
- **Learn Physics Modal** — Full explanation of single-slit, grating diffraction, and phasor diagrams with key formulas
- **Export PNG** — Download the currently active plot as a PNG image
- **Comparison Mode** — Side-by-side overlay with independent Set B parameters (different wavelength, slit count, etc.)

---

## 🧮 Physics Engine

All physics is implemented in `js/physics.js` using numerically stable formulations.

### Single-Slit Diffraction (Fraunhofer)

$$I(\theta) = I_0 \left[\frac{\sin\beta}{\beta}\right]^2 \qquad \beta = \frac{\pi \, a \sin\theta}{\lambda}$$

**Minima at:** $a \sin\theta = m\lambda \quad (m = \pm1, \pm2, \ldots)$

### N-Slit Grating Diffraction

$$I(\theta) = I_0 \underbrace{\left[\frac{\sin\beta}{\beta}\right]^2}_{\text{diffraction envelope}} \times \underbrace{\left[\frac{\sin(N\delta/2)}{N\sin(\delta/2)}\right]^2}_{\text{interference factor}} \qquad \delta = \frac{2\pi \, d \sin\theta}{\lambda}$$

**Principal maxima at:** $d \sin\theta = m\lambda$

### Numerical Stability
- `sinc(x)` returns `1.0` exactly at `x ≈ 0` (avoids `0/0`)
- Interference factor uses L'Hôpital limit at `denominator < 1e-10`
- 3D surface uses 2D product of vertical single-slit envelope × horizontal grating pattern

---

## 🗂️ Project Structure

```
Diffraction-Visualizer/
├── index.html          # Main app shell — layout, sliders, tabs, educational modal
├── css/
│   └── style.css       # Dark-themed UI, responsive layout, toggle switches
├── js/
│   ├── app.js          # App entry point — state management, slider binding, update loop
│   ├── physics.js      # Physics engine — intensity calculations, phasors, maxima/minima detection
│   ├── plots.js        # Plotly rendering — 2D chart, 3D surface, comparison, phasor diagram
│   ├── color.js        # Wavelength → RGB (Dan Bruton CIE approximation), spectrum gradient
│   └── equations.js    # Live LaTeX generation with current parameter values via MathJax
├── vercel.json         # Zero-config Vercel deployment
└── README.md
```

---

## 🚀 Getting Started

### Option 1 — Open Directly (No Install)
```bash
git clone https://github.com/sachin0610-srm/Diffraction-Visualizer.git
cd Diffraction-Visualizer
# Open index.html in Chrome, Firefox, or Edge
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

> **Note:** Because the app uses ES modules (`type="module"`), open it via a local server if you encounter CORS issues:
> ```bash
> python -m http.server 8000
> # Then visit http://localhost:8000
> ```

### Option 2 — VS Code Live Server
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

---

## 🌍 Deployment

The project is pre-configured for **Vercel** with zero build steps.

```bash
npm install -g vercel
vercel --prod
```

Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deployments on every push.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES Modules) |
| Visualization | [Plotly.js](https://plotly.com/javascript/) v2.27 — 2D charts + 3D surface |
| Math Rendering | [MathJax](https://www.mathjax.org/) v3 — live LaTeX equation display |
| Styling | Pure CSS — dark theme, CSS custom properties for dynamic accent colors |
| Deployment | [Vercel](https://vercel.com) — static site, zero-config |

No build tools, no bundler, no npm dependencies — just open and run.

---

## 📐 Key Parameters Reference

| Symbol | Meaning | Range |
|---|---|---|
| λ | Wavelength of light | 380–700 nm (visible spectrum) |
| a | Slit width | 0.5–20 μm |
| d | Grating period (slit spacing) | 1–50 μm |
| N | Number of slits | 1 (single) or 2–20 (grating) |
| L | Screen distance | 0.1–5 m |
| θ | Diffraction angle | ±30° (displayed range) |

---

## 👥 Team

| Name | Role |
|---|---|
| Sachin Kumar | Team Lead, Physics Engine, Architecture |
| Muhammed Saleem. B | Visualization & Plotly Integration |
| Dhanvanth Shreeganth | UI/UX & Educational Overlay |
| Gokul Athithyan | Color Mapping & Equation Display |

**Team Name:** Null_Point  
**Department:** CINTEL  
**Institution:** SRM Institute of Science and Technology, Kattankulathur  
**Hackathon:** QtHack04 — Track 01: Applied Optics & Photonics | Problem #03

---

## 📚 References

- Hecht, E. — *Optics* (5th Ed.), Chapters 10–11: Diffraction
- Born, M. & Wolf, E. — *Principles of Optics*, Chapters 8–9
- Dan Bruton — Wavelength-to-RGB approximation (color.js)
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [MathJax Documentation](https://docs.mathjax.org/)

---

## 📄 License

MIT License — free to use, modify, and distribute with attribution.
