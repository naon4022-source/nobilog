// Deferred after the original textbook API and the vision components.
(function(root){
'use strict';
if(root.nobiTextbookAIAPI&&root.NobiTextbookVisionAPI&&typeof root.textbookAIRequest==='function'){root.nobiTextbookAIAPI=root.NobiTextbookVisionAPI.extend(root.nobiTextbookAIAPI,root.textbookAIRequest);}
})(globalThis);
