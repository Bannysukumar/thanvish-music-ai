# Thanvish AI Music - Comprehensive Design Guidelines

## Design Approach

**Strategy: Cultural-Modern Hybrid**
Blend contemporary web application patterns (Spotify's music interfaces, Duolingo's learning mechanics, Notion's content organization) with visual elements that honor Indian classical music traditions. The design should feel sophisticated yet approachable, balancing technical functionality with cultural reverence.

**Core Principle**: Create an immersive platform where technology serves tradition - modern interfaces that make classical music accessible without diminishing its depth and heritage.

---

## Typography System

**Font Families** (Google Fonts):
- **Primary**: Lora (serif) - for headings and cultural content, conveying elegance
- **Secondary**: Inter (sans-serif) - for UI elements, body text, and technical content
- **Accent**: Noto Sans Devanagari - for Hindi/Sanskrit terminology

**Hierarchy**:
- Hero Headlines: Lora, 4xl-6xl (64-72px desktop)
- Section Headers: Lora, 3xl-4xl (48-56px desktop)
- Subsections: Inter Bold, xl-2xl (24-32px)
- Body Text: Inter Regular, base-lg (16-18px)
- UI Labels: Inter Medium, sm-base (14-16px)
- Captions: Inter Regular, xs-sm (12-14px)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24, 32
- Micro spacing (within components): 2, 4
- Component padding: 6, 8, 12
- Section spacing: 16, 20, 24, 32
- Large gaps: 32 for vertical section breaks

**Containers**:
- Full-width sections with inner `max-w-7xl mx-auto px-6`
- Content sections: `max-w-6xl`
- Reading content: `max-w-4xl`

---

## Core Components

### Navigation
**Main Navigation**: Sticky header with translucent backdrop blur
- Logo left, main navigation center, CTA right
- Navigation items: Home, About, Generator, Learn, Blog, Contact
- Desktop: Horizontal menu with hover underline indicators
- Mobile: Hamburger menu with slide-in drawer
- Include subtle border-bottom separator

### Hero Section (Home Page)
**Layout**: Full-width split hero with asymmetric composition
- Left 55%: Large headline, value proposition, dual CTA buttons
- Right 45%: Large hero image showing traditional instruments or musicians in practice
- Height: 85vh on desktop, auto-height on mobile (stack vertically)
- Background: Subtle gradient overlay with cultural pattern texture at very low opacity

### Music Generator Interface
**Control Panel Design**: Dashboard-style interface inspired by music production tools
- Left Sidebar (300px): Preset browser and saved compositions list
- Main Area: Large parameter controls in card-based grid
  - Raga selector: Dropdown with descriptions and audio previews
  - Tala selector: Visual rhythm pattern display with clickable beats
  - Instrument selection: Icon grid with instrument names (Sitar, Tabla, Flute, Veena, etc.)
  - Tempo slider: Large interactive slider (40-200 BPM)
  - Mood selector: Tag-based multi-select chips
- Bottom Bar: Waveform visualization, playback controls, download button
- Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` for parameter cards

### Learning Module Cards
**Card Structure**: Elevated cards with hover lift effect
- Thumbnail image area (16:9 ratio) showing notation or musical concept
- Badge indicator: Beginner/Intermediate/Advanced
- Title and brief description
- Progress bar showing completion percentage
- Lesson count and duration
- Two-column layout on desktop (`md:grid-cols-2 lg:grid-cols-3`)

### Teacher Dashboard
**Layout**: Multi-panel dashboard inspired by Linear/Notion
- Top Stats Bar: 4-column grid showing key metrics (Active Students, Lessons Completed, Avg. Progress, Recent Activity)
- Main Content: Tabbed interface
  - Students Tab: Sortable table with student names, progress bars, last activity
  - Lessons Tab: Drag-and-drop lesson planner with calendar view
  - Feedback Tab: Message thread interface
- Right Sidebar (collapsed/expandable): Quick actions and notifications

### Blog Layout
**Magazine-Style Grid**: Staggered card layout
- Featured post: Large card spanning 2 columns at top
- Standard posts: Mix of full-width and 2-column cards
- Post cards include: Category tag, featured image, title, excerpt, author info, read time
- Sidebar: Categories filter, popular posts, subscribe form

### Contact & Support
**Two-Column Split**:
- Left (60%): Contact form with name, email, subject, message fields
- Right (40%): 
  - Support channels (email, phone)
  - Office hours
  - FAQs accordion
  - Social media links

---

## Interaction Patterns

**Buttons**:
- Primary CTA: Large rounded buttons (px-8 py-4, text-lg) with hover scale (scale-105)
- Secondary: Outlined style with same sizing
- Icon buttons: Circular (w-12 h-12) with centered icons
- Buttons over images: Backdrop blur effect (backdrop-blur-md bg-white/90)

**Cards**: 
- Elevated shadow (shadow-lg) with subtle border
- Hover: Translate up slightly (-translate-y-1) with increased shadow (shadow-xl)
- Padding: p-6 for standard cards, p-8 for larger feature cards

**Forms**:
- Input fields: Rounded borders, focus ring with offset, ample padding (px-4 py-3)
- Labels: Above inputs, medium weight
- Helper text: Small text below inputs
- Error states: Red accent border and text

**Music Controls**:
- Play/Pause: Large circular button (w-16 h-16)
- Waveform: Full-width visualization with playhead
- Volume/Tempo sliders: Custom styled with large thumbs for easy interaction

---

## Images Strategy

**Hero Section**: Large, high-quality image of traditional Indian classical musicians or instruments in an authentic learning/performance setting. Should convey warmth, tradition, and expertise.

**About Page**: 
- Team photo or founder portrait
- Cultural imagery showing Hindustani and Carnatic traditions (veena, sitar, tabla)
- Split images showcasing both music traditions side by side

**Learning Modules**: Thumbnail images for each lesson showing musical notation, instrument close-ups, or conceptual illustrations

**Blog Posts**: Featured images for each article (minimum 1200x630px)

**AI Generator**: Background pattern or subtle cultural motif (not photograph) to keep focus on controls

---

## Accessibility & Responsive Behavior

- Maintain WCAG AA contrast ratios throughout
- All interactive elements minimum 44x44px touch targets
- Consistent focus indicators on all interactive elements
- Mobile breakpoints:
  - sm: 640px (single column layouts)
  - md: 768px (2-column layouts)
  - lg: 1024px (full multi-column layouts)
- Typography scales down: 3xl → 2xl → xl on mobile
- Section padding: py-32 (desktop) → py-20 (tablet) → py-12 (mobile)

---

## Special Features

**Audio Player Component**: Embedded player with:
- Album art area (square)
- Track title and metadata
- Playback controls (previous, play/pause, next)
- Progress bar with time indicators
- Volume control

**Interactive Rhythm Visualizer**: For Tala learning
- Visual beat grid showing rhythm patterns
- Clickable beats that play corresponding sounds
- Highlighting of active beats during playback

**Progress Indicators**: Throughout learning modules
- Circular progress rings for overall completion
- Linear progress bars for individual lessons
- Milestone badges for achievements

---

## Icon Library
**Font Awesome 6** (via CDN) for comprehensive icon coverage including music-specific icons (fa-music, fa-drum, fa-guitar, etc.)

---

This design creates a sophisticated, culturally-grounded platform that honors classical music traditions while leveraging modern web capabilities to make learning accessible and engaging.