# Internal Dashboard v2. 0

A modern knowledge management system for teams.

## Quick Start

1. Open `index.html` in browser
2. Press **Ctrl+E** three times to unlock Admin Mode
3. Click "Add Card" to create content
4. Start organizing! 

## Keyboard Shortcuts

- Ctrl+E (×3) = Admin Mode
- Ctrl+K = Search
- F = Flashcard mode
- G = Grid mode
- L = List mode
- ← → = Navigate (flashcard)
- Space = Auto-play

## Features

- Multi-language (日本語, 中文, English)
- Dark/Light theme
- Flashcard mode
- Real-time search
- Priority & tags
- Expiry tracking
- Auto-save

## Card Types

1. **URL** - Web links (http://...)
2. **Code** - Code snippets
3. **Memo** - Text notes
4. **List** - Bullet lists

## Data Management

- Auto-saves every 30 seconds
- Export as HTML file
- Export/Import as JSON
- Reset to initial state

## Project Structure
dashboard/ ├── index.html ├── css/ (5 files) ├── js/ (8 files) └── data/ (sample data)

## Usage Tips

- Use Ctrl+K for fast search
- Pin important cards with ⭐
- Use tags for organization
- Set expiry dates for reminders
- Switch to Flashcard mode (F) for studying

## Browser Support

Chrome, Firefox, Safari, Edge (latest versions)

## Collaboration & Sync (GitHub ↔ Gitee)

This repository lives on two platforms:

- GitHub (primary development): https://github.com/prelove/kanban
- Gitee (collaboration in mainland China): https://gitee.com/prelove/kanban

How we work:

- On either platform: feature branch → pull request → merge into `main`. Never push directly to `main`, never force-push.
- The two `main` branches are kept in sync incrementally: pull the other side's latest, resolve any conflicts locally, push to your own side first, then sync the merged result to the other side (a clean fast-forward).
- A full overwrite (cover) is used only for backups or one-off seeding, never for day-to-day collaboration.

## License

Internal use only