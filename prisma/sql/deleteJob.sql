-- @param {BigInt} $1:id
DELETE FROM jobs
WHERE id = $1
RETURNING id;
