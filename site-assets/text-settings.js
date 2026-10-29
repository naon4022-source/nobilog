// Scale actual rendered text, including fixed px and inline sizes, without zooming the layout.
(function () {
    'use strict';
    let observer=null,frame=0,enabled=false;
    const roots=new Set();
    const ignored='script,style,noscript,svg,canvas,textarea,[contenteditable="true"],.tb-measure,.tb-spread';// 教科書のページは本のほうで大きい字に組む（あとから拡大するとページからはみ出す）
    function candidates(root,found) {
        if(!root||!root.isConnected)return;
        if(root.nodeType===Node.TEXT_NODE)root=root.parentElement;
        if(!root||root.nodeType!==Node.ELEMENT_NODE)return;
        if(!root||root.closest(ignored))return;
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        let node;
        while((node=walker.nextNode())) {
            if(!/[\p{L}\p{N}]/u.test(node.textContent))continue;
            const parent=node.parentElement;
            if(parent&&!parent.closest(ignored))found.add(parent);
        }
        if(root.nodeType===Node.ELEMENT_NODE&&Array.from(root.childNodes).some(n=>n.nodeType===Node.TEXT_NODE&&/[\p{L}\p{N}]/u.test(n.textContent)))found.add(root);
        if(root.matches?.('input:not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea,select'))found.add(root);
        root.querySelectorAll?.('input:not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea,select').forEach(el=>found.add(el));
    }
    function flush() {
        frame=0;if(!enabled||!document.body)return;
        const found=new Set();for(const root of roots)candidates(root,found);roots.clear();
        // Read all natural sizes before writing: nested text must never scale twice.
        document.body.classList.remove('large-text');
        const sizes=Array.from(found,el=>[el,parseFloat(getComputedStyle(el).fontSize)]);
        for(const [el,size] of sizes)if(Number.isFinite(size)&&size>0) {
            el.style.setProperty('--nobi-text-base',size+'px');el.classList.add('nobi-scaled-text');
        }
        document.body.classList.add('large-text');
    }
    function queue(root) {
        if(!enabled)return;
        roots.add(root);if(!frame)frame=requestAnimationFrame(flush);
    }
    function apply(on) {
        enabled=on===true;
        if(!document.body)return;
        document.body.classList.toggle('large-text',enabled);
        if(!enabled) {
            if(observer)observer.disconnect();observer=null;
            if(frame)cancelAnimationFrame(frame);frame=0;roots.clear();return;
        }
        roots.add(document.body);flush();
        if(!observer) {
            observer=new MutationObserver(records=>{
                for(const record of records) {
                    if(record.type==='characterData')queue(record.target.parentElement);
                    else for(const node of record.addedNodes)queue(node);
                }
            });
            observer.observe(document.body,{childList:true,subtree:true,characterData:true});
        }
    }
    const style=document.createElement('style');style.id='nobi-text-settings-style';
    style.textContent='body.large-text .nobi-scaled-text{font-size:calc(var(--nobi-text-base)*1.2)!important}'+
        '@media print{body.large-text .nobi-scaled-text{font-size:var(--nobi-text-base)!important}}';
    document.head.appendChild(style);
    window.NobiTextSettings={apply};
})();
