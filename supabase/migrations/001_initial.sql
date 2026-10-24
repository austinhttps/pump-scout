-- Fresh install. For an existing v1 database use 002, then 003 instead.
begin;
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create table public.stations (
 id text primary key check (id ~ '^[A-Za-z0-9:_./-]{1,140}$'),
 name text not null check (char_length(name) between 1 and 100),
 brand text not null default 'Independent',
 address text not null default 'Street address not listed',
 city text not null default '', zip text not null default '',
 state_code text, country_code text not null default 'US' check (country_code='US'),
 lat double precision not null check (lat between 18 and 72),
 lng double precision not null check (lng between -180 and 180),
 location extensions.geometry(Point,4326) generated always as (extensions.st_setsrid(extensions.st_makepoint(lng,lat),4326)) stored,
 membership boolean not null default false,
 fuels text[], prices jsonb not null default '{}'::jsonb,
 source text not null default 'openstreetmap',
 is_active boolean not null default true
);
create index stations_location_gix on public.stations using gist(location) where is_active;
create table public.price_reports (
 id uuid primary key default gen_random_uuid(),
 station_id text not null references public.stations(id) on delete cascade,
 fuel text not null check (fuel in ('regular','midgrade','premium','diesel','e85')),
 price numeric(5,3) not null check (price between 1 and 15),
 handle text not null default 'Anonymous' check (handle ~ '^[A-Za-z0-9_]{3,24}$'),
 created_at timestamptz not null default now()
);
create index price_reports_latest_idx on public.price_reports(station_id,fuel,created_at desc);
alter table public.stations enable row level security;
alter table public.price_reports enable row level security;
create policy stations_read on public.stations for select to anon using (is_active);
revoke all on public.stations,public.price_reports from anon,authenticated;
grant select on public.stations to anon;
commit;
