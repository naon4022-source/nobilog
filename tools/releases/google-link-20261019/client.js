    let googleLinkNoticeState={uid:null,at:0},googleLinkRequest=null;
    function authGoogleLinkNoticeItem() {
        if(!currentUser||currentUser.provider!=='pin'||currentUser.googleLinked===true||!['u1','u2','u4'].includes(currentUserId))return null;
        if(googleLinkNoticeState.uid!==currentUserId)googleLinkNoticeState={uid:currentUserId,at:Date.now()};
        return {id:'google-link:'+currentUserId,uid:currentUserId,googleLink:true,category:'other',at:googleLinkNoticeState.at,title:'Googleアカウントと連携してください',body:'次回からGoogleでログインできます。勉強の記録はそのまま引き継ぎます。通知を押して連携へ進めます。'};
    }
    function authGoogleLinkNotice() { const item=authGoogleLinkNoticeItem();if(item)noticeToast(item); }
    function authGoogleLinkOpen() {
        if(!authGoogleLinkNoticeItem())return;
        gOpenModal(`<h2>Googleアカウントと連携</h2><p><b>${esc(currentUser.name)}</b>のアカウントと連携します。本人のGoogleアカウントを選んでください。</p><p class="m-desc">Googleの画面へ移動します。問題を解いている途中なら、終えてから進めてください。</p><button id="google-link-go" data-owner="${currentUserId}" class="login-provider google" onclick="authGoogleLinkStart()">🌈 Googleアカウントと連携する</button><p id="google-link-status" role="status"></p><button class="btn btn-inactive" onclick="gCloseModal()">あとで</button>`);
    }
    async function authGoogleLinkStart() {
        const button=document.getElementById('google-link-go'),status=document.getElementById('google-link-status');
        const who={uid:currentUserId,token:authSession()};
        if(!button||button.dataset.owner!==who.uid||!who.token||!authGoogleLinkNoticeItem())return;
        if(googleLinkRequest&&googleLinkRequest.uid===who.uid&&googleLinkRequest.token===who.token)return;
        const attempt={...who};googleLinkRequest=attempt;button.disabled=true;
        const owned=()=>currentUserId===who.uid&&authSession()===who.token;
        const same=()=>owned()&&!authLeaseBlocked;
        try{
            status.textContent='保存状態を確認しています…';
            if(cloudDirty()){await cloudPush();if(!same()||cloudDirty())throw Error('save');}
            if(!same())return;
            status.textContent='Googleとの連携を準備しています…';
            const response=await cloudFetch(cloudUrl('/auth/link/google'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({return:location.origin+location.pathname})},10000);
            const data=await response.json();if(!same())return;
            if(!response.ok)throw Error('link');
            if(data.alreadyLinked){currentUser.googleLinked=true;for(const [id,n] of noticeToastMap)if(n.googleLink&&n.uid===who.uid)noticeDismiss(id);noticeRefresh();status.textContent='すでにGoogleアカウントと連携済みです。';return;}
            const target=new URL(data.url);
            if(target.origin!=='https://accounts.google.com'||target.pathname!=='/o/oauth2/v2/auth')throw Error('target');
            location.assign(target.href);
        }catch(e){if(owned()&&status.isConnected)status.textContent='保存または連携の準備を確認できませんでした。接続を確認して、もう一度試してください。';}
        finally{if(googleLinkRequest===attempt)googleLinkRequest=null;if(owned()&&button.isConnected)button.disabled=false;}
    }
