-- Run after setup in a disposable test database. All inserted test data rolls back.
begin;
insert into public.stations(id,name,lat,lng,source) values
 ('test-seattle','Test Seattle',47.6,-122.33,'test'),
 ('test-honolulu','Test Honolulu',21.3,-157.8,'test'),
 ('test-aleutian-west','Test west',52,179,'test'),
 ('test-aleutian-east','Test east',52,-179,'test');
do $$
declare result jsonb;
begin
 result:=public.stations_in_view(-123,47,-122,48);
 if not exists(select 1 from jsonb_array_elements(result->'stations') s where s->>'id'='test-seattle') then raise exception 'Seattle missing';end if;
 if exists(select 1 from jsonb_array_elements(result->'stations') s where s->>'id'='test-honolulu') then raise exception 'Viewport leaked Hawaii';end if;
 result:=public.stations_in_view(170,50,-130,72);
 if (select count(*) from jsonb_array_elements(result->'stations') s where s->>'id' in ('test-aleutian-west','test-aleutian-east'))<>2 then raise exception 'Date-line query missed a station';end if;
 if has_function_privilege('anon','public.submit_public_price(text,text,numeric,text,text)','EXECUTE') then raise exception 'Anonymous clients can bypass the report API';end if;
 if not exists(select 1 from pg_indexes where tablename='stations' and indexdef ilike '%using gist%') then raise exception 'Missing spatial index';end if;
end $$;
explain (analyze,buffers) select id from public.stations
where is_active and location operator(extensions.&&) extensions.st_makeenvelope(-123,47,-122,48,4326);
rollback;
