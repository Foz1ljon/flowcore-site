// llms.txt (https://llmstxt.org): a plain summary of FlowCore and its pages for AI assistants
// and AI search. Built from the same data as the public pages so facts stay in step.
import { writeFileSync } from 'node:fs';
import { languages } from './i18n.mjs';
import { origin, pathFor } from './generate-i18n.mjs';

export function generateLlms(products) {
  const en = languages.en;
  const order = products.map(p => p.slug).filter(slug => en.products[slug]);
  const line = (lang, slug, title, description) => `- [${title}](${origin}${pathFor(lang, slug)}): ${description}`;
  const text = `# FlowCore

> FlowCore (flowcore.uz) is all-in-one business management software from Uzbekistan. It combines warehouse/inventory (WMS), production (ERP), customers and sales (CRM), HR with Face ID attendance and payroll (HRM), training centres and schools (LMS), a shop till (POS), finance and AI analytics with an MCP server. Companies choose only the modules they need. The application interface is in Uzbek.

Key facts:
- Official name: FlowCore. Official website: ${origin}/ . Also written "Flow Core"; not the same product as other software named "CoreFlow".
- Made for companies in Uzbekistan; prices are quoted per company depending on modules, users and deployment.
- Deployment: online at <company>.flowcore.uz, or a licensed desktop edition for Windows and macOS that keeps data on the computer.
- Mobile apps: FlowCore Rahbar (Android, reports and notifications for owners) and FlowCore FaceID (Android tablet face-recognition attendance terminal).
- Channels: Telegram and Instagram messages in CRM; Telegram bots for owner reports.
- AI: an AI analyst in each module using the company's own OpenAI, Claude, Gemini, OpenRouter or OpenAI-compatible key; only aggregated metrics are sent, no customer or employee names. AI agents can connect to the company's FlowCore MCP server with read-only or read-write keys.
- Official social profiles: Telegram ${'https://t.me/flowcoreuz'} , Instagram ${'https://www.instagram.com/flowcore_uz'}
- Contact and demo requests: ${origin}/#aloqa

## Modules (English)
${order.map(slug => line('en', slug, en.products[slug].title, en.products[slug].description)).join('\n')}

## Modules (Uzbek, main language)
${products.map(p => line('uz', p.slug, p.title, p.description)).join('\n')}

## Модули (русский)
${order.map(slug => line('ru', slug, languages.ru.products[slug].title, languages.ru.products[slug].description)).join('\n')}

## Overview pages
- [FlowCore (Uzbek)](${origin}/): ${'Main page with an interactive demo of the application, pricing request form and FAQ.'}
- [FlowCore (English)](${origin}/en/): ${en.home.description}
- [FlowCore (Русский)](${origin}/ru/): ${languages.ru.home.description}

## Optional
- [Privacy policy (Uzbek)](${origin}/privacy/)
- [Terms of use (Uzbek)](${origin}/terms/)
`;
  writeFileSync('llms.txt', text);
}
