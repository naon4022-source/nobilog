(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.NobiProblemShare = api;
})(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    const TAGS = new Set('div span p b strong em i u small h1 h2 h3 h4 section article br hr table thead tbody tfoot tr th td ul ol li label'.split(' '));
    const DROP_TAGS = new Set('script style iframe object embed svg canvas video audio form select option template'.split(' '));
    const DROP_CLASSES = new Set('no-print q-ans-show ek-ans-top ek-ans-bottom ek-write-note fc-meaning study-check fr-txt'.split(' '));
    const STATE_CLASSES = new Set('sel opt-correct opt-wrong flipped show hm-answer'.split(' '));
    const STYLE_PROPS = new Set('text-align font-size font-weight line-height white-space margin-top margin-bottom border-bottom height'.split(' '));

    function classTokens(node) {
        return String(node.className || '').split(/\s+/).filter(Boolean);
    }

    function safeStyle(node) {
        const style = String(node.getAttribute('style') || '');
        return style.split(';').map(piece => {
            const pos = piece.indexOf(':');
            if (pos < 0) return '';
            const key = piece.slice(0, pos).trim().toLowerCase();
            const value = piece.slice(pos + 1).trim();
            if (!STYLE_PROPS.has(key) || !/^[\w\s.#()%,-]+$/.test(value) || /url|expression|var\s*\(/i.test(value)) return '';
            return key + ':' + value;
        }).filter(Boolean).join(';');
    }

    function cleanNode(source, doc) {
        if (source.nodeType === 3) return doc.createTextNode(source.nodeValue || '');
        if (source.nodeType !== 1) return null;
        const tag = source.tagName.toLowerCase();
        const classes = classTokens(source);
        if (DROP_TAGS.has(tag) || classes.some(c => DROP_CLASSES.has(c)) || source.getAttribute('aria-hidden') === 'true') return null;
        if (tag === 'input' || tag === 'textarea' || (tag === 'button' && !classes.includes('ek-opt'))) return null;
        const questionMark = String(source.getAttribute('id') || '').match(/^ek-mark-(\d{1,4})$/);
        if (questionMark) return doc.createTextNode('(' + questionMark[1] + ')');
        if (tag === 'img') {
            const url = new URL(source.currentSrc || source.getAttribute('src') || '', doc.baseURI);
            const base = new URL(doc.baseURI);
            if (url.origin !== base.origin || url.username || url.password || !/^https?:$/.test(url.protocol) || !/\.(png|jpe?g|webp)$/i.test(url.pathname) || url.search || url.hash) throw new Error('この図はまだPDF共有に対応していません。');
            const image = doc.createElement('img');
            image.setAttribute('src', url.href);
            image.setAttribute('alt', source.getAttribute('alt') || '');
            return image;
        }
        const target = doc.createElement(tag === 'button' && classes.includes('ek-opt') ? 'div' : TAGS.has(tag) ? tag : 'div');
        const retained = classes.filter(c => !STATE_CLASSES.has(c) && c !== 'print-only' && c !== 'ek-opt');
        if (classes.includes('ek-opt')) retained.push('share-option');
        if (retained.length) target.className = retained.join(' ');
        const style = safeStyle(source);
        if (style) target.setAttribute('style', style);
        if (tag === 'td' || tag === 'th') {
            for (const attr of ['colspan', 'rowspan']) {
                const n = Number(source.getAttribute(attr));
                if (Number.isInteger(n) && n >= 1 && n <= 20) target.setAttribute(attr, String(n));
            }
        }
        for (const child of Array.from(source.childNodes || [])) {
            const cleaned = cleanNode(child, doc);
            if (cleaned) target.appendChild(cleaned);
        }
        return target;
    }

    function createSnapshot(runContent, printTitle) {
        if (!runContent || !printTitle || !runContent.ownerDocument || !runContent.childNodes.length) throw new Error('共有できる問題がありません。');
        const doc = runContent.ownerDocument;
        const container = doc.createElement('div');
        container.className = 'problem-share-snapshot';
        const title = doc.createElement('h1');
        title.className = 'problem-share-title';
        title.textContent = String(printTitle.textContent || '').trim();
        if (!title.textContent) throw new Error('問題のタイトルがありません。');
        container.appendChild(title);
        for (const child of Array.from(runContent.childNodes)) {
            const cleaned = cleanNode(child, doc);
            if (cleaned && cleaned.nodeType === 3) {
                const paragraph = doc.createElement('p'); paragraph.appendChild(cleaned); container.appendChild(paragraph);
            } else if (cleaned) container.appendChild(cleaned);
        }
        return container;
    }

    return { createSnapshot };
});
