// Reconcile safe, programmatically-created view nodes. Semantic keys prevent
// an in-progress tap from turning into a different action after a phase change.
export function reconcileChildren(parent,next){
 const children=[...next.childNodes];
 for(let i=0;i<children.length;i++){
  let old=parent.childNodes[i];const fresh=children[i],key=fresh.dataset?.coopKey;
  if(key!==undefined){
   const match=[...parent.childNodes].slice(i).find(node=>node.nodeName===fresh.nodeName&&node.dataset?.coopKey===key);
   if(!match){parent.insertBefore(fresh,old||null);continue;}
   if(match!==old)parent.insertBefore(match,old||null);old=match;
  }else if(old?.dataset?.coopKey!==undefined){parent.insertBefore(fresh,old);continue;}
  if(!old)parent.append(fresh);else reconcile(old,fresh);
 }
 while(parent.childNodes.length>children.length)parent.lastChild.remove();
}
function reconcile(old,fresh){
 if(old.nodeType!==fresh.nodeType||old.nodeName!==fresh.nodeName||old.dataset?.coopKey!==fresh.dataset?.coopKey){old.replaceWith(fresh);return;}
 if(old.nodeType===3){if(old.nodeValue!==fresh.nodeValue)old.nodeValue=fresh.nodeValue;return;}
 if(old.nodeType!==1)return;
 const questionChanged=old.dataset.coopAnswer!==fresh.dataset.coopAnswer;
 for(const attribute of [...old.attributes])if(!fresh.hasAttribute(attribute.name))old.removeAttribute(attribute.name);
 for(const attribute of [...fresh.attributes])if(old.getAttribute(attribute.name)!==attribute.value)old.setAttribute(attribute.name,attribute.value);
 old.onclick=fresh.onclick;old.onsubmit=fresh.onsubmit;old.oninput=fresh.oninput;
 if(old.nodeName==='TEXTAREA'&&(questionChanged||old.value!==fresh.value))old.value=fresh.value;
 // Text fields and checkbox consent keep the user's current value across
 // presence notifications. Removed forms and new semantic keys start afresh.
 reconcileChildren(old,fresh);
}
