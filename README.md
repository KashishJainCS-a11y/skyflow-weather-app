# 🌤️ SkyFlow - Premium Weather Experience

A stunning, highly-polished single-page Weather Web Application built from scratch using **Vanilla HTML5, CSS3, and JavaScript**. 

SkyFlow provides a premium, immersive weather dashboard with dynamic HSL gradient themes that change according to the weather (Clear, Cloudy, Rainy, Snowy, Stormy, Night), complete with custom keyframe-animated SVG weather icons, detailed metrics (apparent temperature, humidity indices, wind directions with compass rotation, UV index safety, pressure), and Apple-style daily temperature range bars.

##  Live Preview
The app runs entirely in the browser and connects directly to the free, public **Open-Meteo API** (requiring no API keys or registration).

---

##  Features

- **Dynamic Weather Themes**: The interface background transitions smoothly through custom HSL gradients based on the current weather condition of the loaded city.
- **Micro-Animations**: All weather representations (spinning suns, swaying moons, falling raindrops, spinning snowflakes, and flashing lightning bolts) are styled inline with high-performance CSS animations.
- **Search Auto-Suggestions**: Real-time Geocoding search suggestions as you type, powered by Open-Meteo Geocoding.
- **Smart Geolocation**: Instantly queries browser location coordinates to load local weather (using Nominatim for reverse city lookup).
- **Apple-Style Forecast Bars**: 7-day forecast includes visual temperature range indicators scaled relative to the week's extremes.
- **Interactive Details**: Compass indicator dynamically rotates to show wind direction, UV indices display safety hazard alerts, and humidity cards display sticky-index descriptions.
- **Zero Configuration**: No dependencies, build steps, or API keys needed. Works immediately in any browser environment.

---

##  Tech Stack

- **Markup**: HTML5 (Semantic Structure)
- **Styling**: Vanilla CSS3 (Custom Properties, Glassmorphism, CSS Transitions, keyframe animations, Flexbox & Grid)
- **Logic**: Vanilla ES6 JavaScript (Fetch API, LocalStorage caching, Geolocation API, Date/Time formatting)
- **APIs**: [Open-Meteo API](https://open-meteo.com/) (Weather & Geocoding), [Nominatim OSM](https://nominatim.org/) (Reverse Geocoding)

---

##  How to Run Locally

Since this is a vanilla web application, you do not need to install complex node dependencies. 

### Option 1: Direct File Open
Simply double-click the `index.html` file to open it directly in any web browser.

### Option 2: Local HTTP Server (Recommended)
If you want geolocation services to work correctly (browsers require a secure context or `localhost` to allow GPS coordinates access), serve the files using a lightweight server:

**Using Node.js / npx:**
```bash
npx http-server -p 8000
```

**Using Python:**
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.
