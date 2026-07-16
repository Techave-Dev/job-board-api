-- @param {BigInt} $1:id
DELETE FROM attachments
WHERE id = $1
RETURNING id;
