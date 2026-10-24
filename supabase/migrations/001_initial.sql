begin;

create table public.stations (
  id text primary key,
  name text not null check (char_length(name) between 1 and 100),
  brand text not null,
  address text not null,
  city text not null,
  zip text not null,
  lat double precision not null check (lat between 18 and 72),
  lng double precision not null check (lng between -180 and 180),
  membership boolean not null default false
);
create index stations_location_idx on public.stations(lat,lng);
create table public.price_reports (
  id uuid primary key default gen_random_uuid(),
  station_id text not null references public.stations(id) on delete cascade,
  fuel text not null check (fuel in ('regular','midgrade','premium','diesel','e85')),
  price numeric(5,3) not null check (price between 1 and 15),
  handle text not null check (handle ~ '^[A-Za-z0-9_]{3,24}$'),
  author_id uuid not null references auth.users(id) on delete cascade,
  photo_path text,
  created_at timestamptz not null default now(),
  check (photo_path is null or photo_path like author_id::text || '/%')
);
create index price_reports_latest_idx on public.price_reports(station_id,fuel,created_at desc);
create index price_reports_author_idx on public.price_reports(author_id,created_at desc);
create table public.station_reviews (
  id uuid primary key default gen_random_uuid(),
  station_id text not null references public.stations(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  handle text not null check (handle ~ '^[A-Za-z0-9_]{3,24}$'),
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 3 and 1000),
  created_at timestamptz not null default now(),
  unique (station_id,author_id)
);

alter table public.stations enable row level security;
alter table public.price_reports enable row level security;
alter table public.station_reviews enable row level security;
create policy stations_read on public.stations for select to anon,authenticated using (true);
create policy reports_read on public.price_reports for select to anon,authenticated using (true);
create policy reports_insert on public.price_reports for insert to authenticated with check ((select auth.uid())=author_id);
create policy reviews_read on public.station_reviews for select to anon,authenticated using (true);
create policy reviews_insert on public.station_reviews for insert to authenticated with check ((select auth.uid())=author_id);
create policy reviews_update on public.station_reviews for update to authenticated using ((select auth.uid())=author_id) with check ((select auth.uid())=author_id);

revoke all on public.stations,public.price_reports,public.station_reviews from anon,authenticated;
grant select on public.stations,public.price_reports,public.station_reviews to anon,authenticated;
grant insert(station_id,fuel,price,handle,author_id,photo_path) on public.price_reports to authenticated;
grant insert(station_id,author_id,handle,rating,body) on public.station_reviews to authenticated;
grant update(station_id,author_id,handle,rating,body) on public.station_reviews to authenticated;

create function public.guard_price_report() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or new.author_id <> auth.uid() then
    raise exception 'Sign in to submit a price report.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if exists(select 1 from public.price_reports where author_id=auth.uid() and created_at > now()-interval '30 seconds') then
    raise exception 'Please wait 30 seconds between price reports.';
  end if;
  new.created_at := now();
  return new;
end;
$$;
create trigger guard_price_report before insert on public.price_reports for each row execute function public.guard_price_report();

create function public.guard_station_review() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or new.author_id <> auth.uid() then
    raise exception 'Sign in to leave a review.';
  end if;
  if tg_op='UPDATE' and (new.station_id<>old.station_id or new.author_id<>old.author_id) then
    raise exception 'A review cannot be moved to another station or author.';
  end if;
  new.created_at := now();
  return new;
end;
$$;
create trigger guard_station_review before insert or update on public.station_reviews for each row execute function public.guard_station_review();
revoke all on function public.guard_price_report(),public.guard_station_review() from public,anon,authenticated;

create view public.latest_prices with (security_invoker=true) as
select distinct on (station_id,fuel)
  station_id,fuel,price,handle,created_at
from public.price_reports order by station_id,fuel,created_at desc,id desc;
grant select on public.latest_prices to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('price-photos','price-photos',false,5242880,array['image/jpeg','image/png'])
on conflict(id) do nothing;
create policy photos_insert on storage.objects for insert to authenticated with check(bucket_id='price-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy photos_read_own on storage.objects for select to authenticated using(bucket_id='price-photos' and owner_id=(select auth.uid())::text);
create policy photos_delete_own on storage.objects for delete to authenticated using(bucket_id='price-photos' and owner_id=(select auth.uid())::text);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='price_reports') then
   alter publication supabase_realtime add table public.price_reports;
 end if;
end $$;
commit;

