# karmashawky.com

Static bilingual (Arabic / English) site. Everything you can edit lives in `content/`; `node build.mjs` turns it into `dist/`.
On GitHub, every change pushed to `main` is built and published automatically by `.github/workflows/deploy.yml`.

```
content/site/*.json     page texts (home, about, services, work, insights, resources, contact, forms, privacy, navigation)
content/funnels/*.json  consulting, management, audit, proposal and booking pages
content/case-studies/   one file per case study
content/insights/       articles
content/resources/      free resources (guides, templates, checklists). The page appears once one exists
content/pages/          SEO pages, offers, courses
content/clients.json    clients (logos) · websites.json · snapshots.json · ads/ · references/
content/settings.json   WhatsApp number, links, analytics, booking
public/images, public/files   uploaded images and downloadable files
.pages.yml              Pages CMS configuration (edit everything from the browser)
```
Files whose name starts with `_` are examples and are ignored by the build.
