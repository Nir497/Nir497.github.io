# Repository Guidelines

## Project Structure & Module Organization
This repository is a static portfolio site for GitHub Pages.
- `index.html`: main page layout and project card template.
- `assets/css/styles.css`: all site styling and responsive nav behavior.
- `assets/js/app.js`: client-side rendering, search/filter logic, and data loading.
- `assets/data/projects.json`: source of truth for all project metadata.
- `assets/images/`: screenshots/gallery images used by project cards.
- `assets/downloads/`: downloadable release files referenced in `projects.json`.
- `.nojekyll`: ensures GitHub Pages serves files directly.

## Build, Test, and Development Commands
No build step is required; this is plain HTML/CSS/JS.
- `python3 -m http.server 8000`: run locally at `http://localhost:8000`.
- `node --check assets/js/app.js`: syntax-check JavaScript.
- `node -e "JSON.parse(require('fs').readFileSync('assets/data/projects.json','utf8')); console.log('OK')"`: validate project data JSON.

## Coding Style & Naming Conventions
- Use 2-space indentation in HTML/CSS/JS/JSON.
- Prefer clear, descriptive names (`release-list`, `project-summary`, `smart-search-plus-0.1.0.zip`).
- Keep paths relative for GitHub Pages compatibility (`assets/...`).
- Use lowercase kebab-case for new asset filenames; avoid spaces and special characters.
- Keep JavaScript framework-free unless explicitly planned.

## Testing Guidelines
There is no formal test framework yet.
Before submitting changes:
1. Start local server and confirm projects render.
2. Verify search and tag filtering behavior.
3. Check every new download link and image path.
4. Re-validate `projects.json` parses without errors.

## Commit & Pull Request Guidelines
- Use imperative commit messages, e.g. `Add Smart Search release entry` or `Fix download path for GitHub Pages`.
- Keep commits focused (content/data changes together when related).
- PRs should include:
  - What changed and why
  - Affected files/paths
  - Screenshots for UI changes
  - Confirmation that links and JSON were validated

## Security & Configuration Tips
- Do not commit secrets, keys, or private credentials.
- Keep release artifacts reasonably sized; prefer GitHub Releases for very large binaries.
- For user-site deployment, use the `main` branch with Pages enabled.
