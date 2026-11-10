---
name: SignBridge ISL Portal
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#00311f'
  on-tertiary: '#ffffff'
  tertiary-container: '#004a31'
  on-tertiary-container: '#27c38a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  code-output:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a warm, academic, and hyper-accessible mobile-first interface for Indian Sign Language (ISL) gesture translation. It merges the rigor of academic AI research with the welcoming clarity of modern educational tools, steering entirely clear of cold enterprise SaaS tropes and harsh "developer hackathon" dark modes.

### Brand Personality & Emotional Impact
- **Empathetic & Inclusive:** Crafted to facilitate effortless communication between the Deaf/Hard of Hearing community, educators, and learners. The UI feels patient, inviting, and inherently supportive.
- **Academic Rigor Meets Modern Delight:** Communicates machine learning precision without intimidating technical jargon or visual clutter. Real-time inference feedback is reassuring and crisp.
- **Fluid & Responsive:** Prioritizes tactile, instant touch-first interactions optimized for handheld mobile devices, camera viewfinders, and rapid gesture parsing.

### Visual Style
A tailored blend of **Contemporary Educational Minimalism** and **Soft Tactile Card Design**:
- Crisp slate and off-white backdrops allow dynamic camera viewports and translated transcripts to stand out clearly.
- Generous tap targets (minimum 48×48px), high-contrast text pairings, and clearly delineated interactive surfaces guarantee WCAG AAA compliance.
- Visual feedback centers on high-visibility status indicators: emerald bounding outlines for positive gesture lock-in and soft warm amber for low-confidence inference disambiguation.

## Colors

The color system centers around a high-clarity academic palette designed for intense daylight legibility, outdoor mobile use, and video-heavy viewfinder clarity.

### Functional Palette Mapping
- **Primary Canvas Background (`#F8FAFC`):** Soft, non-glare off-white surface minimizing eye fatigue during prolonged sign practice sessions.
- **Surface Elevation (`#FFFFFF`):** Pure white container surfaces framing video inputs, translation card carousels, and reference dictionaries.
- **Deep Academic Indigo (`#1E3A8A` / `#1E293B`):** Anchors core actions, navigation bars, headers, and prominent button states. Offers assertive contrast against light backdrops.
- **Dynamic Slate / Sky Blue (`#3B82F6`, Tint `#E0E7FF`):** Powers secondary interactive elements, audio synthesis wave playback chips, and reference dictionary tags.
- **Inference Feedback (Emerald `#10B981` & Amber `#D97706`):**
  - **Verified Detection (`#10B981`, Container `#DCFCE7`):** Marks confident ISL gesture identification, skeletal tracking hand nodes, and completed translation buffers.
  - **Low Confidence / Recalibrating (`#D97706`, Container `#FEF3C7`):** Suggests lighting adjustments, hand orientation nudges, or camera distance warnings without displaying alarming error states.
- **Structural Lines (`#E2E8F0`):** Soft framing borders defining cards, navigation shells, and collapsible transcript trays.

## Typography

The typographic hierarchy prioritizes instantaneous scanning under variable lighting conditions. It pairs **Manrope** for grounded, humanistic display headers with **Inter** for neutral, utilitarian body copy and dynamic real-time text-to-speech outputs.

### Role Implementations
- **Translated Text Display (`display-lg` / `display-lg-mobile`):** Dedicated to the dynamic real-time output panel beneath the camera feed. High x-height and bold structural weights ensure users and conversational partners can read recognized signs at an arm's distance.
- **Section & Modal Titles (`headline-lg` / `headline-md`):** Manrope’s geometric curves impart a scholarly, friendly aesthetic to lesson titles, vocabulary sheets, and sign gesture categories (e.g., "Alphabets", "Emergency Signs", "Greetings").
- **Real-Time Confidence & Inference Captions (`label-md` / `label-sm`):** Inter with uppercase tracking applied to floating camera HUD pills (e.g., `CONFIDENCE 94%`, `CALIBRATING`).

## Layout & Spacing

The layout model is mobile-first, targeting high accessibility on hand-held smartphones while smoothly scaling to split-pane desktop and tablet learning environments.

### Viewport Structures
- **Mobile Handheld (360px – 639px):**
  - **Single Vertical Flow:** Edge-to-edge camera canvas at the upper half of the screen (4:3 aspect ratio, framed with `margin`), direct translation output tray immediately below, followed by gesture controls and audio speech synthesis triggers.
  - Base margins are set to `1rem` (16px) with zero horizontal margins on the primary camera viewfinder container to maximize sensor detection field-of-view.
- **Tablet / Split View (640px – 1023px):**
  - Transitions to a dual-pane layout: Fixed left column featuring real-time camera inference and hand mesh feedback; right column hosting the continuous transcript log, translation history, and quick-access ISL dictionary cards.
  - Gutter transitions to `1.5rem` (24px).
