# Slime cognition site

This is a no-build static website suitable for GitHub Pages.

## Folder map

```text
slime-cognition-site/
├── index.html
├── styles.css
├── scripts/
│   └── three-header.js
├── assets/
│   ├── slime_image.jpeg
│   └── README.md
└── pages/
    ├── about.html
    ├── contact.html
    ├── resume.html
    ├── landauer.html
    ├── simulation.html
    ├── noise.html
    ├── sensory-range.html
    ├── hopfield-dynamics.html
    ├── subcellular-hopfield.html
    └── sensory-memory.html
```

## Use on GitHub Pages

Upload the contents of this folder to the root of a GitHub repository, then enable Pages for the repository’s main branch. All links are relative, so the site also works when the repository is hosted under a project subpath.

## Customize

1. Add the optional files listed in `assets/README.md`.
2. Edit the question text and `href` values in `index.html`.
3. Tune the normalized positions under the `.question--…` rules in `styles.css`.
4. Replace the starter copy in each file under `pages/`.

The desktop composition uses the supplied SVG’s 1920 × 1080 artboard as its reference scale. Below 680px, the network becomes a stacked mobile layout and the decorative curves are removed for legibility.
