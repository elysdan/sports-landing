# Sports Billboard & Live CMS Platform

An enterprise-grade, real-time digital signage and Content Management System (CMS) designed specifically for sports betting operations, live event broadcasting, and retail display networks. 

This platform enables live operators to design, scale, position, and publish high-impact interactive billboard displays containing real-time scoreboards, betting odds, promotional media, and active widgets via a drag-and-drop admin panel.

---

## Key Features

*   **Dynamic Digital Signage Display (`DisplayView`)**:
    *   Designed for 1920x1080 (16:9), 1080x1920 (9:16 vertical), and 1:1 (9x9) aspect ratio billboard monitors.
    *   Responsive vector scaling using container queries (`cqi`) and CSS properties to guarantee zero text overflows regardless of physical size.
    *   A dynamic vertical layout packer that stacks active billboard blocks automatically on portrait displays.
*   **Interactive Drag-and-Drop Blueprint Builder (`AdminPanel`)**:
    *   Real-time position editing, resizing, and alignment of widgets on an interactive grid canvas.
    *   Live side-by-side billboard draft preview updating instantly as edits are made.
    *   Modular template saving, loading, and versioned rollback options.
*   **Real-Time Synchronization (SSE)**:
    *   Powered by Server-Sent Events (SSE) to push instant content updates, odds changes, and layout shifts to active display terminals in less than 50ms without polling.
*   **Granular Design Customization System**:
    *   Independent background color, text color, scale factors, and border adjustments per module.
    *   Supports custom text inputs or decorative vector stickers (`sticker1.png`, `sticker2.png`, `sticker3.png`) with bouncy hover micro-animations.

---

## Module Catalog

The platform is built around a flexible, component-based widget system:

1.  **Scoreboard (`scoreboard`)**:
    *   Displays active match scores, flag graphics, team codes, and live statuses (e.g. *EN VIVO*, *TIEMPO EXTRA*).
2.  **Apuesta Card (`apuesta`)**:
    *   Standard sports betting card (1X2 Mode, 2 Opciones, or Ganador Único).
    *   Includes configurable country selectors, custom text codes, and independent font size scales for cuotas (odds values).
3.  **Apuesta Sí/No (`pregunta`)**:
    *   Betting option block with a centered, styled header.
    *   Adjustable title size, text color, and title background.
    *   Custom Yes/No text types or sticker selections (e.g. thumbs up, thumbs down) positioned either stacked (vertical) or side-by-side (horizontal) with odds values to optimize empty display space.
4.  **Próximo Partido (`upcoming`)**:
    *   Schedule widget showing upcoming matches, kickoff times, optional VS separators, and live-adjustable betting numbers side-by-side with team names.
5.  **Multimedia Content (`media`)**:
    *   Renders responsive promotional images, vector flags, and looping MP4/WebM videos.
    *   Includes text overlay options, object-fit settings (`contain` / `cover`), and brand overlay borders.

---

## Technology Stack

*   **Frontend**: React (v19), Vite, CSS Variables, HTML5 Semantic Elements.
*   **Backend**: Node.js, Express, Server-Sent Events (SSE) client sync.
*   **Database/Storage**: MySQL, SQLite & LocalStorage sync.
*   **Design & Theme**: Premium dark theme with gold accents, HSL harmonious gradients, Inter/Outfit typography, and elastic CSS micro-animations.

---

## Project Structure

```text
├── backend/                   # Node.js + Express backend server
│   ├── seedData.js            # Initial billboard configuration data
│   ├── router.js              # API Endpoints (CMS layout, draft updates, teams)
│   ├── controllers/           # SSE, CMS Data, and Media upload controllers
│   └── database.sqlite        # SQLite backend database storage
├── public/                    # Static assets
│   ├── paises/                # Local country SVG flags
│   ├── sticker1-3.png         # Vector stickers for question modules
│   └── logo_GANA_Y_SIN.webp   # Brand assets
├── src/                       # Frontend React Application
│   ├── components/            # Shared UI parts (History, Templates, User Manager)
│   ├── context/               # CMSContext providing state and socket connections
│   ├── styles/                # CSS themes, grids, and display specifications
│   │   ├── variables.css      # Core HSL color design tokens
│   │   ├── display.css        # Billboard module responsive styles
│   │   └── admin.css          # Control panel stylesheet
│   ├── views/                 # View Screens
│   │   ├── AdminPanel.jsx     # CMS Control Panel UI
│   │   └── DisplayView.jsx    # Live Billboard Renderer
│   ├── App.jsx                # Router & App entry point
│   └── main.jsx               # Render loop anchor
├── server.js                  # Production server bootstrapper
└── package.json               # Package dependencies & scripts
```

---

## Setup & Installation

### Prerequisites
- Node.js (v22 or higher)
- npm or yarn

### 1. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 2. Start the Development Servers
Launch both the Vite frontend dev server and the backend SSE api server concurrently:
```bash
npm run dev
```

### For production environments
```bash
npm run build

npm run start
```


The application will be accessible at:
*   **Client Billboard Screen**: `http://localhost:5173`
*   **Draft Preview Mode**: `http://localhost:5173/?draft=true`
*   **CMS Admin Control Panel**: `http://localhost:5173/admin`

---

## Role-Based Access Control

The CMS features three pre-configured operational roles:
1.  **Editor (General)**: Full rights to add/remove modules, change layouts, and adjust content on draft configurations.
2.  **Diseñador (Visual)**: Restricted to visual customizations (colors, font scaling, text styling, and media uploading).
3.  **Administrador (Admin)**: Full administrative rights including layout publishing (`Publicar`), draft approval, template deletion, and user permissions management.
