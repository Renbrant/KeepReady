-- Permite o tipo de registro 'water' (lotes de água potável e limpa, com validade).
alter table public.records drop constraint if exists records_kind_check;
alter table public.records add constraint records_kind_check
  check (kind in ('settings', 'member', 'bucket', 'pantry', 'shop', 'supply', 'gear', 'water'));
