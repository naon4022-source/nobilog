// Fixed image-only PDF. Input must come from the answer-free problem snapshot.
// Grayscale pixels carry no HTML, image metadata, links, scripts or attachments.
export const PDF_LIMITS = Object.freeze({ pages: 30, pagePixels: 2000000, totalPixels: 16000000, bytes: 6 * 1024 * 1024 });
const encoder = new TextEncoder();

function checkedPages(pages) {
    if (!Array.isArray(pages) || !pages.length || pages.length > PDF_LIMITS.pages) throw new Error('pdf_page_count');
    let total = 0;
    return pages.map(page => {
        if (!page || Object.keys(page).some(key => !['width', 'height', 'pixels'].includes(key))) throw new Error('pdf_page_format');
        const { width, height, pixels } = page;
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320 || width > 2200 || height > 2200) throw new Error('pdf_page_dimensions');
        const count = width * height;
        if (count > PDF_LIMITS.pagePixels || !(pixels instanceof Uint8Array) || pixels.length !== count) throw new Error('pdf_page_pixels');
        total += count;
        if (total > PDF_LIMITS.totalPixels) throw new Error('pdf_total_pixels');
        // Copy before awaiting compression so another task cannot alter a later page.
        return { width, height, pixels: new Uint8Array(pixels) };
    });
}

export async function createProblemPdf(pages) {
    const input = checkedPages(pages);
    const chunks = [], offsets = [0];
    let size = 0;
    const append = value => {
        const bytes = typeof value === 'string' ? encoder.encode(value) : value;
        if (size + bytes.length > PDF_LIMITS.bytes) throw new Error('pdf_output_size');
        chunks.push(bytes); size += bytes.length;
    };
    const object = (id, head, stream) => {
        offsets[id] = size;
        append(`${id} 0 obj\n${head}`);
        if (stream) { append('\nstream\n'); append(stream); append('\nendstream'); }
        append('\nendobj\n');
    };
    append('%PDF-1.4\n');
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    object(2, `<< /Type /Pages /Count ${input.length} /Kids [${input.map((_, i) => `${4 + i * 3} 0 R`).join(' ')}] >>`);
    object(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    for (let i = 0; i < input.length; i++) {
        const page = input[i], id = 4 + i * 3;
        const compressed = new Uint8Array(await new Response(new Blob([page.pixels]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
        page.pixels = null;
        // Fit without changing aspect ratio. Reserve a lower band for the page number.
        const scale = Math.min(547.28 / page.width, 773.89 / page.height);
        const w = page.width * scale, h = page.height * scale;
        const x = (595.28 - w) / 2, y = 44 + (773.89 - h) / 2;
        const commands = encoder.encode(`q\n${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Img Do\nQ\nBT /F1 9 Tf 0 g 277 22 Td (${i + 1} / ${input.length}) Tj ET\n`);
        object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Img ${id + 1} 0 R >> /Font << /F1 3 0 R >> >> /Contents ${id + 2} 0 R >>`);
        object(id + 1, `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>`, compressed);
        object(id + 2, `<< /Length ${commands.length} >>`, commands);
    }
    const xref = size;
    append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
    for (let id = 1; id < offsets.length; id++) append(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
    append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const output = new Uint8Array(size);
    let position = 0;
    for (const chunk of chunks) { output.set(chunk, position); position += chunk.length; }
    return output;
}
