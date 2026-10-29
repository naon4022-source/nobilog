// No password or session in source/URL/storage. The preview validates its own password.
async function previewPasswordEnter(pin) {
    const target='https://nobilog-preview.naon4022.workers.dev';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    let response;
    try {response=await fetch(target+'/preview-password',{method:'POST',credentials:'omit',signal:controller.signal,
        headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:pin})});}
    catch(e){return false;}finally{clearTimeout(timer);}
    if(!response.ok)return false;
    const data=await response.json().catch(()=>({}));
    if(!/^[-_A-Za-z0-9]{43}$/.test(data.ticket||''))return false;
    document.getElementById('login-pin').value='';
    const policy=document.createElement('meta');policy.name='referrer';policy.content='strict-origin';document.head.appendChild(policy);
    const form=document.createElement('form');form.method='POST';form.action=target+'/preview-enter';
    const input=document.createElement('input');input.type='hidden';input.name='ticket';input.value=data.ticket;
    form.appendChild(input);document.body.appendChild(form);form.submit();return true;
}
