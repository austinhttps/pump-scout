-- Upgrade only an existing PumpScout v1 database. Preserves station/report history.
begin;
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
drop trigger if exists guard_price_report on public.price_reports;
drop function if exists public.guard_price_report();
drop policy if exists reports_insert on public.price_reports;
drop policy if exists reports_read on public.price_reports;
drop view if exists public.latest_prices;
alter table public.price_reports drop column if exists author_id;
-- Old photo references are retained as data but no longer used by the application.
alter table public.stations add column if not exists state_code text;
alter table public.stations add column if not exists country_code text not null default 'US' check (country_code='US');
alter table public.stations add column if not exists source text not null default 'legacy';
alter table public.stations add column if not exists is_active boolean not null default true;
alter table public.stations add column if not exists fuels text[];
alter table public.stations add column if not exists prices jsonb not null default '{}'::jsonb;
alter table public.stations add column if not exists location extensions.geometry(Point,4326) generated always as (extensions.st_setsrid(extensions.st_makepoint(lng,lat),4326)) stored;
drop index if exists public.stations_location_idx;
create index if not exists stations_location_gix on public.stations using gist(location) where is_active;
-- Retire the 16 illustrative station IDs shipped in v1; do not delete their records.
update public.stations set is_active=false where source='legacy' and id in (select 'station-'||n from generate_series(1,16) n);
do $$ begin
 if to_regclass('public.station_reviews') is not null then
  execute 'drop trigger if exists guard_station_review on public.station_reviews';
  execute 'drop policy if exists reviews_insert on public.station_reviews';
  execute 'drop policy if exists reviews_update on public.station_reviews';
  execute 'drop policy if exists reviews_read on public.station_reviews';
  execute 'alter table public.station_reviews drop column if exists author_id';
  execute 'revoke all on public.station_reviews from anon,authenticated';
 end if;
end $$;
drop function if exists public.guard_station_review();
drop policy if exists photos_insert on storage.objects;
drop policy if exists photos_read_own on storage.objects;
drop policy if exists photos_delete_own on storage.objects;
drop policy if exists stations_read on public.stations;
create policy stations_read on public.stations for select to anon using (is_active);
revoke all on public.stations,public.price_reports from anon,authenticated;
grant select on public.stations to anon;
-- Backfill per-station cached prices without a global DISTINCT lookup on each map request.
with latest as (
 select distinct on (station_id,fuel) station_id,fuel,price,handle,created_at
 from public.price_reports order by station_id,fuel,created_at desc,id desc
), prices as (
 select station_id,jsonb_object_agg(fuel,jsonb_build_object('price',price,'handle',handle,'reportedAt',created_at)) value
 from latest group by station_id
) update public.stations s set prices=p.value from prices p where p.station_id=s.id;
commit;
