-- Custom SQL migration file, put you code below! --

-- Settings are no longer backwards compatible
DELETE FROM settings;
