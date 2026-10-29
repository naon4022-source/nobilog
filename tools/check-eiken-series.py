from pathlib import Path
import json
import pdfplumber
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'site-assets/eiken-series-manifest.json').read_text())
total = 0
for grade, data in manifest.items():
    for kind in ('questions', 'answers'):
        file = root / 'output/pdf' / f'eiken-original-{grade}-{kind}.pdf'
        reader = PdfReader(file)
        starts = [s[kind + 'Page'] for s in data['sets']]
        assert starts[0] == 1 and starts == sorted(set(starts))
        assert len(reader.pages) == (40 if kind == 'questions' and grade in ('3', 'pre2') else 30)
        with pdfplumber.open(file) as pdf:
            for index, page in enumerate(pdf.pages, 1):
                number = max(i + 1 for i, start in enumerate(starts) if start <= index)
                assert f'練習{number:02}' in reader.pages[index - 1].extract_text(), (file.name, index, 'footer')
                assert page.chars, (file.name, index, 'empty')
                for char in page.chars:
                    assert char['x0'] >= 40 and char['x1'] <= page.width - 39, (file.name, index, char['text'], 'width')
                    assert char['top'] >= 35 and char['bottom'] <= page.height - 15, (file.name, index, 'height')
                total += 1
print(f'Eiken PDF: {total} pages, all chapter starts, footers and character bounds passed')
