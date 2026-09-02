-- DAON reservations.
--
-- Run this once in the Supabase SQL editor. Two tables: the reservation and a
-- row per table it occupies. The second one carries the guarantee — a unique
-- index on (date, time, table) means the database itself refuses to seat two
-- parties at the same table, whatever the application believes.
--
-- Nothing here is reachable with the anon key: row level security is on and no
-- policy grants it anything, so only the service key the API holds can read or
-- write. The API is the only way in.

create table if not exists public.reservations (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  booking_date date not null,
  booking_time text not null,
  party_size   integer not null check (party_size between 1 and 60),
  guest_name   text not null,
  phone        text not null,
  notes        text not null default '',
  locale       text not null default '',
  status       text not null default 'confirmed'
               check (status in ('confirmed', 'cancelled')),
  created_at   timestamptz not null default now()
);

create table if not exists public.reservation_tables (
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  table_id       text not null,
  booking_date   date not null,
  booking_time   text not null,
  primary key (reservation_id, table_id)
);

-- One party per table per service.
create unique index if not exists reservation_tables_slot_idx
  on public.reservation_tables (booking_date, booking_time, table_id);

-- The API reads a whole day at a time when it builds the list of times.
create index if not exists reservation_tables_date_idx
  on public.reservation_tables (booking_date);

alter table public.reservations       enable row level security;
alter table public.reservation_tables enable row level security;

-- Taking a booking is one transaction: either the party gets every table it
-- asked for, or it gets none of them. The unique index does the deciding, and
-- the message it raises is what the API turns into a 409.
create or replace function public.create_reservation(
  p_reference  text,
  p_date       date,
  p_time       text,
  p_party_size integer,
  p_table_ids  text[],
  p_name       text,
  p_phone      text,
  p_notes      text default '',
  p_locale     text default ''
)
returns setof public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.reservations
    (reference, booking_date, booking_time, party_size, guest_name, phone, notes, locale)
  values
    (p_reference, p_date, p_time, p_party_size, p_name, p_phone, coalesce(p_notes, ''),
     coalesce(p_locale, ''))
  returning id into new_id;

  begin
    insert into public.reservation_tables (reservation_id, table_id, booking_date, booking_time)
    select new_id, unnest(p_table_ids), p_date, p_time;
  exception when unique_violation then
    raise exception 'tables_taken' using errcode = '23505';
  end;

  return query select * from public.reservations where id = new_id;
end;
$$;

-- Postgres grants EXECUTE on a new function to PUBLIC, and every Supabase role
-- inherits that. Revoking from anon by name leaves the PUBLIC grant standing —
-- which, on a security definer function, hands the publishable key a way to
-- write rows that row level security would otherwise refuse. Revoke from PUBLIC
-- and grant it back to the one role that should have it.
revoke all on function public.create_reservation(
  text, date, text, integer, text[], text, text, text, text
) from public, anon, authenticated;

grant execute on function public.create_reservation(
  text, date, text, integer, text[], text, text, text, text
) to service_role;
