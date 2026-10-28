-- Needed for exclusion constraints over time ranges (bitemporal history).
-- On Azure, btree_gist must also be allowlisted in the server's azure.extensions parameter.
CREATE EXTENSION IF NOT EXISTS btree_gist;
