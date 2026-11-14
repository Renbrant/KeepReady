-- Permite o tipo de registro 'gear' (itens das caixas de 27 galões). Aplicada no projeto real.
alter table public.records drop constraint if exists records_kind_check;
alter table public.records add constraint records_kind_check
  check (kind in ('settings', 'member', 'bucket', 'pantry', 'shop', 'supply', 'gear'));
