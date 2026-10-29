// Push-only preview worker. Do not cache authenticated pages or records.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{
    let notice;try{notice=e.data?.json();}catch(_){return;}
    if(!notice||typeof notice.id!=='string'||!/^[A-Za-z0-9:._-]{1,180}$/.test(notice.id)||typeof notice.title!=='string'||!notice.title||typeof notice.body!=='string')return;
    const url=new URL('/',self.location.origin);url.searchParams.set('notice',notice.id);
    e.waitUntil(self.registration.showNotification(notice.title.slice(0,100),{body:notice.body.slice(0,450),icon:'/icon-192.png',badge:'/favicon-64.png',tag:'nobilog-'+notice.id,data:{url:url.href}}));
});
self.addEventListener('notificationclick',e=>{
    e.notification.close();
    e.waitUntil((async()=>{
        let target;try{target=new URL(e.notification.data?.url||'/',self.location.origin);}catch(_){return;}
        if(target.origin!==self.location.origin||target.pathname!=='/')return;
        const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
        const open=windows.find(c=>new URL(c.url).origin===target.origin);
        if(open){await open.focus();await open.navigate(target.href);}else await self.clients.openWindow(target.href);
    })());
});
