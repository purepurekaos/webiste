# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page personal portfolio site ("TLR"), deployed via GitHub Pages to `by-tlr.tech` (see `CNAME`). There is no build step, no package manager, and no test suite — the entire site is one self-contained file.

## Development

There are no build/lint/test commands. To preview changes, open `index.html` directly in a browser (or serve the directory with any static file server, e.g. `python3 -m http.server`).

## Architecture

Everything — HTML, CSS, and JS — lives in `index.html` as a single file with inline `<style>` and `<script>` blocks. There are no other source files or external assets/dependencies.

The page has three visual layers stacked with `z-index`:
1. `<canvas id="bg">` — an animated background of horizontal wavy lines driven by layered Perlin noise (`perlin`/`fbm` functions), redrawn every frame via `drawWaves()`.
2. `#ascii-layer` / `#ascii-pre` — a full-screen ASCII-art overlay rendered as text in a `<pre>`. By default it renders animated Perlin noise (`perlin2`/`fbm2`) mapped to the `ASCII_CHARS` ramp (`' .,:;+*?%S#@'`). If a user uploads/drops an image, `loadImage()` decodes it to pixel data and `samplePixel()`/`lumToChar()` render the image as ASCII instead, controllable via brightness/contrast/density/opacity sliders (`#img-controls`).
3. The foreground UI: a centered menu (`.container#main`), a live clock, and social links.

Menu items (`about`, `qualifications`, `projects`, `interests`, `contact`) call `openPanel(name)`, which shows a full-screen `.panel-<name>` overlay (with a dimmed `.overlay` backdrop) and hides the main menu; `closePanel()` (via the close button, clicking the overlay, or Escape) reverses this. Panel content is currently all placeholder text (`[ your text goes here ]` etc.) — populating these with real content is a common task.

Image upload/drag-and-drop state (`imagePixels`, `imgW`/`imgH`, slider values) is plain module-level JS state, not persisted — reloading the page resets to the default animated ASCII noise.

## Git history note

Past commits show a `projects/asciiconverter/index.html` was created then deleted, and `index.html` has been repeatedly replaced wholesale ("Add files via upload" / "Delete index.html" pairs) rather than incrementally edited — this appears to be edited outside of git-aware tooling (e.g. drag-and-drop uploads to GitHub). Prefer small, targeted edits going forward rather than full-file replacement.
