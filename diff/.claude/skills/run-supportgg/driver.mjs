#!/usr/bin/env node
/**
 * Minimal chromium-cli-style REPL driver for SupportGG, for containers
 * where chromium-cli itself isn't installed. Reads one command per line
 * from stdin, drives a real headless Chromium via Playwright (already a
 * devDependency here — no extra install beyond `npx playwright install
 * chromium`), and prints one result line per command.
 *
 * Usage:
 *   node .claude/skills/run-supportgg/driver.mjs <<'EOF'
 *   nav http://localhost:5173/
 *   wait-for text=Buscar Jugador
 *   screenshot home
 *   fill placeholder=Ej: Faker Hide on bush
 *   fill placeholder=Ej: KR1 KR1
 *   select select asia
 *   click role=button:Buscar Jugador
 *   wait-for text=Historial de Partidas
 *   screenshot player
 *   console errors
 *   EOF
 *
 * Commands (space-separated; quote any argument containing a space, e.g.
 * a placeholder or button label with spaces in it — "placeholder=Ej: Faker"):
 *   nav <url>                    goto
 *   wait-for <target>            wait until visible (30s timeout)
 *   click <target>                click
 *   fill <target> <text>          fill an input (2 args — quote both if spaced)
 *   select <target> <value>       selectOption on a <select>
 *   press <key>                   keyboard press (e.g. Enter)
 *   screenshot [name]             save PNG to ./screenshots/<name-or-seq>.png
 *   console errors                print console.error / pageerror seen so far
 *   sleep <ms>                    only for animations; prefer wait-for
 *
 * <target> forms (all matched with exact:true — no accidental substring
 * collisions between e.g. "Ej: Faker" and "Ej: KR1"):
 *   text=<exact text>             page.getByText(text, { exact: true })
 *   role=<role>:<accessible name> page.getByRole(role, { name, exact: true })
 *   placeholder=<placeholder>     page.getByPlaceholder(placeholder, { exact: true })
 *   anything else                 treated as a raw CSS selector
 */

/** Whitespace-splits a line, respecting "double quoted sections". */
function tokenize(line) {
  const tokens = [];
  const re = /"([^"]*)"|(\S+)/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    tokens.push(match[1] !== undefined ? match[1] : match[2]);
  }
  return tokens;
}
import { chromium } from '@playwright/test';
import { createInterface } from 'node:readline';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(SKILL_DIR, 'screenshots');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

function locatorFor(page, target) {
  if (target.startsWith('text=')) return page.getByText(target.slice(5), { exact: true });
  if (target.startsWith('role=')) {
    const [role, ...nameParts] = target.slice(5).split(':');
    const name = nameParts.join(':');
    return page.getByRole(role, name ? { name, exact: true } : undefined);
  }
  if (target.startsWith('placeholder=')) return page.getByPlaceholder(target.slice(12), { exact: true });
  return page.locator(target);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  let shotIndex = 0;

  const rl = createInterface({ input: process.stdin, terminal: false });
  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const [cmd, ...rest] = tokenize(line);
    try {
      if (cmd === 'nav') {
        const res = await page.goto(rest.join(' '));
        console.log(`nav -> ${res.status()}`);
      } else if (cmd === 'wait-for') {
        await locatorFor(page, rest.join(' ')).first().waitFor({ timeout: 30000 });
        console.log('wait-for -> ok');
      } else if (cmd === 'click') {
        await locatorFor(page, rest.join(' ')).first().click();
        console.log('click -> ok');
      } else if (cmd === 'fill') {
        const [target, ...value] = rest;
        await locatorFor(page, target).first().fill(value.join(' '));
        console.log('fill -> ok');
      } else if (cmd === 'select') {
        const [target, value] = rest;
        await locatorFor(page, target).first().selectOption(value);
        console.log('select -> ok');
      } else if (cmd === 'press') {
        await page.keyboard.press(rest.join(' '));
        console.log('press -> ok');
      } else if (cmd === 'sleep') {
        await page.waitForTimeout(Number(rest[0]) || 500);
        console.log('sleep -> ok');
      } else if (cmd === 'screenshot') {
        const name = rest[0] || `shot-${shotIndex}`;
        shotIndex += 1;
        const path = join(SCREENSHOT_DIR, `${name}.png`);
        await page.screenshot({ path, fullPage: true });
        console.log(`screenshot -> ${path}`);
      } else if (cmd === 'console' && rest[0] === 'errors') {
        console.log(`console errors -> ${JSON.stringify(consoleErrors)}`);
      } else {
        console.log(`unknown command: ${line}`);
      }
    } catch (err) {
      console.log(`ERROR on "${line}": ${err.message}`);
    }
  }

  await browser.close();
}

main();
