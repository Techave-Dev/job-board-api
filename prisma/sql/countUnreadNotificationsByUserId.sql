-- @param {BigInt} $1:userId
SELECT COUNT(*)::int AS "unreadCount"
FROM notifications
WHERE user_id = $1 AND read = false;