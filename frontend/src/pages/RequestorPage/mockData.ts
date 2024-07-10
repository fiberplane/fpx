// NOTE - Useful for testing rendering of ai markdown in the DOM without hitting openai
export function getMockAiSummary() {
  const MOCK_AI_SUMMARY =
    "The request to `/api/geese/9876543210` resulted in a 500 error. The error occurred because the value `9876543210` is out of range for the integer type in PostgreSQL.\n\n### Suggested Fix:\nEnsure the `id` parameter is within the valid range for an integer or change the database schema to use a larger integer type (e.g., `BIGINT`).\n\n```sql\nALTER TABLE geese ALTER COLUMN id TYPE BIGINT;\n```\n\nAdditionally, you might want to validate the `id` parameter before querying the database:\n\n```javascript\nconst id = parseInt(c.req.param('id'), 10);\nif (isNaN(id) || id > Number.MAX_SAFE_INTEGER) {\n  return c.json({ message: 'Invalid ID' }, 400);\n}\n```";

  return MOCK_AI_SUMMARY;
}
