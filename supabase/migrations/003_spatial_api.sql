-- Common API functions: run after 001 (fresh) OR 002 (upgrade).
begin;
create schema if not exists private;
create table if not exists private.report_limits (
 key text primary key, window_started timestamptz not null, attempts integer not null
);
create index if not exists report_limits_expiry_idx on private.report_limits(window_started);
revoke all on schema private from public,anon,authenticated;
revoke all on private.report_limits from public,anon,authenticated;

create or replace function public.viewport_envelopes(min_long double precision,min_lat double precision,max_long double precision,max_lat double precision)
returns setof extensions.geometry language plpgsql immutable set search_path='' as $$
begin
 if min_long is null or min_lat is null or max_long is null or max_lat is null
 or abs(min_long)>180 or abs(max_long)>180 or min_lat < -85.051129 or max_lat>85.051129 or min_lat>=max_lat or min_long=max_long then
  raise exception 'Invalid map bounding box.';
 end if;
 if min_long<=max_long then
  return query select extensions.st_makeenvelope(min_long,min_lat,max_long,max_lat,4326);
 else
  -- Two indexed envelopes handle Alaska / Aleutians across the date line.
  return query select extensions.st_makeenvelope(min_long,min_lat,180,max_lat,4326);
  return query select extensions.st_makeenvelope(-180,min_lat,max_long,max_lat,4326);
 end if;
end;
$$;

create or replace function public.stations_in_view(min_long double precision,min_lat double precision,max_long double precision,max_lat double precision,after_id text default '',page_size integer default 1000)
returns jsonb language sql stable security invoker set search_path='' as $$
 with candidates as materialized (
  select s.id,s.name,s.brand,s.address,s.city,s.zip,s.state_code as state,s.lat,s.lng,s.membership,s.fuels,s.prices,s.source
  from public.viewport_envelopes(min_long,min_lat,max_long,max_lat) as boxes(envelope)
  join public.stations s on s.location operator(extensions.&&) envelope
  where s.is_active and s.country_code='US' and s.id>after_id
  order by s.id limit greatest(1,least(page_size,2000))+1
 ), page as (select * from candidates order by id limit greatest(1,least(page_size,2000)))
 select jsonb_build_object(
  'stations',coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from page p),'[]'::jsonb),
  'nextCursor',case when (select count(*) from candidates)>greatest(1,least(page_size,2000)) then (select max(id) from page) else null end
 );
$$;

create or replace function public.station_clusters_in_view(min_long double precision,min_lat double precision,max_long double precision,max_lat double precision,map_zoom integer default 4)
returns jsonb language sql stable security invoker set search_path='' as $$
 with visible as (
  select s.id,s.lat,s.lng from public.viewport_envelopes(min_long,min_lat,max_long,max_lat) as boxes(envelope)
  join public.stations s on s.location operator(extensions.&&) envelope
  where s.is_active and s.country_code='US'
 ), grid as (
  select *,floor((lng+180)/(360.0/power(2,greatest(0,least(map_zoom,7))+2))) gx,
  floor((lat+90)/(360.0/power(2,greatest(0,least(map_zoom,7))+2))) gy from visible
 ), clusters as (
  select gx::text||':'||gy::text as id,avg(lat) lat,avg(lng) lng,count(*) as count,
  jsonb_build_array(min(lng),min(lat),max(lng),max(lat)) bounds
  from grid group by gx,gy
 )
 select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) from clusters c;
$$;

create or replace function public.cache_reported_price() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.stations where id=new.station_id for update;
 new.created_at:=clock_timestamp();
 update public.stations set prices=jsonb_set(prices,array[new.fuel],
 jsonb_build_object('price',new.price,'handle',new.handle,'reportedAt',new.created_at),true)
 where id=new.station_id;
 return new;
end;
$$;
drop trigger if exists cache_reported_price on public.price_reports;
create trigger cache_reported_price before insert on public.price_reports for each row execute function public.cache_reported_price();

create or replace function public.submit_public_price(p_station_id text,p_fuel text,p_price numeric,p_handle text,p_throttle_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare count_attempts integer; saved public.price_reports;
begin
 if p_fuel is null or p_fuel not in ('regular','midgrade','premium','diesel','e85')
 or p_price is null or p_price<1 or p_price>15 or p_price<>round(p_price,3)
 or p_handle is null or p_handle !~ '^[A-Za-z0-9_]{3,24}$'
 or p_throttle_key is null or p_throttle_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid public price report.'; end if;
 if not exists(select 1 from public.stations where id=p_station_id and is_active) then raise exception 'Station does not exist.'; end if;
 insert into private.report_limits(key,window_started,attempts) values(p_throttle_key,clock_timestamp(),1)
 on conflict(key) do update set
 attempts=case when private.report_limits.window_started<clock_timestamp()-interval '1 minute' then 1 else private.report_limits.attempts+1 end,
 window_started=case when private.report_limits.window_started<clock_timestamp()-interval '1 minute' then clock_timestamp() else private.report_limits.window_started end
 returning attempts into count_attempts;
 if count_attempts>10 then raise exception 'Too many reports. Please wait a minute.'; end if;
 insert into public.price_reports(station_id,fuel,price,handle) values(p_station_id,p_fuel,p_price,p_handle) returning * into saved;
 return jsonb_build_object('id',saved.id,'stationId',saved.station_id,'fuel',saved.fuel,'price',saved.price,'handle',saved.handle,'reportedAt',saved.created_at);
end;
$$;
revoke all on function public.viewport_envelopes(double precision,double precision,double precision,double precision) from public;
revoke all on function public.stations_in_view(double precision,double precision,double precision,double precision,text,integer) from public;
revoke all on function public.station_clusters_in_view(double precision,double precision,double precision,double precision,integer) from public;
revoke all on function public.submit_public_price(text,text,numeric,text,text) from public,anon,authenticated;
revoke all on function public.cache_reported_price() from public,anon,authenticated;
grant execute on function public.viewport_envelopes(double precision,double precision,double precision,double precision) to anon,service_role;
grant execute on function public.stations_in_view(double precision,double precision,double precision,double precision,text,integer) to anon,service_role;
grant execute on function public.station_clusters_in_view(double precision,double precision,double precision,double precision,integer) to anon,service_role;
grant execute on function public.submit_public_price(text,text,numeric,text,text) to service_role;
commit;
