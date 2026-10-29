// 使い方: node sheet.mjs 出力.png 1.svg 2.svg …（SVGを並べて1枚の画像にする）
import {createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [out,...files]=process.argv.slice(2),cols=Math.min(3,files.length),rows=Math.ceil(files.length/cols);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:cols*800,height:rows*470}});
const cells=files.map(f=>`<div style="position:relative"><img src="data:image/svg+xml;base64,${fs.readFileSync(f).toString('base64')}" width=800 height=450><div style="position:absolute;left:4px;bottom:0;font:14px sans-serif;background:#fff">${f.split('/').pop()}</div></div>`).join('');
await p.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},800px);row-gap:20px">${cells}</body>`);await p.waitForTimeout(400);await p.screenshot({path:out});await b.close();console.log('ok',out);
