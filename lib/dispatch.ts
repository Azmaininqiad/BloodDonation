import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification, type NotificationRow } from '@/lib/notify'

const CONCURRENCY = 5

/** Pull pending notifications from DB and send them. Returns {sent, failed}. */
export async function dispatchPendingNotifications(): Promise<{ sent: number; failed: number }> {
  const supabase = createAdminClient()
  let sent = 0
  let failed = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: rows, error } = await supabase.rpc('claim_pending_notifications', { p_limit: 25 })
    if (error) { console.error('[dispatch] claim error:', error.message); break }
    if (!rows || rows.length === 0) break

    // Process in batches of CONCURRENCY
    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const batch = rows.slice(i, i + CONCURRENCY) as NotificationRow[]
      await Promise.all(
        batch.map(async (row) => {
          try {
            const result = await sendNotification(row)
            await supabase.rpc('mark_notification_delivery', {
              p_id: row.notification_id,
              p_ok: result.ok,
              p_channel: result.channel,
              p_error: result.error ?? null,
            })
            if (result.ok) sent++; else failed++
          } catch (err: unknown) {
            console.error('[dispatch] row error:', err)
            await supabase.rpc('mark_notification_delivery', {
              p_id: row.notification_id,
              p_ok: false,
              p_channel: 'unknown',
              p_error: err instanceof Error ? err.message : 'unknown',
            }).catch(() => {})
            failed++
          }
        })
      )
    }
  }

  return { sent, failed }
}
