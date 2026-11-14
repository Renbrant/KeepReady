-- Permite o tipo de registro 'lot' (lotes guardados, com validade e etiqueta, da tela Entrada de compras).
alter table public.records drop constraint if exists records_kind_check;
alter table public.records add constraint records_kind_check
  check (kind in ('settings', 'member', 'bucket', 'pantry', 'shop', 'supply', 'gear', 'water', 'lot'));
