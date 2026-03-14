-- Migration: KDV (VAT) alanları satış ve kiralama işlemlerine eklendi
-- Tarih: 2026-03-14

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS kdv_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS kdv_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kdv_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_amount_with_kdv numeric,
  ADD COLUMN IF NOT EXISTS net_commission_ex_kdv numeric;

COMMENT ON COLUMN public.sales.kdv_included IS 'KDV dahil mi? true = KDV''li fatura kesildi';
COMMENT ON COLUMN public.sales.kdv_rate IS 'KDV oranı: 0, 10 veya 20 (%)';
COMMENT ON COLUMN public.sales.kdv_amount IS 'KDV tutarı (TL) = komisyon * kdv_rate / 100';
COMMENT ON COLUMN public.sales.gross_amount_with_kdv IS 'KDV dahil brüt komisyon = komisyon + kdv_amount';
COMMENT ON COLUMN public.sales.net_commission_ex_kdv IS 'KDV hariç net komisyon = komisyon tutarı';
