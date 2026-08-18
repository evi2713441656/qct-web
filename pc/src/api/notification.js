import { callCloudOrThrow } from './http.js'

export function getMyNotifications() {
  return callCloudOrThrow('application', { type: 'my_notifications' })
}

export function getPublicNotifications() {
  return callCloudOrThrow('application', { type: 'public_notifications' })
}

export function markNotificationsRead(notificationIds = []) {
  return callCloudOrThrow('application', {
    type: 'mark_notifications_read',
    notificationIds
  })
}
