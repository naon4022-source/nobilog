import copy
import json
import sqlite3
from queries import query

GID='20261018-souta-start-cash'
checks=0
def check(value):
    global checks
    assert value
    checks+=1

def fixture(change=None):
    db=sqlite3.connect(':memory:')
    db.execute('CREATE TABLE auth_kv (k TEXT PRIMARY KEY,v TEXT,expires_at INTEGER)')
    money={'cash':1010000,'bank':77,'grants':['fixture-other',GID], 'ledger':[{'t':'とくべつ配布','amt':1000000,'d':10},{'t':'fixture','amt':5},{'unrelated':True}], '_sv':4,'_at':10,'hold':{'fixture':3}}
    keys={'u4:money':json.dumps(money),'u4:money.bak':json.dumps(money),'u4:money.bak2':json.dumps({'cash':10000,'grants':[],'ledger':[],'_sv':3}),'u4:learning':json.dumps({'fixture':[1,2,3]})}
    data={'v':8,'at':10,'keys':keys}
    if change:change(data)
    for key,value in [('cloud-save:u4',json.dumps({'v':8,'at':10,'parts':1})),('cloud-save:u4:000',json.dumps(data)),('active-session:u4','fixture-owner'),('session:fixture-u4',json.dumps({'uid':'u4','provider':'pin'})),('session:fixture-u1',json.dumps({'uid':'u1'})),('cloud-save:u1','fixture-private-u1'),('cloud-save:u2','fixture-private-u2')]:
        db.execute('INSERT INTO auth_kv VALUES (?,?,?)',(key,value,99999999))
    return db,data

db,before=fixture()
untouched={k:v for k,v in db.execute("SELECT k,v FROM auth_kv WHERE k IN ('session:fixture-u1','cloud-save:u1','cloud-save:u2')")}
check(db.execute(query('preview',1000)).fetchone()[0]=='ready')
statuses=[r[0] for r in db.execute(query('apply',1000))]
check(statuses.count('grant_undone')==1 and statuses.count('manifest_updated')==1 and statuses.count('test_session_ended')==2)
after=json.loads(db.execute("SELECT v FROM auth_kv WHERE k='cloud-save:u4:000'").fetchone()[0])
check(after['v']==9 and after['at']==1000)
check(after['keys']['u4:learning']==before['keys']['u4:learning'])
check(after['keys']['u4:money.bak2']==before['keys']['u4:money.bak2'])
for key in ['u4:money','u4:money.bak']:
    item=json.loads(after['keys'][key])
    check(item['cash']==10000 and item['grants']==['fixture-other'])
    check(item['ledger']==[{'t':'fixture','amt':5},{'unrelated':True}])
    check(item['bank']==77 and item['hold']=={'fixture':3})
    check(item['_sv']==5 and item['_at']==1000)
check({k:v for k,v in db.execute("SELECT k,v FROM auth_kv WHERE k IN ('session:fixture-u1','cloud-save:u1','cloud-save:u2')")}==untouched)
check(db.execute(query('check',1000)).fetchone()==(1,1))
stable=list(db.execute('SELECT * FROM auth_kv ORDER BY k'))
check(list(db.execute(query('apply',2000)))==[])
check(list(db.execute('SELECT * FROM auth_kv ORDER BY k'))==stable)
# Reapplying the production grant after the reset gives it exactly once.
money=json.loads(after['keys']['u4:money'])
for _ in range(2):
    if GID not in money['grants']:
        money['grants'].append(GID);money['cash']+=1000000
check(money['cash']==1010000 and money['grants'].count(GID)==1)
db.close()

def edit(field,value):
    def change(data):
        m=json.loads(data['keys']['u4:money']);m[field]=value;data['keys']['u4:money']=json.dumps(m)
    return change
for change in [edit('cash',999999),edit('cash',None),edit('cash','1010000'),edit('grants',[]),edit('grants',[GID,GID]),edit('ledger',[]),edit('ledger',[{'t':'とくべつ配布','amt':1000000}]*2),edit('_sv','4'),lambda d:d['keys'].__setitem__('u4:money','broken'),lambda d:d['keys'].__setitem__('u1:forbidden','fixture'),lambda d:d.__setitem__('v',7)]:
    db,_=fixture(change)
    initial=list(db.execute('SELECT * FROM auth_kv ORDER BY k'))
    check(db.execute(query('preview',1000)).fetchone()[0]=='not_ready_no_changes')
    check(list(db.execute(query('apply',1000)))==[])
    check(list(db.execute('SELECT * FROM auth_kv ORDER BY k'))==initial)
    db.close()
db,_=fixture();db.execute("UPDATE auth_kv SET v=json_set(v,'$.parts',2) WHERE k='cloud-save:u4'")
check(db.execute(query('preview',1000)).fetchone()[0]=='not_ready_no_changes')
db.close()
print(f'Souta grant undo: {checks} isolated SQLite checks passed; exact grant/cash/ledger/backups, unrelated keys/users preserved, test logout, replay and malformed/spent/multi-part stops; no live data.')
