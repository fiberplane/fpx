DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings') THEN
        -- Check if the first record exists
        IF EXISTS (SELECT 1 FROM settings LIMIT 1) THEN
            -- Update the content column if it contains an object with the key 'openaiApiKey'
            UPDATE settings
            SET content = jsonb_set(content, '{aiProviderType}', '"openai"')
            WHERE content ? 'openaiApiKey';
        END IF;
    END IF;
END $$;