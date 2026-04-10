-- Add monthly_budget and chequing_balance columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS chequing_balance DECIMAL(10, 2) DEFAULT 0;
