import { grayscaleProblemBlock, paginateProblemBlocks } from './problem-pages.mjs';
import './problem-share.js';
export function captureProblemSnapshot(content,title) { return window.NobiProblemShare.createSnapshot(content,title); }
let rendererPromise;
async function renderer() {
    if (window.html2canvas) return window.html2canvas;
    if (!rendererPromise) rendererPromise = new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src='/vendor/html2canvas-1.4.1.min.js';
        script.onload=()=>window.html2canvas?resolve(window.html2canvas):reject(new Error('PDFの準備に失敗しました。'));
        script.onerror=()=>{script.remove();rendererPromise=null;reject(new Error('PDFの準備に失敗しました。接続を確認してください。'));};
        document.head.appendChild(script);
    });
    return rendererPromise;
}
function timed(promise) {
    let timer;
    return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('PDFの準備に時間がかかっています。もう一度お試しください。')),20000);})]).finally(()=>clearTimeout(timer));
}
async function encodePage(page) {
    const compressed=new Uint8Array(await new Response(new Blob([page.pixels]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    let binary='';for(let i=0;i<compressed.length;i+=8192)binary+=String.fromCharCode(...compressed.subarray(i,i+8192));
    return {width:page.width,height:page.height,data:btoa(binary)};
}
export async function renderProblemPages(snapshot,stillCurrent=()=>true) {
    const draw=await renderer();
    if(document.fonts)await timed(document.fonts.ready);
    const host=document.createElement('div');
    host.style.cssText='position:absolute;left:-10000px;top:0;width:640px;background:white;color:black;';
    const style=document.createElement('style');
    style.textContent='.problem-share-snapshot,.problem-share-snapshot *{box-sizing:border-box!important;color:#000!important;background-color:#fff!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;animation:none!important;transition:none!important}.problem-share-snapshot{width:640px!important;padding:12px!important;font:18px/1.65 system-ui!important}.problem-share-snapshot img{max-width:100%!important;height:auto!important}.problem-share-snapshot table{width:100%!important;border-collapse:collapse!important}.problem-share-snapshot td,.problem-share-snapshot th{border:1px solid #000!important;padding:6px!important}.problem-share-snapshot .frac{display:inline-flex!important;flex-direction:column!important;vertical-align:middle!important;text-align:center!important}.problem-share-snapshot .fr-n{border-bottom:1px solid #000!important}.problem-share-snapshot .share-option{padding:6px!important;border:1px solid #777!important}.problem-share-snapshot .text-space{min-height:54px!important;border-bottom:1px solid #888!important}';
    host.append(style,snapshot);document.body.appendChild(host);
    try {
        await timed(Promise.all(Array.from(snapshot.querySelectorAll('img')).map(image=>image.decode())));
        const blocks=[];let total=0;
        const elements=[];
        function collect(parent) {
            for(const child of Array.from(parent.children)) {
                if(child.matches('.grid-2,.grid-3')&&!child.matches('.q-row')) {
                    child.style.display='block';collect(child);
                } else elements.push(child);
            }
        }
        collect(snapshot);
        for(const element of elements){
            if(!stillCurrent())throw new Error('問題またはアカウントが変わりました。');
            const rect=element.getBoundingClientRect(),height=Math.ceil(rect.height);
            if(!height)continue;
            if(height>2200||height*640>2000000||(total+=height*640)>16000000)throw new Error('問題が多いためPDFを作れません。問題数を減らしてください。');
            const canvas=await timed(draw(element,{scale:1,width:640,height,backgroundColor:'#ffffff',logging:false,useCORS:false,allowTaint:false,windowWidth:640,scrollX:0,scrollY:0}));
            blocks.push(grayscaleProblemBlock({width:640,height,rgba:canvas.getContext('2d').getImageData(0,0,640,height).data}));
            canvas.width=canvas.height=0;
        }
        return paginateProblemBlocks(blocks).pages;
    }catch(e){if(/^pages_/.test(e.message))throw new Error('途中で切らずにPDFへ収められません。問題数を減らしてください。');throw e;}
    finally{host.remove();}
}
export async function createSharedProblem(snapshot,{request,stillCurrent}) {
    const pages=await renderProblemPages(snapshot,stillCurrent),encoded=[];
    for(const page of pages){encoded.push(await encodePage(page));page.pixels=null;}
    if(!stillCurrent())throw new Error('問題またはアカウントが変わりました。');
    const response=await request('/problem-share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pages:encoded})});
    if(!response.ok)throw new Error(response.status===429?'今日は共有の上限に達しました。':'共有リンクを作れませんでした。接続を確認してください。');
    const share=await response.json();
    if(!/^[a-f0-9]{48}$/.test(share.id)||!Number.isFinite(share.expiresAt))throw new Error('共有リンクを確認できませんでした。');
    if(!stillCurrent()){
        const revoked=await request('/problem-share?revoke='+share.id,{method:'POST'});
        if(!revoked.ok)throw new Error('作成中にアカウントが変わりました。元のアカウントの「作ったPDFリンク」で共有を停止してください。');
        throw new Error('問題またはアカウントが変わったため共有を停止しました。');
    }
    return share;
}
