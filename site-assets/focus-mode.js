// Optional focus display. It changes presentation only; no answers or records are read.
(function () {
    'use strict';
    let active=false,native=false,timerHome=null,priorFocus=null;
    const el=id=>document.getElementById(id);
    function set(on) {
        const run=el('view-run'),bar=el('run-focus-bar'),button=el('run-focus-toggle');
        if(!run||!bar||!button)return false;
        if(on&&!run.classList.contains('active'))return false;
        if(active===on)return active;
        active=on;
        const timer=el('timer-box');
        if(on) {
            priorFocus=document.activeElement;
            if(timer&&timer.parentNode){timerHome=document.createComment('timer-home');timer.parentNode.insertBefore(timerHome,timer);bar.appendChild(timer);}
            document.body.classList.add('study-focus');
        } else {
            document.body.classList.remove('study-focus');
            if(timerHome){if(timer)timerHome.replaceWith(timer);else timerHome.remove();timerHome=null;}
            if(document.fullscreenElement===document.documentElement)document.exitFullscreen?.().catch(()=>{});
            native=false;
            if(priorFocus?.isConnected&&run.classList.contains('active'))priorFocus.focus?.();
            priorFocus=null;
        }
        button.textContent=on?'集中表示をやめる':'集中表示';
        button.setAttribute('aria-pressed',String(on));
        return active;
    }
    function toggle() {
        if(active){set(false);return;}
        if(!set(true))return;
        const request=document.documentElement.requestFullscreen;
        if(request) {
            try {
                Promise.resolve(request.call(document.documentElement)).then(()=>{
                    if(!active){if(document.fullscreenElement===document.documentElement)document.exitFullscreen?.().catch(()=>{});return;}
                    native=document.fullscreenElement===document.documentElement;
                }).catch(()=>{});
            }catch(_){/* Focus layout remains available when full screen is unavailable. */}
        }
    }
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){set(false);e.preventDefault();}});
    document.addEventListener('fullscreenchange',()=>{if(active&&native&&!document.fullscreenElement)set(false);});
    window.NobiFocus={toggle,exit:()=>set(false)};
})();
