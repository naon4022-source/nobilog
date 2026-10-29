from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;p=H/'candidate/pages/index.html';s=p.read_text()
def once(a,b):
 global s
 assert s.count(a)==1,(a[:70],s.count(a));s=s.replace(a,b,1)
once('    let googleLinkNoticeState=',(H/'settings-adapter.part').read_text()+'    let googleLinkNoticeState=')
once('    async function tryLogin(linkProvider) {\n        if(authLegacyBusy)return;','    async function tryLogin(linkProvider) {\n        if(authLegacyBusy)return;\n        const managementAtStart=googleManagePending;')
once("            pinFail = 0; authLegacyTicket = d.ticket;", "            if(managementAtStart&&googleManagePending!==managementAtStart)return;\n            pinFail = 0; authLegacyTicket = d.ticket;")
once("            if(linkProvider==='google'||linkProvider==='line')", "            if(googleManagePending){await authGoogleManageComplete(d.ticket);return;}\n            if(linkProvider==='google'||linkProvider==='line')")
once('    function authShowMain() {','    function authShowMain() {\n        if(googleManagePending){authGoogleManageCancel();return;}')
once('    async function logoutUser() {','    async function logoutUser() {\n        authGoogleManageCancel();googleSettingsController?.dispose();googleSettingsController=null;')
once('    function switchView(id) {',"    function switchView(id) {\n        if(id!=='settings'){authGoogleManageCancel();googleSettingsController?.dispose();googleSettingsController=null;}")
once('        <div class="section"><h3>記録の保存</h3>', '        <div id="google-account-settings"></div>\n        <div class="section"><h3>記録の保存</h3>')
once('    }\n    function appSyncSummaryHtml()', '        authGoogleSettingsMount();\n    }\n    function appSyncSummaryHtml()')
once('    <script src="/life.js"', '    <script src="/google-settings.js" defer></script>\n    <script src="/life.js"') if '    <script src="/life.js"' in s else once('    <meta name="application-version"','    <script src="/google-settings.js" defer></script>\n    <meta name="application-version"')
# Keep the update history factual and include the final requested scope.
once('パスワードと本人確認の後、Googleを既存の本人アカウントへ連携できます。新規アカウント作成は不要です。','なお・りらん・そうたの設定でGoogle連携状態を確認し、本人確認後に連携・解除できます。学習記録は保持します。')
p.write_text(s);(H/'candidate/pages/google-settings.js').write_bytes((H/'google-settings.js').read_bytes())
(H/'settings-integration.json').write_text(json.dumps({'status':'prepared; verification pending','publicBase':'2.16.0','candidate':'2.17.0','htmlSha256':hashlib.sha256(s.encode()).hexdigest(),'users':['u1','u2','u4'],'realAccountsChanged':False},indent=2)+'\n')
print('Settings and reauthentication adapter connected in public-only candidate')
