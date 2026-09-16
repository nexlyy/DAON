export function parseStaff(value) {
  return new Set(
    String(value ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id)),
  )
}

export const isStaff = (staff, user, chat) =>
  chat?.type === 'private' && staff.has(String(user?.id ?? ''))

export const nameOf = (user) =>
  user?.first_name || (user?.username ? `@${user.username}` : String(user?.id ?? 'staff'))