- **Desktop / Instructor Station (1024px+):**
  - Max container width locked to `1120px` centered with fluid margins (`3rem`). Provides three structured columns: Reference Sign Video Library (3 cols), Active Model Webcam View (5 cols), and Live English Transcript / Pronunciation Trainer (4 cols).

## Elevation & Depth

Visual hierarchy uses crisp, subtle physical layering rather than dramatic drops, preserving clarity and frame rates on mobile web browsers.

### Depth Stratification
- **Ground Floor (Base Canvas):** `#F8FAFC`. Houses the application shell, backings, and inert layout frames.
- **Surface Elevation (Cards & Sheets):** Pure white (`#FFFFFF`) backed by a razor-thin structural outline (`1px solid #E2E8F0`) and an ambient, low-spread drop shadow (`box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`).
- **Camera Viewport Layer:** Deep neutral overlay with high-contrast UI controls. Overlay badges on top of the live video stream utilize glass-backed surfaces (`rgba(15, 23, 42, 0.65)` backdrop-filter blur `8px`) with bright white typography for extreme legibility against varied background environments.
- **Floating Controls & Bottom Navigation Sheets:** Elevated above content with soft upward atmospheric dispersion (`box-shadow: 0 -4px 16px -2px rgba(15, 23, 42, 0.06)`). Modals and floating action buttons rely on `#0F172A` with 8% opacity spreads.

## Shapes

The design system incorporates rounded, friendly contours that reinforce an encouraging learning atmosphere while ensuring UI elements do not conflict with the organic silhouette of human hands during recognition.

### Radius Assignments
- **Core Cards & Panels:** Standardized at `rounded-2xl` (1rem / 16px) to yield soft corners that feel tactile and approachable.
- **Camera Viewport Canvas:** Clipped to `rounded-2xl` on standalone views, or edge-to-edge with `rounded-b-2xl` on full-bleed mobile headers.
- **Badges, Confidence Chips, & Primary Action Pills:** Full rounded pill radius (`rounded-full` / 9999px) to signal tapability and clearly distinguish status chips from content container cards.
- **Input Fields & Small Action Buttons:** Rounded at `rounded-xl` (0.75rem / 12px) for balanced proportions alongside standard body text heights.

## Components

### Buttons & Interactive Controls
- **Primary Action (e.g., "Start Recognition", "Speak Translation"):** Solid `#1E3A8A` background with `#FFFFFF` text. Touch targets strictly ≥ 48px height. Active states trigger a gentle transform scale `active:scale-[0.98]` and a shift to `#1E293B`.
- **Secondary / Action Toggles (e.g., "Flip Camera", "Clear Buffer"):** Solid `#E0E7FF` container with `#1E3A8A` text and subtle hover transition to `#DBEAFE`.
- **Floating Camera Action (Audio Playback):** Emerald accent `#10B981` button with a speaker icon, initiating immediate text-to-speech output of the recognized ISL sign string.

### Badges & Confidence Chips
- **High Confidence Badge:** Pill shape, `#DCFCE7` background, `#15803D` text, paired with a small 6px solid emerald dot indicator.
- **Low Confidence / Guide Badge:** Pill shape, `#FEF3C7` background, `#B45309` text, accompanied by an alert icon and guiding feedback (e.g., "Move hand closer").
- **Category & Grammar Tag:** Neutral slate pills (`#F1F5F9` background, `#475569` text) denoting grammatical parts of speech (Noun, Verb, Alphabet).

### Camera Viewfinder & Mesh Overlay HUD
- **Tracking Viewport:** Features a subtle `2px` inset outline on gesture detection: emerald (`#10B981`) when landmark tracking locks onto hands, transitioning to slate (`#94A3B8`) in idle search mode.
- **Landmark Hand Nodes:** High-visibility `#10B981` circles with a 2px `#FFFFFF` outer stroke to remain visible across all human skin tones and diverse indoor lighting.

### Real-Time Translation Output Card
- **Layout:** Dedicated `rounded-2xl` surface mounted directly below the video viewport.
- **Elements:** Large dynamic translated output text (`display-lg-mobile`), real-time sentence construction buffer, quick copy button, and a prominent "Play Audio" icon button powered by speech synthesis.

### Bottom Navigation Bar (PWA Mobile Shell)
- **Structure:** Fixed to bottom viewport, background `#FFFFFF` with top border `1px solid #E2E8F0`.
- **Layout:** 4 accessible touch anchors (Translate / Camera, Learn ISL Dictionary, History, Settings).
- **Active State:** Deep indigo icon and text (`#1E3A8A`) with a subtle `4px` top indicator pill bar; inactive state in muted slate (`#64748B`).

### Form Elements & Text Input Fields
- Inputs feature `#FFFFFF` background, `1.5px solid #E2E8F0`, and transition to `#3B82F6` focus ring (`ring-2 ring-blue-500/20`) on keyboard activation.