# Techlahoma Badge Creator

Create a custom 🦬 Techlahoma badge for your LinkedIn profile picture!

👉 [**Use it live**](https://badge.techlahoma.org/)

![Example Image](example.png)

## Features

- **Upload any photo** - No need for square images
- **Zoom & pan** - Scroll to zoom, drag to reposition
- **Preset badges** - Quick-select from popular options:
  - Techlahoma user groups (LUGNUTS, SHECODES, TWD, etc.)
  - Programming languages (JS, PYTHON, RUST, etc.)
  - Frameworks (REACT, DJANGO, NEXTJS, etc.)
  - Cloud & DevOps (AWS, K8S, DOCKER, etc.)
  - Data & AI (ML, LLM, ANALYTICS, etc.)
  - Security (APPSEC, SRE, CYBER, etc.)
  - Process (AGILE, SCRUM, TDD, etc.)
- **Custom text** - Type any badge text you want
- **URL parameters** - Link directly: `?badge=PYTHON`
- **Privacy first** - All processing happens in your browser

## How to Use

1. **Upload** your portrait photo
2. **Zoom/pan** to frame your face perfectly
3. **Pick a badge** from presets or type your own
4. **Download** and update your LinkedIn profile

## Technical Details

Built with vanilla JavaScript (no frameworks).

- SVG overlay on an `<img>` element
- CSS transforms for zoom/pan preview
- Canvas compositing for final render
- URL-encoded SVG data URIs (Unicode/emoji support)
- Dynamic font scaling for longer text

## URL Parameters

Pre-fill the badge text via URL:

```
https://badge.techlahoma.org/?badge=SPEAKER
```

## Credits

- Original app by [Alex Ewerlöf](https://alexewerlof.com/)
- Techlahoma fork maintained by the community

## License

See [LICENSE](LICENSE) for details.

> *Note: This README was written with AI assistance (Claude)*

---

🦬 Made for [Techlahoma](https://techlahoma.org/)
