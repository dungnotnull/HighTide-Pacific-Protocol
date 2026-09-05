# Tides of Debt: A Pacific Climate Story

**Pacific Dataviz Challenge 2025 - Interactive Category Entry**

An interactive scrollytelling data visualization exploring the disproportionate climate impact on Pacific Island Countries (PICs) despite their minimal contribution to global emissions.

## Overview

This single-page web application tells the story of how Pacific Island nations—responsible for the lowest greenhouse gas emissions—face the most severe consequences of climate change. Through interactive data visualizations and scroll-driven storytelling, visitors experience the causal chain from emissions to sea-level rise to agricultural consequences.

**Thesis:** *The tide that keeps rising has already been paid for—just not by the people it's rising on.*

### Narrative Structure

The story unfolds across four main sections:

1. **Hero** – Opening thesis statement with ambient visual elements
2. **Cause** – CO₂ emissions & temperature trends: contrasting PICs against top global emitters
3. **Reality** – Sea level rise and shoreline displacement across the Pacific
4. **Consequence** – Impact on agriculture and basic needs (WASH: Water, Sanitation, and Hygiene)
5. **The Climate Triangle** – A 3D composition analyzing the intersection of emissions, sea level rise, and clean water access

## Features

- **Scroll-driven storytelling** with Intersection Observer-based step triggers
- **Interactive D3.js & Plotly.js visualizations** including:
  - World map with country emissions bubbles
  - Per-capita CO₂ emissions comparison chart
  - Sea level trend visualization with Pacific average
  - Clean Water & Sanitation (WASH) rankings and dot plots
  - 3D Climate Triangle scatter plot
- **Country modal** with detailed year-over-year data (click any country on the map)
- **Year-by-year animation** with auto-play from 1850→2025
- **Responsive design** optimized for desktop and mobile viewing
- **Accessibility-focused** with ARIA labels and keyboard navigation
- **Static export** for fast, serverless deployment on Vercel

## Tech Stack

- **Framework:** Next.js 15.5+ (React 19) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Visualization:** D3.js v7 for custom charts, Plotly.js (via react-plotly.js) for 3D/complex scatter plots, TopoJSON for map data
- **Fonts:** Fraunces (display), IBM Plex Mono (monospace), Public Sans (body)
- **Deployment:** Vercel (static export)

## Project Structure

```
/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Single-page entry point
│   └── globals.css         # Global styles and design tokens
├── components/
│   ├── sections/           # Story sections
│   │   ├── Hero.tsx
│   │   ├── Cause.tsx
│   │   ├── CauseMap.tsx
│   │   ├── Result.tsx
│   │   └── [other sections]
│   ├── charts/            # Reusable chart components
│   ├── ui/                # UI components (modal, scroll rail, etc.)
│   └── lib/               # Utility functions and hooks
├── data/                  # JSON data files (cleaned, ready to use)
│   ├── ghg_per_capita.json
│   ├── temperature_anomaly.json
│   ├── sea_level.json
│   └── SOURCES.md         # Data source citations
├── hooks/                 # Custom React hooks
├── lib/                   # Helper functions
└── types/                 # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dungnotnull/rawHapri-Pacific-dataviz-storytelling.git
cd rawHapri-Pacific-dataviz-storytelling
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm run start
```

The static export will be generated in the `out/` directory, ready for deployment.

## Data Sources

All data is sourced from publicly available climate and development databases:

- **CO₂ Emissions:** Pacific Data Hub, Our World in Data
- **Temperature Anomalies:** World Bank Climate Change Knowledge Portal
- **Sea Level:** Pacific Data Hub CLIMATE_CHANGE_SEA_INDICATORS
- **WASH (Water, Sanitation, Hygiene):** WHO/UNICEF Joint Monitoring Programme
- **Country Coordinates:** PIC countries geographic data

See `data/SOURCES.md` for complete source listings, access dates, and licensing information.

## Design Decisions

### Visual Language

- **Color Palette:**
  - Ocean tones (`--ocean-deep`, `--ocean-mid`) for backgrounds
  - Coral (`--coral`) for emissions/alert content
  - Lagoon (`--lagoon`) for temperature data
  - Foam (`--foam`) for text on dark backgrounds
  - Ink (`--ink`) for text on light backgrounds

- **Typography:**
  - Fraunces: Display headlines (strong character)
  - IBM Plex Mono: Data labels, code-style elements
  - Public Sans: Body text, UI elements

### Interaction Patterns

- **Scroll-driven triggers** using Intersection Observer API
- **Sticky visual panels** with scrolling text steps
- **Modal detail views** for country-specific exploration
- **Year animation** with manual step controls
- **Progress rail** (TideRail) showing scroll position

### Performance Considerations

- Static export for zero server dependency
- D3.js charts render once on mount with ResizeObserver
- **Advanced Lazy Loading:** Heavy visualization libraries (like Plotly.js) are dynamically imported and deferred using `IntersectionObserver`, ensuring zero impact on the initial page load and Hero animation.
- Optimized images with Unsplash CDN
- CSS-based animations where possible

## Accessibility

- Semantic HTML structure with proper heading hierarchy
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on interactive elements
- Text alternatives for all visualizations
- Sufficient color contrast (WCAG AA compliant)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Competition Context

This entry was developed for the **Pacific Dataviz Challenge 2025**, organized by the Pacific Community (SPC) and partners. The competition emphasizes:

- Clear storytelling with Pacific data
- Original design and technical execution
- Credible data sourcing and methodology
- Interactive/engaging presentation

Our approach draws inspiration from proven scrollytelling techniques while maintaining a unique visual identity and narrative voice specific to the Pacific climate experience.

## Development Notes

### Adding New Sections

1. Create a new component in `components/sections/`
2. Add data files to `data/` with entries in `SOURCES.md`
3. Import and add to the section sequence in `app/page.tsx`
4. Update scroll marks (MARKS) in `app/page.tsx` for progress rail

### Working with Charts

- Charts use the imperative D3 pattern in `useEffect` with `useRef`
- Data is passed as props, never fetched inside chart components
- All charts support empty data states with graceful fallbacks
- Responsive sizing via shared `useDimensions` hook

### Data Updates

To update with new data:
1. Ensure JSON structure matches existing types in `types/index.ts`
2. Replace files in `data/` directory
3. Update `data/SOURCES.md` with new source information
4. No component changes required if data shape is preserved

## License

This project is developed for the Pacific Dataviz Challenge. Data sources retain their original licenses as specified in `data/SOURCES.md`.

## Credits

- **Concept & Development:** [Your Name]
- **Data Sources:** Pacific Data Hub, World Bank CCKP, Our World in Data
- **Techniques Inspired By:** "Paying the Heaviest of the Carbon Debt Never Incurred" (2025 Pacific Dataviz Challenge Winner)

## Contact

For questions about this entry, please contact me or open an issue on GitHub.

---

**Built with Next.js, D3.js, and a commitment to telling Pacific climate stories with integrity and impact.**
