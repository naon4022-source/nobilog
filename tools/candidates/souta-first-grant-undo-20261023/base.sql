WITH
manifest AS MATERIALIZED (
 SELECT v AS body FROM auth_kv WHERE k='cloud-save:u4' AND json_valid(v)
),
snapshot AS MATERIALIZED (
 SELECT v AS body FROM auth_kv WHERE k='cloud-save:u4:000' AND json_valid(v)
),
money AS MATERIALIZED (
 SELECT j.key, j.value AS body
 FROM snapshot, json_each(snapshot.body, '$.keys') AS j
 WHERE j.key IN ('u4:money','u4:money.bak','u4:money.bak2')
),
parsed AS MATERIALIZED (
 SELECT key,body,
 CASE WHEN json_valid(body) THEN
   (SELECT count(*) FROM json_each(body,'$.grants') WHERE value='20261018-souta-start-cash')
 ELSE -1 END AS claimed
 FROM money
),
valid AS MATERIALIZED (
 SELECT 1 AS ready WHERE
 (SELECT count(*) FROM manifest)=1 AND (SELECT count(*) FROM snapshot)=1
 AND (SELECT json_extract(body,'$.parts') FROM manifest)=1
 AND (SELECT json_extract(body,'$.v') FROM manifest)=(SELECT json_extract(body,'$.v') FROM snapshot)
 AND (SELECT json_type(body,'$.v') FROM snapshot)='integer'
 AND (SELECT json_extract(body,'$.v') FROM snapshot) BETWEEN 1 AND 9007199254740990
 AND (SELECT json_type(body,'$.keys') FROM snapshot)='object'
 AND (SELECT length(body) FROM snapshot)<550000
 AND NOT EXISTS (SELECT 1 FROM snapshot,json_each(snapshot.body,'$.keys') j WHERE j.type<>'text' OR substr(j.key,1,3)<>'u4:')
 AND (SELECT count(*) FROM parsed WHERE key='u4:money' AND claimed=1)=1
 AND NOT EXISTS (
  SELECT 1 FROM parsed p WHERE
  CASE WHEN NOT json_valid(p.body) THEN 1
   WHEN json_type(p.body)<>'object' THEN 1
   WHEN p.claimed NOT IN (0,1) THEN 1
   WHEN p.claimed=0 THEN 0
   WHEN json_type(p.body,'$.grants')<>'array' OR json_type(p.body,'$.ledger')<>'array' THEN 1
   WHEN EXISTS (SELECT 1 FROM json_each(p.body,'$.grants') WHERE type<>'text') THEN 1
   WHEN EXISTS (SELECT 1 FROM json_each(p.body,'$.ledger') WHERE type<>'object') THEN 1
   WHEN COALESCE(json_type(p.body,'$.cash'),'') NOT IN ('integer','real') OR json_extract(p.body,'$.cash')<1000000 THEN 1
   WHEN COALESCE(json_type(p.body,'$._sv'),'integer')<>'integer' THEN 1
   WHEN COALESCE(json_extract(p.body,'$._sv'),0) NOT BETWEEN 0 AND 9007199254740990 THEN 1
   WHEN (SELECT count(*) FROM json_each(p.body,'$.ledger') l
       WHERE json_extract(l.value,'$.t')='とくべつ配布' AND json_extract(l.value,'$.amt')=1000000)<>1 THEN 1
   ELSE 0 END=1
 )
),
revision AS MATERIALIZED (
 SELECT MAX(COALESCE(json_extract(body,'$._sv'),0))+1 AS n FROM parsed,valid
),
edited_money AS MATERIALIZED (
 SELECT p.key, CASE WHEN p.claimed=1 THEN
  json_set(p.body,
   '$.cash',json_extract(p.body,'$.cash')-1000000,
   '$.grants',json((SELECT json_group_array(value) FROM json_each(p.body,'$.grants') WHERE value<>'20261018-souta-start-cash')),
   '$.ledger',json((SELECT json_group_array(json(value)) FROM json_each(p.body,'$.ledger') l
       WHERE COALESCE(json_extract(l.value,'$.t')='とくべつ配布' AND json_extract(l.value,'$.amt')=1000000,0)=0)),
   '$._sv',(SELECT n FROM revision),'$._at',__NOW_MS__)
 ELSE p.body END AS body FROM parsed p,valid
),
edited_keys AS MATERIALIZED (
 SELECT json_group_object(j.key,substr(COALESCE(e.body,j.value),1)) AS body
 FROM snapshot,valid,json_each(snapshot.body,'$.keys') j LEFT JOIN edited_money e ON e.key=j.key
),
edited_snapshot AS MATERIALIZED (
 SELECT json_set(snapshot.body,'$.keys',json(edited_keys.body),'$.v',json_extract(snapshot.body,'$.v')+1,'$.at',__NOW_MS__) AS body
 FROM snapshot,edited_keys,valid
)
