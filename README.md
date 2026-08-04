# maisy-mylod-website

Personal site. Static files, no build step, hosted on GitHub Pages from `main`.

```
$ ls
index.html  experience.html  projects.html  dashboard.html  contact.html
theme.css   styles.css       script.js
```

`theme.css` holds design tokens, `styles.css` holds components, and `script.js` is a
single IIFE exposing no globals. Page-specific JS lives inline at the bottom of the
page that needs it. See [DESIGN_NOTES.md](DESIGN_NOTES.md) for the design system and
the acceptance checklist.

## Run it

```
python3 -m http.server 8765
open http://127.0.0.1:8765/
```

## House rule

Every number on the site names the repository it came from and the command that
regenerates it. If a figure cannot be reproduced from a clean checkout, it is
labelled pending rather than claimed. The dashboard reads real GitHub contribution
data and prints the query that produced it.
