# Design System Specification

## 1. Color Palette

### Primary Colors
* **Primary Blue (Active states, large banners, FAB):** `#153C70`
* **Primary Blue Light (Secondary cards, subtle backgrounds):** `#F4F7FB`
* **Accent Dark (Deepest blue for contrast, like the profile card background):** `#0E2954`

### Neutral & Background Colors
* **App Background:** `#FFFFFF` (Pure White)
* **Surface/Card Background:** `#FFFFFF` (Usually white with a very subtle drop shadow, except for the light blue secondary cards)
* **Border/Divider:** `#E2E8F0` (Light grey for subtle outlines around empty state cards)

### Typography Colors
* **Text Primary (Headings, primary data):** `#1A202C` (Dark Slate)
* **Text Secondary (Subtitles, dates, meta-info):** `#718096` (Cool Grey)
* **Text Inverted (Text on primary blue backgrounds):** `#FFFFFF`

---

## 2. Typography

* **Primary Font Family:** `Poppins` (Used for headings, numbers, and primary UI elements to give a friendly, geometric feel).
* **Secondary Font Family:** `Inter` or `Roboto` (Used for smaller body text and metadata for maximum legibility).

### Font Weights & Sizing (Base 16px)
* **H1 (Screen Titles like "Hi Jenifer!"):** 24px (1.5rem), `Bold` (700)
* **H2 (Section Headers like "Ongoing Projects"):** 16px (1rem), `Semi-Bold` (600)
* **Body Primary (Card titles, list items):** 14px (0.875rem), `Medium` (500)
* **Body Secondary (Dates, roles, "view all"):** 12px (0.75rem), `Regular` (400)

---

## 3. Geometry & Borders (Border Radius)

The UI relies heavily on smooth, pronounced curves. 

* **Large Cards (Profile Header, Main Banners):** `24px` (`1.5rem`)
* **Medium Cards (Ongoing Projects, Folders, List Items):** `16px` (`1rem`)
* **Search Bar & Buttons:** `9999px` (Fully rounded/Pill-shaped)
* **Avatars & Floating Action Button (FAB):** `50%` (Perfect Circle)

---

## 4. Spacing & Layout Scale

The design uses a standard 8-point grid system. 

### Margins & Padding
* **Screen Edge Margins (Left/Right bounds of the app):** `24px` (`1.5rem`)
* **Section Gap (Vertical space between major sections):** `32px` (`2rem`)
* **Card Inner Padding (Large):** `20px` (`1.25rem`)
* **Card Inner Padding (Small/List Items):** `16px` (`1rem`)
* **Item Gap (Space between elements in a row/column):** `16px` (`1rem`)
* **Tight Gap (Space between an icon and its text):** `8px` (`0.5rem`)

### Layout Components
* **Bottom Navigation:** Fixed at bottom, height approx `80px`, items distributed evenly with `space-around`.
* **Floating Action Button (FAB):** Positioned absolute, centered over the bottom navigation bar, offset upwards by `24px`.