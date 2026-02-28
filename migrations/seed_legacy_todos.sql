-- Seed: import legacy todos from data/old-todos.json
--
-- Run once against the production database:
--   sqlite3 data/db.sqlite < migrations/seed_legacy_todos.sql
--
-- INSERT OR IGNORE is safe to re-run.

INSERT OR IGNORE INTO todos (id, text, created_at, done) VALUES
  ('Tdx8v8Nt', 'Opravit kodím.cz',                    '2025-12-26 20:39:31', 1),
  ('Pw1G-WCu', 'Pořešit důchodové pojištění',          '2025-12-27 05:56:44', 0),
  ('baQSqf7k', 'Pořešit konečně neuroboreliozu',       '2025-12-27 07:58:05', 0),
  ('Fvu-gr6o', 'Pořešit UPS Whoop',                   '2025-12-27 11:12:03', 1),
  ('PDxD_w-s', 'Vylepšit fotky na Tindru',             '2025-12-29 16:58:08', 1),
  ('WTWPspwT', 'Nechat zašít kalhoty',                 '2025-12-30 09:58:50', 1),
  ('fFghknT_', 'Zrušit Tinder předplatné',             '2025-12-30 13:22:24', 1),
  ('0X1JCEb-', 'Vyladit Tindr profil podle AI',        '2025-12-30 16:25:51', 0),
  ('n86yorWh', 'Faktura Newton',                        '2026-01-01 07:19:07', 1),
  ('8t2yoPLQ', 'Vyzvednout kalhoty',                   '2026-01-11 14:56:38', 1),
  ('AyKR6Wmm', 'Zkontrolovat výši OSVČ záloh',         '2026-01-15 18:51:29', 0),
  ('biY3UVcG', 'Zaplatit mamce HBO Sport',             '2026-01-20 09:49:27', 1),
  ('sGASmGHk', 'Pořešit lab testy',                    '2026-02-07 14:45:12', 1);
