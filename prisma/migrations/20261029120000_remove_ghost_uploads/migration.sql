-- Uploads used to be recorded when a file was previewed, before its rows were
-- saved, so abandoned or failed uploads were left on the Data tab with no data
-- behind them. Uploads are now recorded only when their rows are saved; this
-- removes the leftovers. An upload with no rows shows nothing on the portal,
-- so nothing visible is lost.
DELETE FROM "Upload" u
WHERE NOT EXISTS (SELECT 1 FROM "BudgetRow" b WHERE b."uploadId" = u.id);

-- Replacing fiscal years used to leave the older upload's row count unchanged.
UPDATE "Upload" u
SET "rowCount" = counts.n
FROM (SELECT "uploadId", COUNT(*)::int AS n FROM "BudgetRow" GROUP BY "uploadId") counts
WHERE counts."uploadId" = u.id AND u."rowCount" <> counts.n;

-- Every remaining upload has saved rows.
UPDATE "Upload" SET status = 'mapped' WHERE status <> 'mapped';
