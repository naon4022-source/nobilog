// New actual96-question checks AND unchanged previous teaching/vision assertions.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {predecessorView} from './predecessor-view.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../../',here);
const {checkMainSource}=createRequire(import.meta.url)('./checked-successor.cjs');
assert.equal(checkMainSource().size,28,'all exact successors validated;27 old predecessors and the preserved48-question data');
await import('./verify-main-library.mjs');
const library=JSON.parse(await readFile(new URL('library-result.json',here)));assert.equal(library.status,'passed');assert.equal(library.questions,96);assert.equal(library.shippedPreserved,48);assert.equal(library.newQuestionsWithCurrentTestSource,48);
await import('./verify-main-route.mjs');
const route=JSON.parse(await readFile(new URL('route-result.json',here)));assert.equal(route.status,'passed');assert.equal(route.newQuestions,48);
const previous=await predecessorView(fileURLToPath(root),fileURLToPath(here).slice(fileURLToPath(root).length));
for(const [name,entry] of [['teaching',previous.teachingEntry],['vision',previous.visionEntry]]){
 const child=spawnSync(process.execPath,['--preserve-symlinks','--preserve-symlinks-main',entry],{cwd:previous.fixture,encoding:'utf8',maxBuffer:4*1024*1024});
 await writeFile(new URL('previous-'+name+'.log',here),(child.stdout||'')+(child.stderr||''));assert.equal(child.status,0,'unchanged historical '+name+' exit');
}
const teaching=JSON.parse(await readFile(previous.teachingResult)),vision=JSON.parse(await readFile(previous.visionResult));
assert.equal(teaching.status,'passed');assert.equal(teaching.checks,2609);assert.equal(teaching.historicalChecks,37);assert.equal(vision.status,'passed');assert.equal(vision.checks,49);
const result={status:'passed',currentQuestions:96,existingPreserved:48,libraryChecks:library.checks,routeChecks:route.checks,normalizations:28,historicalTeachingChecks:2609,historicalOriginalChecks:37,historicalVisionChecks:49,previousInputs:previous.checked,scope:'Actual current data/library96, unchanged original48, real source bindings and three-choice grading; immutable previous teaching and vision assertions executed in private predecessor trees. No live AI/user data; full browser flow and final whole-suite checks remain separate.'};
await writeFile(new URL('source-current-result.json',here),JSON.stringify(result,null,2)+'\n');console.log('Current AI96 successor passed; actual library '+library.checks+' and unchanged historical2609/37/49 assertions.');
