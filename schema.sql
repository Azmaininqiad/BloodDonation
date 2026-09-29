-- =====================================================================
-- BLOODCONNECT - FULL SUPABASE SCHEMA
-- Paste into: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Designed for a FRESH project. Run the whole file once, top to bottom.
-- If pg_cron / pg_net fail to create, enable them first in
-- Dashboard -> Database -> Extensions, then re-run.
-- =====================================================================


-- =====================================================================
-- 0. EXTENSIONS
-- =====================================================================
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pg_net;


-- =====================================================================
-- 1. ENUM TYPES
-- =====================================================================
do $$ begin create type public.app_role as enum ('donor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin create type public.blood_type_enum as enum ('A+','A-','B+','B-','AB+','AB-','O+','O-');
exception when duplicate_object then null; end $$;

do $$ begin create type public.gender_type as enum ('male', 'female', 'other');
exception when duplicate_object then null; end $$;

do $$ begin create type public.urgency_level as enum ('high', 'mid', 'low');
exception when duplicate_object then null; end $$;

do $$ begin create type public.request_status as enum ('open', 'fulfilled', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type public.notification_status as enum
  ('notified', 'confirmed', 'declined', 'no_response', 'donated', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type public.delivery_status as enum ('pending', 'sending', 'sent', 'failed');
exception when duplicate_object then null; end $$;


-- =====================================================================
-- 2. UTILITY: updated_at trigger + app_settings
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Key/value config. RLS enabled with NO policies => only service_role can read/write.
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  description text
);

create or replace function public.get_setting_int(p_key text, p_default int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = p_key), p_default);
$$;

create or replace function public.get_setting_text(p_key text, p_default text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = p_key), p_default);
$$;

create or replace function public.escalation_minutes(p_urgency public.urgency_level)
returns int language sql stable security definer set search_path = public as $$
  select case p_urgency
    when 'high' then public.get_setting_int('escalation_minutes_high', 10)
    when 'mid'  then public.get_setting_int('escalation_minutes_mid', 30)
    else             public.get_setting_int('escalation_minutes_low', 120)
  end;
$$;


-- =====================================================================
-- 3. TABLES
-- =====================================================================

-- 3.1 profiles (1:1 with auth.users, holds the role)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       public.app_role not null default 'donor',
  full_name  text,
  created_at timestamptz not null default now()
);

-- 3.2 hospitals (pre-seeded; used for autocomplete + auto location)
create table if not exists public.hospitals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_bn     text,
  address     text,
  area        text,
  city        text not null default 'Dhaka',
  phone       text,
  latitude    numeric(9,6) not null check (latitude between -90 and 90),
  longitude   numeric(9,6) not null check (longitude between -180 and 180),
  location    geography(Point, 4326),
  is_verified boolean not null default true,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists hospitals_name_city_uidx on public.hospitals (lower(name), lower(city));
create index if not exists hospitals_name_trgm_idx on public.hospitals using gin (name gin_trgm_ops);
create index if not exists hospitals_location_gix on public.hospitals using gist (location);

