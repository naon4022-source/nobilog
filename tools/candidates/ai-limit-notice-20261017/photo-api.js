    const photoApi=who=>({same:()=>cloudSame(who),newId:()=>crypto.randomUUID(),plan:()=>planKnown.uid===who.uid?planKnown.plan:null,
        async get(path){if(!cloudSame(who))throw Error('changed');const r=await cloudTry(cloudUrl(path),{cache:'no-store'},10000);if(!r.ok||!cloudSame(who))throw Error('get');const json=await r.json();if(!cloudSame(who))throw Error('changed');if(path==='/avatar-generations')window.NobiAITrialNotice?.show(json?.trial);return json;},
        async post(path,body){
            if(!cloudSame(who))throw Error('changed');
            const options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
            let r;
            if(path==='/avatar-generate'){
                if(typeof who.token!=='string'||!who.token)throw Error('changed');
                options.headers.Authorization='Bearer '+who.token;
                r=await cloudFetch(cloudUrl(path),options,75000);
            }else r=await cloudTry(cloudUrl(path),options,20000);
            if(!cloudSame(who))throw Error('changed');let json=null;try{json=await r.json();}catch(e){}if(!cloudSame(who))throw Error('changed');if(path==='/avatar-generate')window.NobiAITrialNotice?.show(json?.trial);return {ok:r.ok,status:r.status,json};},
        async image(id){const r=await cloudTry(cloudUrl('/learning-image?id='+encodeURIComponent(id)),{cache:'no-store'},15000);if(!r.ok||!cloudSame(who))throw Error('image');return URL.createObjectURL(await r.blob());},
        async fetchImage(src){const r=await fetch(src,{cache:'no-store'});if(!r.ok)throw Error('image');return r.blob();},
        async generatorStatus(){return this.get('/avatar-generations');},
        async imageBlob(id){if(!/^[a-f0-9]{64}$/.test(id)||!cloudSame(who))throw Error('image');const r=await cloudTry(cloudUrl('/learning-image?id='+id),{cache:'no-store'},15000);if(!r.ok||!cloudSame(who))throw Error('image');const b=await r.blob();if(!cloudSame(who))throw Error('changed');return b;},
        saved(){void avatarRefresh();}});
