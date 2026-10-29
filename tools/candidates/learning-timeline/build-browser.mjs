import {readFile,writeFile} from 'node:fs/promises';
const names=['clock','pack','outbox','collector','lifecycle','runtime','bridge','history','client','aggregate','month','app'];
let output="(function(root){'use strict';const factories={},cache={};\n";
for(const name of names){const code=await readFile(new URL(name+'.cjs',import.meta.url),'utf8');output+='factories['+JSON.stringify('./'+name+'.cjs')+']=function(module,exports,require){\n'+code+'\n};\n';}
output+="function require(id){if(cache[id])return cache[id].exports;if(!factories[id])throw Error('unknown module');const module={exports:{}};cache[id]=module;factories[id](module,module.exports,require);return module.exports;}root.NobiLearningTimeRuntime=Object.freeze(require('./runtime.cjs'));root.NobiLearningTimeBridge=Object.freeze(require('./bridge.cjs'));root.NobiLearningTimeHistory=Object.freeze(require('./history.cjs'));root.NobiLearningTimeClient=Object.freeze(require('./client.cjs'));root.NobiLearningTimeMonth=Object.freeze(require('./month.cjs'));root.NobiLearningTimeApp=Object.freeze(require('./app.cjs'));})(globalThis);\n";
await writeFile(new URL('runtime-browser.js',import.meta.url),output);
console.log('Browser candidate rebuilt from '+names.length+' exact source modules');
