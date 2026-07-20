# Hitster Timeline

A small, single-user timeline for keeping track of year cards while playing Hitster. Cards are stored only in the browser on the device where you create them.

## Live app

The latest version is published through GitHub Pages:

[https://bommelin.github.io/hitster-timeline/](https://bommelin.github.io/hitster-timeline/)

## Requirements

- macOS (the same commands also work on Linux and Windows)
- Node.js 20.19 or newer
- npm

Check your installed versions:

```bash
node --version
npm --version
```

## Install and run on your Mac

From the project folder:

```bash
npm install
npm run dev
```

Open the local address printed by Vite, normally [http://localhost:5173](http://localhost:5173).

## Test on an iPhone over Wi-Fi

Connect the Mac and iPhone to the same Wi-Fi network, then expose the development server to your local network:

```bash
npm run dev -- --host 0.0.0.0
```

Vite will print a `Network` address. Open that address in Safari on the iPhone.

You can also find the Mac's Wi-Fi IP address with:

```bash
ipconfig getifaddr en0
```

If that prints nothing, try:

```bash
ipconfig getifaddr en1
```

For example, if the command prints `192.168.1.42`, open:

```text
http://192.168.1.42:5173
```

macOS may ask whether Node can accept incoming network connections; choose **Allow**. If the phone cannot connect, check that both devices are on the same Wi-Fi, temporarily disconnect VPNs, and check the Mac firewall. Some guest or managed Wi-Fi networks use client isolation, which prevents devices from reaching each other.

## Production build

Create an optimized production build:

```bash
npm run build
```

Preview it on the Mac:

```bash
npm run preview
```

Or expose the production preview to the iPhone:

```bash
npm run preview -- --host 0.0.0.0
```

The generated production files are placed in `dist/`.

## GitHub Pages deployment

Every push to the `main` branch runs the tests, creates a production build, and deploys it to GitHub Pages through the workflow in `.github/workflows/deploy-pages.yml`.

You can also start a deployment manually from the repository's **Actions** tab by opening **Deploy to GitHub Pages** and selecting **Run workflow**.

## Tests

Run the card validation, sorting, duplicate-year, and clearing tests:

```bash
npm test
```

## Stored data

The timeline is saved in `localStorage`, so refreshing or reopening the page restores the cards. Clearing site data in the browser will also clear the timeline.
