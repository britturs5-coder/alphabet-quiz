import { readFile, writeFile } from "node:fs/promises";

const htmlPath = new URL("../dist/index.html", import.meta.url);
const html = await readFile(htmlPath, "utf8");

await writeFile(
  htmlPath,
  html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '<script defer src="$1"></script>'),
  "utf8"
);
