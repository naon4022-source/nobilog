"""Scoped, authorized grant undo. Only status flags leave the database."""
import importlib.util
import json
from pathlib import Path
import sys
import time
from queries import query

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('recovery_cli',HERE.parents[1]/'releases/souta-key-recovery-20261023/register-local.py')
cli=importlib.util.module_from_spec(spec)
spec.loader.exec_module(cli)


def remote(kind):
    result=cli.cli(['d1','execute','AUTH_DB','--remote','--command',query(kind,int(time.time()*1000)),'--json','--config',str(cli.CONFIG)],worker=False)
    if result.returncode:
        raise RuntimeError('Remote operation result unconfirmed; no automatic resend; raw output suppressed.')
    rows=None
    for i,char in enumerate(result.stdout):
        if char!='[':continue
        try:
            rows,_=json.JSONDecoder().raw_decode(result.stdout[i:])
            break
        except ValueError:
            pass
    if not isinstance(rows,list):raise RuntimeError('Unknown response; no automatic resend.')
    records=[record for item in rows for record in item.get('results',[])]
    if kind=='check':
        assert len(records)==1 and set(records[0])=={'grant_unclaimed','test_lease_ended'}
        assert all(value in (0,1) for value in records[0].values())
    else:
        allowed={'ready','not_ready_no_changes'} if kind=='preview' else {'manifest_updated','grant_undone','test_session_ended'}
        assert all(set(record)=={'status'} and record['status'] in allowed for record in records)
    return records


if __name__=='__main__':
    try:
        mode=sys.argv[1]
        assert mode in ('preview','apply','check')
        if mode=='apply':
            before=remote('preview')
            if before!=[{'status':'ready'}]:
                raise RuntimeError('Preconditions not met; no data changed; needs scoped diagnosis.')
            changed=remote('apply')
            assert sum(row['status']=='grant_undone' for row in changed)==1
            assert sum(row['status']=='manifest_updated' for row in changed)==1
            after=remote('check')
            assert after==[{'grant_unclaimed':1,'test_lease_ended':1}]
            receipt={'status':'first grant undone; ready for Souta first use','grantUnclaimed':True,'testSessionEnded':True,'otherUsersTargeted':False,'learningKeysChanged':False,'userDataExported':False,'accountLoginReportedByUser':True,'operatorLoginRecheckAfterUndo':False}
            (HERE/'result.json').write_text(json.dumps(receipt,indent=2)+'\n')
            print(json.dumps(receipt))
        else:
            print(json.dumps({'mode':mode,'result':remote(mode),'userDataExported':False}))
    except Exception as error:
        raise SystemExit(str(error) if isinstance(error,RuntimeError) else 'Stopped; do not resend a mutation before checking its result.') from None
