# Pola — Post-sweat care for young India

Futuristic, interactive pre-launch site for **Pola Cooldown**, a hypochlorous acid (HOCl) spray for face, body and scalp.

Static site — no build step. GSAP, ScrollTrigger and Lenis load from CDN.

```bash
python3 -m http.server 5173
# open http://localhost:5173
```

- `index.html` — all 10 sections (idea → why us) and the waitlist
- `assets/css/styles.css` — styles, responsive and reduced-motion
- `assets/js/main.js` — interactions: mist spray, shop & bag, chart, market calculator, waitlist

Pre-launch: prices are hypotheses. The bag and waitlist are stored in the browser (localStorage) only; nothing is charged.
