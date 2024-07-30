CREATE TABLE responses (
    id INTEGER PRIMARY KEY,
    request_id INTEGER NOT NULL,
    status INTEGER NOT NULL,
    body TEXT,
    headers TEXT NOT NULL,
    FOREIGN KEY (request_id) REFERENCES requests (id) 
       ON UPDATE CASCADE
       ON DELETE CASCADE
) STRICT;
