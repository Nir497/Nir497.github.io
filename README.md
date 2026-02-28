# Personal Portfolio (GitHub Pages Ready)

Static personal website with:
- Top dropdown nav + search
- Development project sections (text + images + versioned releases)
- Data-driven rendering from `assets/data/projects.json`

## Project Structure

- `index.html`
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/data/projects.json`
- `assets/images/`
- `assets/downloads/`

## Add/Edit Projects

1. Add image files to `assets/images/`.
2. Add downloadable files to `assets/downloads/`.
3. Edit `assets/data/projects.json` and update each project object:
   - `title`, `summary`, `description`
   - `tags` (used in dropdown filter)
   - `images` array with `src`, `alt`, `caption`
   - `releases` array with:
     - `version`, `date`
     - `builds` array with `os`, `label`, `file`, `type`

Use relative paths, for example:
- `assets/images/my-image.png`
- `assets/downloads/my-project-2.1.0-windows-x64.zip`
- `assets/downloads/my-project-2.1.0-macos-universal.zip`
- `assets/downloads/my-project-2.1.0-linux-x64.tar.gz`

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open repository `Settings` -> `Pages`.
3. Under "Build and deployment", choose `Deploy from a branch`.
4. Select your branch (usually `main`) and folder (`/ (root)`).
5. Save and wait for deployment.

Your site URL will appear in the Pages settings.

## Notes

- This is fully static (no backend, no login).
- Works on GitHub Pages because all assets are local and relative.
- Keep release files in `assets/downloads/` and update `projects.json` when adding a new version.
