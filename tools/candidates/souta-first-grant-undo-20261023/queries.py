from pathlib import Path

HERE = Path(__file__).resolve().parent


def query(kind, now):
    assert kind in ('preview', 'apply', 'check')
    base = (HERE / 'base.sql').read_text().replace('__NOW_MS__', str(int(now)))
    if kind == 'preview':
        return base + "SELECT CASE WHEN EXISTS(SELECT 1 FROM valid) THEN 'ready' ELSE 'not_ready_no_changes' END AS status;"
    if kind == 'apply':
        return base + """
UPDATE auth_kv SET
 v=CASE
  WHEN k='cloud-save:u4' THEN (SELECT json_set(body,'$.v',json_extract(body,'$.v')+1,'$.at',__NOW_MS__,'$.parts',1) FROM manifest)
  WHEN k='cloud-save:u4:000' THEN (SELECT body FROM edited_snapshot)
  ELSE '' END,
 expires_at=0
WHERE EXISTS(SELECT 1 FROM valid) AND (
 k IN ('cloud-save:u4','cloud-save:u4:000','active-session:u4')
 OR (substr(k,1,8)='session:' AND CASE WHEN json_valid(v) THEN json_extract(v,'$.uid')='u4' ELSE 0 END)
)
RETURNING CASE WHEN k='cloud-save:u4' THEN 'manifest_updated'
 WHEN k='cloud-save:u4:000' THEN 'grant_undone'
 ELSE 'test_session_ended' END AS status;
""".replace('__NOW_MS__', str(int(now)))
    # Only booleans leave D1. Never return money, saved records or session keys.
    return """
SELECT
 NOT EXISTS(SELECT 1 FROM auth_kv s,json_each(s.v,'$.keys') j
  WHERE s.k='cloud-save:u4:000' AND j.key IN ('u4:money','u4:money.bak','u4:money.bak2')
  AND EXISTS(SELECT 1 FROM json_each(j.value,'$.grants') WHERE value='20261018-souta-start-cash')) AS grant_unclaimed,
 NOT EXISTS(SELECT 1 FROM auth_kv WHERE k='active-session:u4' AND v<>'') AS test_lease_ended;
"""
