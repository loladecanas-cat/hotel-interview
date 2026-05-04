import type { User } from './types'

export const session = {
  getUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem('hb_user') ?? 'null')
    } catch {
      return null
    }
  },
  setUser(user: User) {
    localStorage.setItem('hb_user', JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem('hb_user')
  },
}
