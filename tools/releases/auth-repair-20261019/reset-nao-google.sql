-- Authorized one-time reset of Nao's Google linking. No auth/learning values are returned.
-- Tombstones prevent old KV fallback from restoring a removed binding or session.
INSERT INTO auth_kv(k,v,expires_at) VALUES('google-reset:u1','1',0)
ON CONFLICT(k) DO UPDATE SET v='1',expires_at=0;
UPDATE auth_kv SET v='',expires_at=0
WHERE k LIKE 'identity:google:%' AND v='u1' AND NOT EXISTS(SELECT 1 FROM auth_kv WHERE k='maintenance:20261019-nao-google-reset' AND v='done');
UPDATE auth_kv SET v='',expires_at=0
WHERE k LIKE 'session:%'
AND CASE WHEN json_valid(v) THEN json_extract(v,'$.uid') END='u1'
AND CASE WHEN json_valid(v) THEN json_extract(v,'$.provider') END='google' AND NOT EXISTS(SELECT 1 FROM auth_kv WHERE k='maintenance:20261019-nao-google-reset' AND v='done');
UPDATE auth_kv SET v='',expires_at=0
WHERE k LIKE 'oauth:%'
AND CASE WHEN json_valid(v) THEN json_extract(v,'$.uid') END='u1'
AND CASE WHEN json_valid(v) THEN json_extract(v,'$.provider') END='google' AND NOT EXISTS(SELECT 1 FROM auth_kv WHERE k='maintenance:20261019-nao-google-reset' AND v='done');
UPDATE auth_kv SET v='',expires_at=0 WHERE k LIKE 'legacy:%' AND v='u1' AND NOT EXISTS(SELECT 1 FROM auth_kv WHERE k='maintenance:20261019-nao-google-reset' AND v='done');
UPDATE auth_kv SET v='',expires_at=1 WHERE k='active-session:u1' AND NOT EXISTS(SELECT 1 FROM auth_kv WHERE k='maintenance:20261019-nao-google-reset' AND v='done');

INSERT INTO auth_kv(k,v,expires_at) VALUES('maintenance:20261019-nao-google-reset','done',0) ON CONFLICT(k) DO NOTHING;
