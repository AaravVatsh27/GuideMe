import fs from "node:fs/promises";
import path from "node:path";
import Script from "next/script";

const legacyStaticDir = path.join(process.cwd(), "legacy-static");

async function readLegacyFile(fileName: string) {
  return fs.readFile(path.join(legacyStaticDir, fileName), "utf8");
}

async function getLegacyMarkup() {
  const html = await readLegacyFile("index.html");
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

  if (!bodyMatch) {
    throw new Error("Could not locate legacy landing page body markup.");
  }

  return bodyMatch[1]
    .replace(/\s*<script\s+src="script\.js"><\/script>\s*/i, "")
    .trim();
}

async function getLegacyScript() {
  const script = await readLegacyFile("script.js");

  return `
    (() => {
      const root = document.querySelector("[data-guideme-landing]");

      if (!root || root.dataset.legacyBound === "true") {
        return;
      }

      root.dataset.legacyBound = "true";
      ${script}
    })();
  `;
}

export default async function Home() {
  const [legacyMarkup, legacyScript] = await Promise.all([
    getLegacyMarkup(),
    getLegacyScript(),
  ]);

  return (
    <>
      <div
        className="guideme-landing"
        data-guideme-landing
        dangerouslySetInnerHTML={{ __html: legacyMarkup }}
      />
      <Script id="guideme-legacy-script" strategy="afterInteractive">
        {legacyScript}
      </Script>
    </>
  );
}
