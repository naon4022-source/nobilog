    let turnstileToken = '', turnstileWidgetId = null, turnstileRetry = null, turnstileLoadedAt = 0;
    function turnstileMessage(message) { document.getElementById('login-err').innerText = message; }
    function turnstileReset() {
        turnstileToken = ''; turnstileLoadedAt = 0;
        try { if(window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId); }
        catch(e) { turnstileWidgetId = null; turnstileMessage('本人確認を読み込めませんでした。「本人確認をやり直す」を押してください。'); }
    }
    function turnstileEnsure() {
        clearTimeout(turnstileRetry);
        if(!window.turnstile) {
            if(!turnstileLoadedAt)turnstileLoadedAt=Date.now();
            if(Date.now()-turnstileLoadedAt>=15000){turnstileMessage('本人確認を読み込めません。通信やブラウザのブロック設定を確認し、再読み込みしてください。');return;}
            turnstileRetry = setTimeout(turnstileEnsure, 250); return;
        }
        if(turnstileWidgetId !== null) { turnstileReset(); return; }
        const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        try { turnstileWidgetId = window.turnstile.render('#turnstile-widget', {
            sitekey: local ? TURNSTILE_LOCAL_TEST_KEY : TURNSTILE_SITE_KEY,
            action:'legacy_login', theme:'auto', retry:'auto', 'refresh-expired':'auto', 'refresh-timeout':'auto',
            callback:t => { turnstileToken = t; turnstileLoadedAt=Date.now(); if(!authLegacyBusy)turnstileMessage(''); },
            'expired-callback':() => { turnstileToken = ''; if(!authLegacyBusy)turnstileMessage('本人確認の有効時間が切れました。確認し直してからログインしてください。'); },
            'timeout-callback':() => { turnstileToken = ''; if(!authLegacyBusy)turnstileMessage('本人確認が時間切れになりました。もう一度確認してください。'); },
            'error-callback':() => { turnstileToken = ''; if(!authLegacyBusy)turnstileMessage('本人確認を完了できませんでした。「本人確認をやり直す」を押してください。'); }
        }); } catch(e) { turnstileWidgetId=null; turnstileMessage('本人確認を表示できませんでした。「本人確認をやり直す」を押してください。'); }
    }
    function turnstileRetryNow(){
        if(authLegacyBusy)return;
        turnstileLoadedAt=0;turnstileMessage('本人確認を読み込んでいます…');turnstileEnsure();
    }
