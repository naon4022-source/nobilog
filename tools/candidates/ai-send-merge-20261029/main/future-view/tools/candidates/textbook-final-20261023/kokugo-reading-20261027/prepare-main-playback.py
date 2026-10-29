"""Reuse the reviewed playback scenario against actual main assets, with no overrides."""
from pathlib import Path
import hashlib

HERE = Path(__file__).resolve().parent
source = HERE / 'verify-aligned-book-playback.mjs'
text = source.read_text()
edits = [
    ("const here=new URL('./',import.meta.url)", "const here=new URL('../',import.meta.url)"),
    ("const overrides=new Map([['textbook-book-kokugo1.json',new URL('book-alignment-v3/textbook-book-kokugo1.json',here)],['textbook-book-kokugo1-k1-c1-s1-dp.svg',new URL('../explanation-figures-20261028/candidate/K1-C1-S1-DP.svg',here)]]);", "const overrides=new Map(); // Actual main assets only; no candidate URL replacements."),
    ("overrides.set(`textbook-book-kokugo1-${id.toLowerCase()}.mp4`,movie);", "const mainFile=`site-assets/textbook-book-kokugo1-${id.toLowerCase()}.mp4`;inputs[mainFile]=hash(await readFile(new URL(mainFile,root)));assert.equal(inputs[mainFile],receipt.movieSha256,'main movie equals the AV/78-frame reviewed candidate');"),
    ("['site-assets/textbook-book.js','site-assets/textbook-book.css','site-assets/textbook-books.json']", "['site-assets/textbook-book.js','site-assets/textbook-book.css','site-assets/textbook-books.json','site-assets/textbook-book-kokugo1.json','site-assets/textbook-book-kokugo1-k1-c1-s1-dp.svg']"),
    ("'book-alignment-v3/playback-screens/'", "'main/playback-screens/'"),
    ("'book-alignment-v3/playback-result.json'", "'main/playback-result.json'"),
    ("Actual unchanged reader with aligned candidate book,one candidate figure and2 retained MP4 overrides at4 widths; native-controls paused and natural-playing screenshots. Main integration/context/catalog/preview approval and physical-device tests remain pending.", "Actual current main reader/book/figure/2 MP4 at4 widths with zero overrides; native-controls paused and natural-playing screenshots. Main catalog source guard is separate; final whole/preview artifact/physical-device approval remains pending."),
]
for before, after in edits:
    assert text.count(before) == 1, before
    text = text.replace(before, after)
target = HERE / 'main/verify-book-playback.mjs'
assert not target.exists(), 'Do not replace completed main verification'
target.write_text('// Actual-main successor of SHA256 ' + hashlib.sha256(source.read_bytes()).hexdigest() + '\n' + text)
print('Prepared main playback with zero overrides;106 prior checks retained')
