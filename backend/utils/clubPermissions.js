const pool = require('../config/db')

const normalizeRole = role => {
  if (role === 'club_member') return 'member'
  if (['admin', 'photographer', 'member', 'viewer'].includes(role)) return role
  return 'viewer'
}

const getClubRole = async (userId, clubId) => {
  if (!userId || !clubId) return 'viewer'
  const result = await pool.query(
    'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
    [userId, clubId]
  )
  return normalizeRole(result.rows[0]?.role)
}

const getEventAccess = async (userId, eventId) => {
  const result = await pool.query(
    `SELECT e.*, c.name as club_name, cm.role as user_role
     FROM events e
     LEFT JOIN clubs c ON e.club_id = c.id
     LEFT JOIN club_members cm ON cm.club_id = e.club_id AND cm.user_id = $2
     WHERE e.id = $1`,
    [eventId, userId]
  )

  const event = result.rows[0]
  if (!event) return null

  const role = normalizeRole(event.user_role)
  return {
    event,
    role,
    canView: event.is_public || event.created_by === userId || role === 'admin' || role === 'member',
    canUpload: role === 'admin' || (role === 'photographer' && event.created_by === userId),
    canManageEvent: role === 'admin' || (role === 'photographer' && event.created_by === userId),
    canViewMedia: media => media.is_public || media.uploaded_by === userId || role === 'admin' || role === 'member' || (role === 'photographer' && event.created_by === userId),
    canDeleteMedia: media => role === 'admin' || media.uploaded_by === userId
  }
}

module.exports = { normalizeRole, getClubRole, getEventAccess }
