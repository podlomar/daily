-- Predefined running tracks
INSERT OR IGNORE INTO running_tracks (
  id, name, length, url, progress_unit
) VALUES
  ('nuselska', 'Nuselská', 4, 'https://mapy.com/s/dasukaleto', 'flight'),
  ('mesto', 'Město', 2.3, 'https://mapy.com/s/kafolokugu', 'km'),
  ('blok', 'Blok', 1.1, 'https://mapy.com/s/gefabamaja', 'km'),
  ('modrany', 'Modřany', 8.2, 'https://mapy.com/s/gebeluguzo', 'km');
