CREATE TABLE IF NOT EXISTS app_routes (
  id INTEGER PRIMARY KEY,
  path TEXT,
  method TEXT,
  handler TEXT,
  handlerType TEXT,
  currentlyRegistered BOOLEAN DEFAULT FALSE,
  registrationOrder INTEGER DEFAULT -1,
  routeOrigin TEXT DEFAULT 'discovered',
  openapiSpec TEXT,
  requestType TEXT DEFAULT 'http',

  -- there are no enums in sqlite so we use check statements
  CONSTRAINT route_origin_check CHECK (routeOrigin IN ('discovered', 'custom', 'open_api')),
  CONSTRAINT request_type_check CHECK (requestType IN ('http', 'websocket'))
);
