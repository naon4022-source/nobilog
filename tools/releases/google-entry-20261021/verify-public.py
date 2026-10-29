"""Static deployment coherence and unauthenticated rejection only. No real login or records."""
from pathlib import Path
import argparse, hashlib, json, subprocess, time

ROOT = Path(__file__).resolve().parent

def request(url, body=None):
    command = ['curl','--silent','--show-error','--location','--proto-redir','=https','--max-redirs','5','--max-time','30','--write-out','\n%{http_code}',url]
    if body is not None:
        command.extend(['--header','Content-Type: application/json','--data-binary',json.dumps(body)])
    result = subprocess.run(command,capture_output=True)
    if result.returncode:
        raise RuntimeError('public request failed')
    content, code = result.stdout.rsplit(b'\n',1)
    return int(code), content

def verify_static():
    count = 0
    for p in sorted((ROOT/'candidate/pages').iterdir()):
        if p.name == '_headers':
            continue
        status, body = request('https://nobilog.pages.dev/'+('' if p.name=='index.html' else p.name))
        if status != 200 or body != p.read_bytes():
            raise RuntimeError('published candidate mismatch: '+p.name)
        count += 1
    return count

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--static-only',action='store_true')
    parser.add_argument('--attempts',type=int,default=1)
    args=parser.parse_args()
    for attempt in range(args.attempts):
        try:
            count=verify_static()
            break
        except RuntimeError:
            if attempt+1==args.attempts:
                raise
            time.sleep(3)
    if not args.static_only:
        worker='https://nobilog-board.naon4022.workers.dev'
        for route in ['/auth/me','/auth/google','/school-results','/school-calendar','/save?user=u4']:
            status,_=request(worker+route)
            if status != 401:
                raise RuntimeError('unauthenticated endpoint did not reject: '+route)
            count+=1
        for path in ['/auth/google/link','/auth/google/unlink']:
            status,_=request(worker+path,{})
            if status!=401: raise RuntimeError('unauthenticated Google operation did not reject')
            count+=1
        status,_=request(worker+'/auth/link/google',{})
        if status!=401:
            raise RuntimeError('unauthenticated Google linking did not reject')
        count+=1
        status,_=request(worker+'/auth/legacy',{'pin':'synthetic-invalid-not-a-real-pin','turnstile':''})
        if status!=403:
            raise RuntimeError('missing Turnstile did not reject')
        count+=1
        (ROOT/'public-result.json').write_text(json.dumps({'passed':True,'checks':count,'realLoginPerformed':False,'realUserDataRead':False,'checkedAt':time.time()},indent=2)+'\n')
    print('Published candidate matches; checks:',count,'; no real login or record access')

if __name__=='__main__':
    try:
        main()
    except (RuntimeError,ValueError) as error:
        raise SystemExit(str(error))