-- 3.3 blood_banks (fallback list shown when donors are not enough)
create table if not exists public.blood_banks (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  address    text,
  area       text,
  city       text not null default 'Dhaka',
  open_hours text,
  latitude   numeric(9,6) not null check (latitude between -90 and 90),
  longitude  numeric(9,6) not null check (longitude between -180 and 180),
  location   geography(Point, 4326),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists blood_banks_location_gix on public.blood_banks using gist (location);

-- 3.4 donors
create table if not exists public.donors (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid unique references auth.users(id) on delete cascade, -- nullable: admin-created donors
  full_name              text not null check (char_length(full_name) between 2 and 100),
  date_of_birth          date not null,
  gender                 public.gender_type not null,
  weight_kg              numeric(5,1) not null check (weight_kg between 30 and 250),
  blood_type             public.blood_type_enum not null,
  phone                  text not null unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  email                  text,
  last_donated           date,                     -- validated in trigger (not in the future)
  available_from         date,                     -- ALWAYS computed by trigger = last_donated + gap
  is_available           boolean not null default true,   -- manual on/off switch by the donor
  is_active              boolean not null default true,   -- soft-delete / admin ban
  consent_given          boolean not null default false,
  consent_at             timestamptz,
  self_declared_eligible boolean not null default true,   -- result of the health questionnaire
  health_notes           jsonb not null default '{}'::jsonb,
  address                text,
  area                   text,
  city                   text not null default 'Dhaka',
  latitude               numeric(9,6) not null check (latitude between -90 and 90),
  longitude              numeric(9,6) not null check (longitude between -180 and 180),
  location               geography(Point, 4326),
  preferred_channel      text not null default 'sms' check (preferred_channel in ('sms','whatsapp','email','push')),
  preferred_language     text not null default 'en' check (preferred_language in ('en','bn')),
  push_token             text,
  show_on_leaderboard    boolean not null default false,
  donation_count         int not null default 0,
  no_response_count      int not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists donors_location_gix   on public.donors using gist (location);
create index if not exists donors_blood_type_idx on public.donors (blood_type);
create index if not exists donors_matchable_idx  on public.donors (blood_type)
  where is_available and is_active and consent_given and self_declared_eligible;

-- 3.5 blood_requests (patients)
create table if not exists public.blood_requests (
  id                   uuid primary key default gen_random_uuid(),
  public_token         text not null unique
                         default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  patient_name         text,
  patient_gender       public.gender_type not null,
  blood_type           public.blood_type_enum not null,
  units_needed         int not null check (units_needed between 1 and 10),   -- bags (1 bag ~ 450 ml)
  urgency              public.urgency_level not null default 'mid',
  hospital_id          uuid references public.hospitals(id) on delete set null,
  hospital_name        text not null,
  hospital_address     text,
  latitude             numeric(9,6) not null check (latitude between -90 and 90),
  longitude            numeric(9,6) not null check (longitude between -180 and 180),
  location             geography(Point, 4326) not null,
  contact_1            text not null check (contact_1 ~ '^\+[1-9][0-9]{7,14}$'),
  contact_2            text check (contact_2 is null or contact_2 ~ '^\+[1-9][0-9]{7,14}$'),
  requester_name       text,
  notes                text,
  needed_by            timestamptz,
  status               public.request_status not null default 'open',
  current_wave         int not null default 0,
  radius_km            numeric not null default 0,
  next_escalation_at   timestamptz,
  escalation_exhausted boolean not null default false,
  expires_at           timestamptz,
  ip_hash              text,
  fulfilled_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists blood_requests_status_idx   on public.blood_requests (status, next_escalation_at);
create index if not exists blood_requests_contact_idx  on public.blood_requests (contact_1, created_at);
create index if not exists blood_requests_location_gix on public.blood_requests using gist (location);

-- 3.6 request_notifications (one row per donor notified for a request)
create table if not exists public.request_notifications (
  id                uuid primary key default gen_random_uuid(),
  request_id        uuid not null references public.blood_requests(id) on delete cascade,
  donor_id          uuid not null references public.donors(id) on delete cascade,
  wave              int not null default 1,
  rank              int not null,
  distance_km       numeric,
  status            public.notification_status not null default 'notified',
  response_token    text not null unique
                      default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  delivery_status   public.delivery_status not null default 'pending',
  delivery_channel  text,
  delivery_attempts int not null default 0,
  delivery_error    text,
  last_attempt_at   timestamptz,
  sent_at           timestamptz,
  notified_at       timestamptz not null default now(),
  responded_at      timestamptz,
  donated_at        timestamptz,
  unique (request_id, donor_id)
);
create index if not exists rn_request_idx  on public.request_notifications (request_id, status);
create index if not exists rn_donor_idx    on public.request_notifications (donor_id, notified_at desc);
create index if not exists rn_delivery_idx on public.request_notifications (delivery_status)
  where delivery_status in ('pending','sending','failed');

-- 3.7 donation_history
create table if not exists public.donation_history (
  id         uuid primary key default gen_random_uuid(),
  donor_id   uuid not null references public.donors(id) on delete cascade,
  request_id uuid references public.blood_requests(id) on delete set null,
  donated_on date not null default current_date,
  units      int not null default 1,
  created_at timestamptz not null default now(),
  unique (request_id, donor_id)
);
create index if not exists donation_history_donor_idx on public.donation_history (donor_id, donated_on desc);

-- 3.8 contact_access_log (audit: who saw whose contact info)
create table if not exists public.contact_access_log (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid references public.blood_requests(id) on delete cascade,
  notification_id uuid references public.request_notifications(id) on delete cascade,
  viewer_type     text not null check (viewer_type in ('requester','donor','admin')),
  kind            text not null check (kind in ('view','call','whatsapp')),
  created_at      timestamptz not null default now()
);
create index if not exists cal_request_idx on public.contact_access_log (request_id);


-- =====================================================================
-- 4. TRIGGERS  (data integrity, location, cooldown, protection)
-- =====================================================================

-- 4.1 updated_at
drop trigger if exists donors_updated_at on public.donors;
create trigger donors_updated_at before update on public.donors
  for each row execute function public.set_updated_at();

drop trigger if exists blood_requests_updated_at on public.blood_requests;
create trigger blood_requests_updated_at before update on public.blood_requests
  for each row execute function public.set_updated_at();

-- 4.2 hospitals / blood_banks: build geography from lat/lng
create or replace function public.set_location_from_latlng()
returns trigger language plpgsql set search_path = public, extensions as $$
begin
  new.location := st_setsrid(st_makepoint(new.longitude::float8, new.latitude::float8), 4326)::geography;
  return new;
end $$;

drop trigger if exists hospitals_set_location on public.hospitals;
create trigger hospitals_set_location before insert or update of latitude, longitude on public.hospitals
  for each row execute function public.set_location_from_latlng();

drop trigger if exists blood_banks_set_location on public.blood_banks;
create trigger blood_banks_set_location before insert or update of latitude, longitude on public.blood_banks
  for each row execute function public.set_location_from_latlng();

-- 4.3 admin helper (defined here because policies + triggers use it)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- 4.4 donors BEFORE INSERT/UPDATE:
--     validate age/weight, compute location + available_from (cooldown), protect system columns
create or replace function public.trg_donors_before_write()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_age int;
  v_gap int := public.get_setting_int('donation_gap_days', 120);
begin
  -- validation (only when the relevant columns change)
  if tg_op = 'INSERT'
     or new.date_of_birth is distinct from old.date_of_birth
     or new.weight_kg     is distinct from old.weight_kg then
    v_age := date_part('year', age(new.date_of_birth))::int;
    if v_age < public.get_setting_int('min_age', 18) or v_age > public.get_setting_int('max_age', 65) then
      raise exception 'Donor age must be between % and % years',
        public.get_setting_int('min_age', 18), public.get_setting_int('max_age', 65) using errcode = '22023';
    end if;
    if new.weight_kg < public.get_setting_int('min_weight_kg', 50) then
      raise exception 'Donor weight must be at least % kg', public.get_setting_int('min_weight_kg', 50)
        using errcode = '22023';
    end if;
  end if;

  if new.last_donated is not null and new.last_donated > current_date then
    raise exception 'last_donated cannot be in the future' using errcode = '22023';
  end if;

  -- protect system-managed columns from normal signed-in users
  if tg_op = 'UPDATE' and auth.uid() is not null and not public.is_admin() then
    new.donation_count    := old.donation_count;
    new.no_response_count := old.no_response_count;
    new.user_id           := old.user_id;
    new.is_active         := old.is_active;
  end if;

  -- consent timestamp
  if new.consent_given and new.consent_at is null then
    new.consent_at := now();
  end if;

  -- location
  new.location := st_setsrid(st_makepoint(new.longitude::float8, new.latitude::float8), 4326)::geography;

  -- cooldown: unavailable until last_donated + gap days (default 120)
  new.available_from := case when new.last_donated is null then null else new.last_donated + v_gap end;

  return new;
end $$;

drop trigger if exists donors_before_write on public.donors;
create trigger donors_before_write before insert or update on public.donors
  for each row execute function public.trg_donors_before_write();

-- 4.5 blood_requests BEFORE INSERT: hospital lookup, location, expiry, abuse limit
create or replace function public.trg_requests_before_insert()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  h        public.hospitals;
  v_recent int;
begin
  if new.hospital_id is not null then
    select * into h from public.hospitals where id = new.hospital_id;
    if found then
      new.hospital_name    := coalesce(nullif(new.hospital_name, ''), h.name);
      new.hospital_address := coalesce(new.hospital_address, h.address);
      new.latitude         := coalesce(new.latitude,  h.latitude);
      new.longitude        := coalesce(new.longitude, h.longitude);
    end if;
  end if;

  if new.latitude is null or new.longitude is null then
    raise exception 'Hospital location is required' using errcode = '22023';
  end if;

  new.location := st_setsrid(st_makepoint(new.longitude::float8, new.latitude::float8), 4326)::geography;

  select count(*) into v_recent from public.blood_requests
   where contact_1 = new.contact_1 and created_at > now() - interval '24 hours';
  if v_recent >= public.get_setting_int('max_open_requests_per_phone', 3) then
    raise exception 'Too many requests from this phone number. Please try again later.' using errcode = 'P0001';
  end if;

  if new.expires_at is null then
    new.expires_at := now() + make_interval(hours => case new.urgency
      when 'high' then public.get_setting_int('expiry_hours_high', 24)
      when 'mid'  then public.get_setting_int('expiry_hours_mid', 72)
      else             public.get_setting_int('expiry_hours_low', 168)
    end);
  end if;

  return new;
end $$;

drop trigger if exists requests_before_insert on public.blood_requests;
create trigger requests_before_insert before insert on public.blood_requests
  for each row execute function public.trg_requests_before_insert();

-- 4.6 blood_requests AFTER INSERT: fire wave 1 (created below; trigger calls it at runtime)
create or replace function public.trg_requests_after_insert()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.create_notification_wave(new.id);
  return null;
end $$;

drop trigger if exists requests_after_insert on public.blood_requests;
create trigger requests_after_insert after insert on public.blood_requests
  for each row execute function public.trg_requests_after_insert();

-- 4.7 blood_requests AFTER status change (closed): cancel outstanding notifications
create or replace function public.trg_requests_status_changed()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if old.status = 'open' and new.status <> 'open' then
    update public.request_notifications
       set status = 'cancelled'
     where request_id = new.id and status in ('notified', 'no_response', 'confirmed');
  end if;
  return null;
end $$;

drop trigger if exists requests_status_changed on public.blood_requests;
create trigger requests_status_changed after update of status on public.blood_requests
  for each row execute function public.trg_requests_status_changed();

-- 4.8 request_notifications AFTER status -> donated:
--     update donor (last_donated => 120-day cooldown), history, and fulfil request when enough bags
create or replace function public.trg_notification_status_changed()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  r        public.blood_requests;
  v_done   int;
begin
  if new.status = 'donated' and old.status is distinct from 'donated' then
    -- setting last_donated makes the donors trigger compute available_from = today + 120 days
    update public.donors
       set last_donated = current_date,
           donation_count = donation_count + 1
     where id = new.donor_id;

    insert into public.donation_history (donor_id, request_id, donated_on)
    values (new.donor_id, new.request_id, current_date)
    on conflict (request_id, donor_id) do nothing;

    select * into r from public.blood_requests where id = new.request_id;
    select count(*) into v_done from public.request_notifications
     where request_id = new.request_id and status = 'donated';

    if r.status = 'open' and v_done >= r.units_needed then
      update public.blood_requests set status = 'fulfilled', fulfilled_at = now() where id = r.id;
    end if;
  end if;
  return null;
end $$;

drop trigger if exists notifications_status_changed on public.request_notifications;
create trigger notifications_status_changed after update of status on public.request_notifications
  for each row execute function public.trg_notification_status_changed();

-- 4.9 auth.users -> profiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4.10 users cannot promote themselves to admin
create or replace function public.trg_profiles_protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.trg_profiles_protect_role();


-- =====================================================================
-- 5. BLOOD COMPATIBILITY
-- =====================================================================
create or replace function public.compatible_donor_types(p_patient public.blood_type_enum)
returns public.blood_type_enum[] language sql immutable as $$
  select (case p_patient
    when 'O-'  then array['O-']
    when 'O+'  then array['O+','O-']
    when 'A-'  then array['A-','O-']
    when 'A+'  then array['A+','A-','O+','O-']
    when 'B-'  then array['B-','O-']
    when 'B+'  then array['B+','B-','O+','O-']
    when 'AB-' then array['AB-','A-','B-','O-']
    when 'AB+' then array['AB+','AB-','A+','A-','B+','B-','O+','O-']
  end)::public.blood_type_enum[];
$$;


-- =====================================================================
-- 6. NEAREST-DONOR MATCHING (PostGIS KNN + scoring)
--    Score (lower = better) = distance_km
--                           + 3 if not an exact blood-type match
--                           - 0.2 per past donation (max 10)   (reliable donors first)
--                           + 0.5 per past no-response (max 10)
-- =====================================================================
create or replace function public.find_donors_for_request(
  p_request_id uuid,
  p_limit      int     default 10,
  p_radius_km  numeric default 15
)
returns table (donor_id uuid, distance_km numeric, is_exact_match boolean, score numeric)
language plpgsql stable security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare
  r          public.blood_requests;
  v_compat   public.blood_type_enum[];
  v_week_cap int;
begin
  select * into r from public.blood_requests where id = p_request_id;
  if not found then return; end if;

  v_compat   := public.compatible_donor_types(r.blood_type);
  v_week_cap := public.get_setting_int('max_notifications_per_week', 5);

  return query
  with candidates as (
    select d.id, d.blood_type as d_type, d.donation_count, d.no_response_count,
           (st_distance(d.location, r.location) / 1000.0)::numeric as dist_km
      from public.donors d
     where d.blood_type = any (v_compat)
       and d.is_available and d.is_active and d.consent_given and d.self_declared_eligible
       and (d.available_from is null or d.available_from <= current_date)
       and st_dwithin(d.location, r.location, p_radius_km * 1000)
       and not exists (select 1 from public.request_notifications n
                        where n.request_id = r.id and n.donor_id = d.id)
       and (select count(*) from public.request_notifications n2
             where n2.donor_id = d.id and n2.notified_at > now() - interval '7 days') < v_week_cap
     order by d.location <-> r.location
     limit greatest(p_limit * 5, 50)
  )
  select c.id,
         round(c.dist_km, 2),
         (c.d_type = r.blood_type),
         round(c.dist_km
               + case when c.d_type = r.blood_type then 0 else 3 end
               - least(c.donation_count, 10) * 0.2
               + least(c.no_response_count, 10) * 0.5, 3)
    from candidates c
   order by 4
   limit p_limit;
end $$;

-- Creates the next wave of notifications for a request (radius grows every wave).
-- Returns how many donors were queued.
create or replace function public.create_notification_wave(p_request_id uuid)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare
  r          public.blood_requests;
  v_batch    int := public.get_setting_int('wave_size', 10);
  v_new_wave int;
  v_radius   numeric;
  v_base     int;
  v_inserted int := 0;
begin
  select * into r from public.blood_requests where id = p_request_id for update;
  if not found or r.status <> 'open' then return 0; end if;

  v_new_wave := r.current_wave + 1;
  v_radius   := public.get_setting_int('base_radius_km', 10)
              + (v_new_wave - 1) * public.get_setting_int('radius_step_km', 5);

  select coalesce(max(rank), 0) into v_base from public.request_notifications where request_id = r.id;

  with picked as (
    select * from public.find_donors_for_request(r.id, v_batch, v_radius)
  ), ins as (
    insert into public.request_notifications (request_id, donor_id, wave, rank, distance_km)
    select r.id, p.donor_id, v_new_wave, v_base + row_number() over (order by p.score), p.distance_km
      from picked p
    returning 1
  )
  select count(*) into v_inserted from ins;

  update public.blood_requests
     set current_wave       = v_new_wave,
         radius_km          = v_radius,
         -- nobody found in this radius? try the next wave after 1 minute instead of waiting
         next_escalation_at = now() + case when v_inserted = 0 then interval '1 minute'
                                           else make_interval(mins => public.escalation_minutes(r.urgency)) end
   where id = r.id;

  return v_inserted;
end $$;

-- Called every minute by pg_cron: expire old requests, escalate unanswered ones.
create or replace function public.escalate_open_requests()
returns int language plpgsql security definer set search_path = public, extensions as $$
declare
  rec       record;
  v_secured int;
  v_total   int := 0;
  v_max     int := public.get_setting_int('max_waves', 6);
begin
  update public.blood_requests set status = 'expired'
   where status = 'open' and expires_at is not null and expires_at <= now();

  for rec in
    select id, units_needed, current_wave from public.blood_requests
     where status = 'open' and next_escalation_at is not null and next_escalation_at <= now()
  loop
    select count(*) into v_secured from public.request_notifications
     where request_id = rec.id and status in ('confirmed', 'donated');

    if v_secured >= rec.units_needed then
      -- enough donors confirmed; just re-check later
      update public.blood_requests set next_escalation_at = now() + interval '30 minutes' where id = rec.id;
      continue;
    end if;

    if rec.current_wave >= v_max then
      update public.blood_requests
         set next_escalation_at = null, escalation_exhausted = true where id = rec.id;
      continue;
    end if;

    -- previous silent donors become no_response (they can still confirm late)
    with nr as (
      update public.request_notifications set status = 'no_response'
       where request_id = rec.id and status = 'notified' returning donor_id
    )
    update public.donors set no_response_count = no_response_count + 1
     where id in (select donor_id from nr);

    v_total := v_total + public.create_notification_wave(rec.id);
  end loop;

  return v_total;
end $$;

-- pg_cron -> calls the Next.js dispatcher (which sends SMS/email) when something is pending
create or replace function public.trigger_dispatch()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_url    text := public.get_setting_text('dispatch_url', '');
  v_secret text := public.get_setting_text('cron_secret', '');
begin
  if v_url = '' then return; end if;
  if not exists (
    select 1 from public.request_notifications
     where delivery_status in ('pending','failed','sending')
  ) then return; end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'Authorization', 'Bearer ' || v_secret),
    body    := '{}'::jsonb
  );
end $$;


-- =====================================================================
-- 7. DELIVERY QUEUE (used by the Next.js dispatcher, service_role only)
-- =====================================================================
create or replace function public.claim_pending_notifications(p_limit int default 25)
returns table (
  notification_id    uuid,
  response_token     text,
  donor_name         text,
  donor_phone        text,
  donor_email        text,
  preferred_channel  text,
  preferred_language text,
  blood_type         public.blood_type_enum,
  units_needed       int,
  urgency            public.urgency_level,
  hospital_name      text,
  distance_km        numeric
)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
begin
  return query
  with c as (
    select n.id
      from public.request_notifications n
      join public.blood_requests r on r.id = n.request_id
     where r.status = 'open'
       and n.status = 'notified'
       and n.delivery_attempts < 3
       and (   n.delivery_status = 'pending'
            or (n.delivery_status = 'failed'  and n.last_attempt_at < now() - interval '2 minutes')
            or (n.delivery_status = 'sending' and n.last_attempt_at < now() - interval '10 minutes'))
     order by n.notified_at
     limit p_limit
       for update of n skip locked
  ), u as (
    update public.request_notifications n
       set delivery_status = 'sending',
           delivery_attempts = n.delivery_attempts + 1,
           last_attempt_at = now()
      from c where n.id = c.id
    returning n.*
  )
  select u.id, u.response_token, d.full_name, d.phone, d.email, d.preferred_channel, d.preferred_language,
         r.blood_type, r.units_needed, r.urgency, r.hospital_name, u.distance_km
    from u
    join public.donors d on d.id = u.donor_id
    join public.blood_requests r on r.id = u.request_id;
end $$;

create or replace function public.mark_notification_delivery(
  p_id uuid, p_ok boolean, p_channel text, p_error text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.request_notifications
     set delivery_status  = case when p_ok then 'sent'::public.delivery_status else 'failed'::public.delivery_status end,
         delivery_channel = p_channel,
         delivery_error   = p_error,
         sent_at          = case when p_ok then now() else sent_at end
   where id = p_id;
end $$;


-- =====================================================================
-- 8. DONOR RESPONSE (token link, no login needed)  - service_role only
-- =====================================================================
create or replace function public.get_notification_by_token(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  n public.request_notifications;
  r public.blood_requests;
  d public.donors;
begin
  select * into n from public.request_notifications where response_token = p_token;
  if not found then return null; end if;
  select * into r from public.blood_requests where id = n.request_id;
  select * into d from public.donors where id = n.donor_id;

  return jsonb_build_object(
    'notification', jsonb_build_object(
      'status', n.status, 'distance_km', round(n.distance_km, 1),
      'wave', n.wave, 'donated_at', n.donated_at),
    'donor', jsonb_build_object('name', d.full_name, 'blood_type', d.blood_type),
    'request', jsonb_build_object(
      'status', r.status, 'blood_type', r.blood_type, 'units_needed', r.units_needed,
      'urgency', r.urgency, 'hospital_name', r.hospital_name, 'hospital_address', r.hospital_address,
      'latitude', r.latitude, 'longitude', r.longitude,
      'needed_by', r.needed_by, 'created_at', r.created_at),
    -- patient contact is revealed ONLY after the donor confirms
    'contacts', case when n.status = 'confirmed' and r.status = 'open' then
      jsonb_build_object('contact_1', r.contact_1, 'contact_2', r.contact_2,
                         'requester_name', r.requester_name, 'patient_gender', r.patient_gender)
      else null end
  );
end $$;

-- p_action: 'confirm' | 'decline' | 'donated'
create or replace function public.respond_to_notification(p_token text, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  n         public.request_notifications;
  r         public.blood_requests;
  v_secured int;
  v_buffer  int := public.get_setting_int('confirm_buffer', 2);
begin
  select * into n from public.request_notifications where response_token = p_token for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  select * into r from public.blood_requests where id = n.request_id;

  if p_action = 'donated' then
    if n.status = 'donated' then return jsonb_build_object('ok', true, 'status', 'donated'); end if;
    if n.status <> 'confirmed' then return jsonb_build_object('ok', false, 'code', 'not_confirmed'); end if;
    update public.request_notifications
       set status = 'donated', donated_at = now() where id = n.id;
    return jsonb_build_object('ok', true, 'status', 'donated');
  end if;

  if r.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'request_closed', 'request_status', r.status);
  end if;

  if p_action = 'confirm' then
    if n.status in ('confirmed', 'donated') then
      return jsonb_build_object('ok', true, 'status', n.status);
    end if;
    select count(*) into v_secured from public.request_notifications
     where request_id = n.request_id and status in ('confirmed', 'donated');
    if v_secured >= r.units_needed + v_buffer then
      return jsonb_build_object('ok', false, 'code', 'request_full');
    end if;
    update public.request_notifications
       set status = 'confirmed', responded_at = now() where id = n.id;
    return jsonb_build_object('ok', true, 'status', 'confirmed');

  elsif p_action = 'decline' then
    if n.status = 'donated' then return jsonb_build_object('ok', false, 'code', 'already_donated'); end if;
    update public.request_notifications
       set status = 'declined', responded_at = now() where id = n.id;
    return jsonb_build_object('ok', true, 'status', 'declined');
  end if;

  return jsonb_build_object('ok', false, 'code', 'invalid_action');
end $$;


-- =====================================================================
-- 9. PATIENT / REQUESTER SIDE (secret link token, no login) - service_role only
-- =====================================================================
create or replace function public.get_request_status(p_request_id uuid, p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r public.blood_requests;
begin
  select * into r from public.blood_requests where id = p_request_id and public_token = p_token;
  if not found then return null; end if;

  return jsonb_build_object(
    'request', jsonb_build_object(
      'id', r.id, 'status', r.status, 'blood_type', r.blood_type, 'units_needed', r.units_needed,
      'urgency', r.urgency, 'hospital_name', r.hospital_name, 'created_at', r.created_at,
      'expires_at', r.expires_at, 'current_wave', r.current_wave, 'radius_km', r.radius_km,
      'escalation_exhausted', r.escalation_exhausted),
    'stats', jsonb_build_object(
      'notified',  (select count(*) from public.request_notifications where request_id = r.id),
      'confirmed', (select count(*) from public.request_notifications where request_id = r.id and status = 'confirmed'),
      'donated',   (select count(*) from public.request_notifications where request_id = r.id and status = 'donated')),
    -- names + phones only for donors who confirmed
    'donors', coalesce((
      select jsonb_agg(jsonb_build_object(
               'notification_id', n.id, 'name', d.full_name, 'phone', d.phone,
               'blood_type', d.blood_type, 'distance_km', round(n.distance_km, 1),
               'status', n.status, 'responded_at', n.responded_at)
             order by n.responded_at)
        from public.request_notifications n
        join public.donors d on d.id = n.donor_id
       where n.request_id = r.id and n.status in ('confirmed', 'donated')
    ), '[]'::jsonb)
  );
end $$;

-- requester marks that a confirmed donor has donated
create or replace function public.patient_mark_donated(p_request_id uuid, p_token text, p_notification_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.blood_requests where id = p_request_id and public_token = p_token) then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  update public.request_notifications
     set status = 'donated', donated_at = now()
   where id = p_notification_id and request_id = p_request_id and status = 'confirmed';
  if not found then return jsonb_build_object('ok', false, 'code', 'not_confirmed'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- requester closes the request: p_new_status in ('fulfilled','cancelled')
create or replace function public.close_request(p_request_id uuid, p_token text, p_new_status public.request_status)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_new_status not in ('fulfilled', 'cancelled') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  update public.blood_requests
     set status = p_new_status,
         fulfilled_at = case when p_new_status = 'fulfilled' then now() else fulfilled_at end
   where id = p_request_id and public_token = p_token and status = 'open';
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found_or_closed'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.log_contact_access(
  p_request_id uuid, p_notification_id uuid, p_viewer text, p_kind text
) returns void language sql security definer set search_path = public as $$
  insert into public.contact_access_log (request_id, notification_id, viewer_type, kind)
  values (p_request_id, p_notification_id, p_viewer, p_kind);
$$;


-- =====================================================================
-- 10. PUBLIC HELPERS (safe for anon/authenticated)
-- =====================================================================
create or replace function public.search_hospitals(p_query text, p_limit int default 8)
returns table (id uuid, name text, address text, area text, latitude numeric, longitude numeric)
language sql stable set search_path = public, extensions as $$
  select h.id, h.name, h.address, h.area, h.latitude, h.longitude
    from public.hospitals h
   where h.is_active
     and (h.name ilike '%' || p_query || '%'
          or coalesce(h.area, '') ilike '%' || p_query || '%'
          or similarity(h.name, p_query) > 0.2)
   order by similarity(h.name, p_query) desc, h.name
   limit p_limit;
$$;

create or replace function public.nearest_blood_banks(p_lat float8, p_lng float8, p_limit int default 5)
returns table (id uuid, name text, phone text, address text, area text, open_hours text, distance_km numeric)
language sql stable set search_path = public, extensions as $$
  select b.id, b.name, b.phone, b.address, b.area, b.open_hours,
         round((st_distance(b.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) / 1000.0)::numeric, 1)
    from public.blood_banks b
   where b.is_active
   order by b.location <-> st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
   limit p_limit;
$$;

-- opt-in leaderboard: first name only
create or replace function public.get_leaderboard(p_limit int default 20)
returns table (display_name text, area text, donation_count int, last_donated date)
language sql stable security definer set search_path = public as $$
  select split_part(d.full_name, ' ', 1), d.area, d.donation_count, d.last_donated
    from public.donors d
   where d.show_on_leaderboard and d.is_active and d.donation_count > 0
   order by d.donation_count desc, d.last_donated desc
   limit p_limit;
$$;

-- donor status helper view: available / cooldown / paused
create or replace view public.donors_with_status with (security_invoker = true) as
select d.*,
       case
         when not d.is_active then 'inactive'
         when not d.is_available then 'paused'
         when d.available_from is not null and d.available_from > current_date then 'cooldown'
         else 'available'
       end as availability_status
  from public.donors d;

-- admin analytics
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'donors_total', (select count(*) from public.donors),
    'donors_available_now', (select count(*) from public.donors
        where is_available and is_active and consent_given
          and (available_from is null or available_from <= current_date)),
    'requests_open',      (select count(*) from public.blood_requests where status = 'open'),
    'requests_fulfilled', (select count(*) from public.blood_requests where status = 'fulfilled'),
    'requests_expired',   (select count(*) from public.blood_requests where status = 'expired'),
    'avg_minutes_to_first_confirmation', (
      select round(avg(extract(epoch from (t.first_conf - t.created_at)) / 60)::numeric, 1)
        from (select r.created_at, min(n.responded_at) as first_conf
                from public.blood_requests r
                join public.request_notifications n on n.request_id = r.id and n.status in ('confirmed','donated')
               group by r.id) t),
    'open_requests_by_blood_type', (
      select coalesce(jsonb_object_agg(x.bt, x.cnt), '{}'::jsonb)
        from (select blood_type::text as bt, count(*) as cnt
                from public.blood_requests where status = 'open' group by blood_type) x)
  );
end $$;


-- =====================================================================
-- 11. ROW LEVEL SECURITY
-- The Next.js server uses the service_role key (bypasses RLS) for
-- request creation, token links, dispatching, and cron.
-- =====================================================================
alter table public.app_settings          enable row level security;  -- no policies = service_role only
alter table public.profiles              enable row level security;
alter table public.hospitals             enable row level security;
alter table public.blood_banks           enable row level security;
alter table public.donors                enable row level security;
alter table public.blood_requests        enable row level security;  -- no client access (except admin)
alter table public.request_notifications enable row level security;
alter table public.donation_history      enable row level security;
alter table public.contact_access_log    enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- hospitals + blood banks: public read, admin write
drop policy if exists hospitals_public_read on public.hospitals;
create policy hospitals_public_read on public.hospitals for select to anon, authenticated using (is_active);
drop policy if exists hospitals_admin_all on public.hospitals;
create policy hospitals_admin_all on public.hospitals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists blood_banks_public_read on public.blood_banks;
create policy blood_banks_public_read on public.blood_banks for select to anon, authenticated using (is_active);
drop policy if exists blood_banks_admin_all on public.blood_banks;
create policy blood_banks_admin_all on public.blood_banks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- donors: each donor manages only their own row
drop policy if exists donors_select_own on public.donors;
create policy donors_select_own on public.donors for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists donors_insert_own on public.donors;
create policy donors_insert_own on public.donors for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists donors_update_own on public.donors;
create policy donors_update_own on public.donors for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists donors_delete_own on public.donors;
create policy donors_delete_own on public.donors for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- blood_requests: admin only from the client
drop policy if exists blood_requests_admin_all on public.blood_requests;
create policy blood_requests_admin_all on public.blood_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- request_notifications: donor sees own rows (for dashboard), admin sees all
drop policy if exists rn_select_own on public.request_notifications;
create policy rn_select_own on public.request_notifications for select to authenticated
  using (public.is_admin() or donor_id in (select id from public.donors where user_id = auth.uid()));

-- donation_history
drop policy if exists dh_select_own on public.donation_history;
create policy dh_select_own on public.donation_history for select to authenticated
  using (public.is_admin() or donor_id in (select id from public.donors where user_id = auth.uid()));

-- contact_access_log: admin read only
drop policy if exists cal_admin_select on public.contact_access_log;
create policy cal_admin_select on public.contact_access_log for select to authenticated
  using (public.is_admin());


-- =====================================================================
-- 12. FUNCTION PERMISSIONS
-- Internal functions: service_role only (Next.js server). Never callable from the browser.
-- =====================================================================
revoke all on function public.find_donors_for_request(uuid, int, numeric)                 from public, anon, authenticated;
revoke all on function public.create_notification_wave(uuid)                              from public, anon, authenticated;
revoke all on function public.escalate_open_requests()                                    from public, anon, authenticated;
revoke all on function public.trigger_dispatch()                                          from public, anon, authenticated;
revoke all on function public.claim_pending_notifications(int)                            from public, anon, authenticated;
revoke all on function public.mark_notification_delivery(uuid, boolean, text, text)       from public, anon, authenticated;
revoke all on function public.get_notification_by_token(text)                             from public, anon, authenticated;
revoke all on function public.respond_to_notification(text, text)                         from public, anon, authenticated;
revoke all on function public.get_request_status(uuid, text)                              from public, anon, authenticated;
revoke all on function public.patient_mark_donated(uuid, text, uuid)                      from public, anon, authenticated;
revoke all on function public.close_request(uuid, text, public.request_status)            from public, anon, authenticated;
revoke all on function public.log_contact_access(uuid, uuid, text, text)                  from public, anon, authenticated;
revoke all on function public.get_setting_int(text, int)                                  from public, anon, authenticated;
revoke all on function public.get_setting_text(text, text)                                from public, anon, authenticated;
revoke all on function public.escalation_minutes(public.urgency_level)                    from public, anon, authenticated;

grant execute on function public.find_donors_for_request(uuid, int, numeric)              to service_role;
grant execute on function public.create_notification_wave(uuid)                           to service_role;
grant execute on function public.escalate_open_requests()                                 to service_role;
grant execute on function public.trigger_dispatch()                                       to service_role;
grant execute on function public.claim_pending_notifications(int)                         to service_role;
grant execute on function public.mark_notification_delivery(uuid, boolean, text, text)    to service_role;
grant execute on function public.get_notification_by_token(text)                          to service_role;
grant execute on function public.respond_to_notification(text, text)                      to service_role;
grant execute on function public.get_request_status(uuid, text)                           to service_role;
grant execute on function public.patient_mark_donated(uuid, text, uuid)                   to service_role;
grant execute on function public.close_request(uuid, text, public.request_status)        to service_role;
grant execute on function public.log_contact_access(uuid, uuid, text, text)               to service_role;
grant execute on function public.get_setting_int(text, int)                               to service_role;
grant execute on function public.get_setting_text(text, text)                             to service_role;
grant execute on function public.escalation_minutes(public.urgency_level)                 to service_role;

-- Public helpers
grant execute on function public.search_hospitals(text, int)                to anon, authenticated;
grant execute on function public.nearest_blood_banks(float8, float8, int)   to anon, authenticated;
grant execute on function public.get_leaderboard(int)                       to anon, authenticated;
grant execute on function public.compatible_donor_types(public.blood_type_enum) to anon, authenticated;
grant execute on function public.admin_dashboard_stats()                    to authenticated;  -- guarded by is_admin()
grant execute on function public.is_admin()                                 to authenticated;


-- =====================================================================
-- 13. REALTIME (donor dashboard gets live notifications; RLS still applies)
-- =====================================================================
do $$ begin
  alter publication supabase_realtime add table public.request_notifications;
exception when duplicate_object then null; end $$;


-- =====================================================================
-- 14. DEFAULT SETTINGS
-- =====================================================================
insert into public.app_settings (key, value, description) values
  ('donation_gap_days',            '120'::jsonb, 'Days a donor is unavailable after donating'),
  ('min_age',                      '18'::jsonb,  'Minimum donor age'),
  ('max_age',                      '65'::jsonb,  'Maximum donor age'),
  ('min_weight_kg',                '50'::jsonb,  'Minimum donor weight'),
  ('wave_size',                    '10'::jsonb,  'Donors notified per wave'),
  ('base_radius_km',               '10'::jsonb,  'Search radius for wave 1'),
  ('radius_step_km',               '5'::jsonb,   'Extra km added for every later wave'),
  ('max_waves',                    '6'::jsonb,   'Maximum escalation waves per request'),
  ('escalation_minutes_high',      '10'::jsonb,  'Minutes before next wave (high urgency)'),
  ('escalation_minutes_mid',       '30'::jsonb,  'Minutes before next wave (mid urgency)'),
  ('escalation_minutes_low',       '120'::jsonb, 'Minutes before next wave (low urgency)'),
  ('confirm_buffer',               '2'::jsonb,   'Extra backup confirmations allowed beyond units_needed'),
  ('max_notifications_per_week',   '5'::jsonb,   'Donor fatigue cap'),
  ('max_open_requests_per_phone',  '3'::jsonb,   'Max requests per contact_1 in 24h'),
  ('expiry_hours_high',            '24'::jsonb,  'Request auto-expiry (high)'),
  ('expiry_hours_mid',             '72'::jsonb,  'Request auto-expiry (mid)'),
  ('expiry_hours_low',             '168'::jsonb, 'Request auto-expiry (low)'),
  ('dispatch_url',                 to_jsonb(''::text), 'Full URL of /api/cron/dispatch (set after deploy)'),
  ('cron_secret',                  to_jsonb(''::text), 'Same value as CRON_SECRET env var (set after deploy)')
on conflict (key) do nothing;


-- =====================================================================
-- 15. SEED: HOSPITALS (Dhaka) - coordinates are APPROXIMATE, verify/extend in admin panel
-- =====================================================================
insert into public.hospitals (name, address, area, city, latitude, longitude) values
  ('Dhaka Medical College Hospital',                      'Secretariat Rd, Ramna',        'Shahbagh',      'Dhaka', 23.725600, 90.397500),
  ('Bangabandhu Sheikh Mujib Medical University (BSMMU)', 'Shahbagh',                     'Shahbagh',      'Dhaka', 23.738600, 90.395900),
  ('Square Hospital',                                     '18/F Bir Uttam Qazi Nuruzzaman Sarak', 'Panthapath', 'Dhaka', 23.752600, 90.381900),
  ('United Hospital',                                     'Plot 15, Road 71, Gulshan',    'Gulshan',       'Dhaka', 23.804900, 90.415500),
  ('Evercare Hospital Dhaka',                             'Bashundhara R/A',              'Bashundhara',   'Dhaka', 23.810300, 90.428700),
  ('Labaid Specialized Hospital',                         'House 6, Road 4, Dhanmondi',   'Dhanmondi',     'Dhaka', 23.746100, 90.374200),
  ('National Institute of Traumatology & Orthopaedic Rehabilitation (NITOR)', 'Sher-e-Bangla Nagar', 'Agargaon', 'Dhaka', 23.777000, 90.370700),
  ('Sir Salimullah Medical College Mitford Hospital',     'Mitford Rd, Old Dhaka',        'Sadarghat',     'Dhaka', 23.708300, 90.407000)
on conflict do nothing;


-- =====================================================================
-- 16. CRON JOBS
-- =====================================================================
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname in ('bc-escalate-requests', 'bc-dispatch-notifications') loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

select cron.schedule('bc-escalate-requests',     '* * * * *', $$select public.escalate_open_requests();$$);
select cron.schedule('bc-dispatch-notifications', '* * * * *', $$select public.trigger_dispatch();$$);


-- =====================================================================
-- 17. AFTER FIRST DEPLOY - run these manually (edit values)
-- =====================================================================
-- update public.app_settings set value = to_jsonb('https://YOUR-DOMAIN.com/api/cron/dispatch'::text) where key = 'dispatch_url';
-- update public.app_settings set value = to_jsonb('YOUR-LONG-RANDOM-SECRET'::text)                    where key = 'cron_secret';
--
-- Make yourself admin (sign up in the app first, then):
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');


-- =====================================================================
-- 18. OPTIONAL DEV SEED  (delete these rows before going live!)
--     200 fake donors scattered around Dhaka + one test request
-- =====================================================================
-- insert into public.donors (full_name, date_of_birth, gender, weight_kg, blood_type, phone,
--                            latitude, longitude, consent_given, area, city)
-- select 'Test Donor ' || g, date '1995-01-01', 'male', 65,
--        (array['A+','A-','B+','B-','AB+','AB-','O+','O-'])[1 + floor(random()*8)::int]::public.blood_type_enum,
--        '+88017' || lpad(g::text, 8, '0'),
--        23.70 + random()*0.15, 90.33 + random()*0.13, true, 'Test', 'Dhaka'
--   from generate_series(1, 200) g;
--
-- insert into public.blood_requests (patient_gender, blood_type, units_needed, urgency, hospital_id, hospital_name, contact_1)
-- select 'male', 'B+', 2, 'high', h.id, h.name, '+8801711111111'
--   from public.hospitals h where h.name = 'Square Hospital';
--
-- select * from public.request_notifications order by rank;   -- should list 10 donors, nearest first


-- =====================================================================
-- 19. TEARDOWN (only for resetting a dev project) - keep commented!
-- =====================================================================
-- drop table if exists public.contact_access_log, public.donation_history, public.request_notifications,
--   public.blood_requests, public.donors, public.blood_banks, public.hospitals, public.profiles,
--   public.app_settings cascade;
