// Execute the existing full Eiken browser regression with only source URL overlay.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const original=new URL('../../../.claude/verify/verify-eiken-vocab-browser.mjs',import.meta.url);
let code=await readFile(original,'utf8');
const base="const base=new URL('../../site-assets/',import.meta.url);";
assert.equal(code.split(base).length,2);
code=code.replace(base,"const base=new URL('../../site-assets/',"+JSON.stringify(original.href)+");");
const read='const body=await readFile(new URL(name,base));';assert.equal(code.split(read).length,2);
code=code.replace(read,'const body=await readFile(name==="eiken-vocab.js"?new URL("eiken-vocab.js",'+JSON.stringify(import.meta.url)+'):new URL(name,base));');
code=code.replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')');
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
