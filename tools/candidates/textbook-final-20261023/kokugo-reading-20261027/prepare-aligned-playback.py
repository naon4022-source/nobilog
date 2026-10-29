"""Preserve earlier playback proof; add a separately named aligned-book verification."""
from pathlib import Path
import hashlib

HERE = Path(__file__).resolve().parent
source = HERE / 'verify-book-playback.mjs'
text = source.read_text()
changes = {
    "'candidate-book/textbook-book-kokugo1.json'": "'book-alignment-v3/textbook-book-kokugo1.json'",
    "'book-playback-screens/'": "'book-alignment-v3/playback-screens/'",
    "'book-playback-result.json'": "'book-alignment-v3/playback-result.json'",
    "const screenshot=`${id}-${width}.png`;await page.screenshot({path:new URL(screenshot,screenshotFolder).pathname});":
    """const screenshot=`${id}-${width}.png`;await page.screenshot({path:new URL(screenshot,screenshotFolder).pathname});
  // Keep native controls enabled; let the browser hide them naturally while playing.
  await page.mouse.move(1,1);await page.evaluate(()=>examinedMovie.play());
  await page.waitForTimeout(3500);
  ok(await page.evaluate(()=>examinedMovie.controls&&!examinedMovie.paused&&!examinedMovie.ended),'natural playback with native controls retained');
  const playingScreenshot=`${id}-${width}-playing.png`;await page.screenshot({path:new URL(playingScreenshot,screenshotFolder).pathname});""",
    "duration:meta.duration,screenshot}": "duration:meta.duration,screenshot,playingScreenshot}",
    "Actual unchanged reader with isolated candidate book,one candidate figure and2 MP4 overrides at4 widths.":
    "Actual unchanged reader with aligned candidate book,one candidate figure and2 retained MP4 overrides at4 widths; native-controls paused and natural-playing screenshots.",
}
for before, after in changes.items():
    assert text.count(before) == 1, before
    text = text.replace(before, after)
target = HERE / 'verify-aligned-book-playback.mjs'
assert not target.exists(), 'Never overwrite an earlier verification'
target.write_text('// Derived from SHA256 ' + hashlib.sha256(source.read_bytes()).hexdigest() + '\n' + text)
print('Separate aligned-book verifier prepared; original98 checks retained plus8 natural-playing checks')
