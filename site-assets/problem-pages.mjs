import { PDF_LIMITS } from './problem-pdf.mjs';

// Flatten browser canvas pixels onto white before converting to grayscale.
export function grayscaleProblemBlock({ width, height, rgba }) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || width > 2200 || height < 1 || height > 2200 || width * height > PDF_LIMITS.pagePixels || !(rgba instanceof Uint8ClampedArray || rgba instanceof Uint8Array) || rgba.length !== width * height * 4) throw new Error('pages_rgba_format');
    const pixels = new Uint8Array(width * height);
    for (let p = 0, i = 0; p < pixels.length; p++, i += 4) {
        const gray = (299 * rgba[i] + 587 * rgba[i + 1] + 114 * rgba[i + 2]) / 1000;
        pixels[p] = Math.round((gray * rgba[i + 3] + 255 * (255 - rgba[i + 3])) / 255);
    }
    return { width, height, pixels };
}

// Each block is rasterized separately by the caller, never as one giant canvas.
// Only entirely white bands may divide a block; dense tables fail explicitly.
export function paginateProblemBlocks(blocks, { width = 640, height = 904, gap = 16 } = {}) {
    if (!Array.isArray(blocks) || !blocks.length || blocks.length > 500) throw new Error('pages_blocks');
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320 || width > 2200 || height > 2200 || width * height > PDF_LIMITS.pagePixels) throw new Error('pages_dimensions');
    if (!Number.isInteger(gap) || gap < 0 || gap > 64) throw new Error('pages_gap');
    let sourcePixels = 0;
    for (const block of blocks) {
        if (!block || Object.keys(block).some(k => !['width', 'height', 'pixels'].includes(k)) || block.width !== width || !Number.isInteger(block.height) || block.height < 1 || block.height > 2200 || !(block.pixels instanceof Uint8Array) || block.pixels.length !== width * block.height) throw new Error('pages_block_format');
        sourcePixels += block.pixels.length;
        if (block.pixels.length > PDF_LIMITS.pagePixels || sourcePixels > PDF_LIMITS.totalPixels) throw new Error('pages_source_limit');
    }
    const pages = [], placements = [];
    let page, cursor = 0;
    function nextPage() {
        if (pages.length >= PDF_LIMITS.pages || (pages.length + 1) * width * height > PDF_LIMITS.totalPixels) throw new Error('pages_output_limit');
        page = { width, height, pixels: new Uint8Array(width * height).fill(255) };
        pages.push(page); cursor = 0;
    }
    function whiteRow(block, row) {
        const end = (row + 1) * width;
        for (let i = row * width; i < end; i++) if (block.pixels[i] !== 255) return false;
        return true;
    }
    nextPage();
    for (let b = 0; b < blocks.length; b++) {
        const block = blocks[b];
        // Keep ordinary questions together instead of splitting to fill space.
        if (cursor && block.height > height - cursor) nextPage();
        let sourceRow = 0;
        while (sourceRow < block.height) {
            let rows = Math.min(block.height - sourceRow, height - cursor);
            if (rows < block.height - sourceRow) {
                let cut = sourceRow + rows;
                // A two-row white band protects the last and next text lines.
                while (cut > sourceRow + 1 && !(whiteRow(block, cut - 1) && whiteRow(block, cut))) cut--;
                if (cut <= sourceRow + 1) {
                    if (cursor) { nextPage(); continue; }
                    throw new Error('pages_no_safe_break');
                }
                rows = cut - sourceRow;
            }
            page.pixels.set(block.pixels.subarray(sourceRow * width, (sourceRow + rows) * width), cursor * width);
            placements.push({ block: b, page: pages.length - 1, sourceRow, targetRow: cursor, rows });
            cursor += rows; sourceRow += rows;
            if (sourceRow < block.height) nextPage();
        }
        if (b < blocks.length - 1) {
            if (height - cursor <= gap) nextPage();
            else cursor += gap;
        }
    }
    return { pages, placements };
}
