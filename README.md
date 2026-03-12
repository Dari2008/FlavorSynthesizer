# Flavor Synthesizer
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tone.js](https://img.shields.io/badge/Tone.js-Audio-orange)
![License](https://img.shields.io/badge/License-MIT-green)

![Creating of a Dish](./readmeImgs/showCreationOfDish.gif)


🌐 **Live Demo:** https://flavorsynth.frobeen.com/


## Table of Contents
- [Logo](#logo)
- [Description](#description)
- [Features](#features)
- [Requirements](#requirements)
- [Screenshots](#screenshots)
- [Controls](#controls)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Planned Features](#planned-features)
- [License](#license)


## Description
Flavor Synthesizer is a browser-based music sandbox game where players compose playable “dishes” by arranging flavors on a timeline.
Each flavor represents a musical element that can be positioned and resized using drag & drop.
A selected main flavor (Spicy / Sweet / Salty / Savory / Bitter / Sour) defines the harmonic identity of the dish.

Dishes can be:
- Shared via code
- Shared via URL
- Forked by other users
- Exported as an AI-generated image matching the flavor combination


## Logo
I finally added a logo:

![Logo](./public/logo/Logo.png)

It’s a machine where glass tubes at the top filled with flavors are placed then they come mixed out at the bottom.

## Features
- Share dishes via code or URL
- Generate AI-based artwork from flavor combinations
- Fork and remix other users' dishes
- Local and server-side dish storage
- User accounts

## Requirements
- Modern browser (Chrome, Edge, Firefox)
- Minimum width: 600px
- Minimum height: 500px
- Audio enabled

## Screenshots
### Tutorials
![Tutorials](./readmeImgs/tutorials.png)

Tutorials are everywhere in the game.

#### Main Menu
![Main Menu](./readmeImgs/mainMenu.png)

Entry point of the application.

#### Dish List
![Dish List](./readmeImgs/dishList.png)

Overview of locally and remotely stored dishes.

### Restaurant
![Restaurant](./readmeImgs/restaurant.png)

List of all public dishes.

#### Open a Shared Dish
![Open Shared Dish](./readmeImgs/openSharedDish.png)

Interface for loading shared dishes.

#### Sharing a Dish
![Share a Dish](./readmeImgs/sharingDish.png)

Step 1 of the sharing workflow. The second step allows authenticated or anonymous publishing.

#### Creating a Dish / Main Flavor Selector
![Creating a Dish - Main Flavor Selector](./readmeImgs/creatingDish-mainFlavor.png)

Main flavor selection screen.

#### Creating a Dish / Editor
![Creating a Dish - Editor](./readmeImgs/creatingDish-editor.png)

Timeline editor interface.

#### Downloading a Dish
![Downloading a Dish](./readmeImgs/downloadingDish.png)

Download progress indicator for remote dishes.


## Controls
### Editor
- Drag & drop flavors
- Drag flavor → move horizontally
- Drag edge of flavor → resize
- Shift + Wheel → horizontal scroll
- Ctrl + Wheel → zoom
- Ctrl + Click → multi-select
- Touch gestures supported
- Ctrl + Z / Y → Undo / Redo
- Drag on the timeline → start playback from there
- Long press on Flavor -> Open menu

### Dish List
- Right Click → Menu

## Tech Stack
- React 19 + TypeScript
- Vite (build tool)
- Tone.js (audio engine)
- SCSS
- Python (asset generation & tooling)

## Architecture
Flavor Synthesizer is built around a timeline-based audio engine using [Tone.js](https://github.com/Tonejs/Tone.js).

### Core Data Model
Each Dish is composed of:
```typescript
type Dish = {
  synthLines: SynthLine[]
  masterVolume: number
  flavorVolume: number
  mainFlavorVolume: number
  uuid: string
}
```

```typescript
type SynthLine = {
  flavors: Flavor[]
  volume: number
  isMuted: boolean
  isSolo: boolean
  uuid: string
}
```

```typescript
type Flavor = {
  flavorId: string
  from: number      // start time (seconds or ticks)
  to: number        // end time
  uuid: string
}
```

States are managed using React Contexts.


## Installation
  ### Client
  #### Run
  ```bash
  npm install
  npm run dev
  ```
  #### Build
  ```bash
  npm run build
  ```
  ### Server
  Currently I can't publish the server since it would be a security risk but I plan on publishing it once I rewrote it in node.js and fixed all security risks.
  There is however the Node version of the server published [Server](https://github.com/Dari2008/FlavorSynthesizerServer/)

## Project Structure
- src/          - Application source code  
  - audio/      - Music logic
  - components/ - React UI components
  - contexts/   - Global state management  
- public/       - Static assets (images, audio, sprites)  


## Planned Features
- [x] Public dish publishing & discovery
- [x] Tutorial System
- [ ] Experience (XP) system
- [ ] Achievement system
- [ ] Real-time collaborative composition

## License
MIT License