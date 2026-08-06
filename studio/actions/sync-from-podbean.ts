import {useCallback, useState} from 'react'
import {useToast} from '@sanity/ui'
import {useClient, type DocumentActionComponent} from 'sanity'

import {SANITY_API_VERSION} from '../../src/lib/sanity/config'
import {
  FEED_UNREACHABLE_DETAIL,
  FEED_UNREACHABLE_TITLE,
  PodbeanFeedUnreachableError,
  PodbeanSyncCollisionError,
  syncEpisodeDrafts,
  type SyncOutcome,
} from '../lib/podbean-feed'

/** "1 draft" / "3 drafts", so the toast reads like a sentence. */
function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function summarise(outcome: SyncOutcome): string {
  const parts = [
    outcome.created === 0 ? 'no new episodes' : `created ${plural(outcome.created, 'draft')}`,
    `${outcome.existing} of ${outcome.total} already in Sanity`,
  ]
  // Only mentioned when it happens: a feed that repeats a guid is a feed
  // anomaly worth surfacing, and silence would make the counts look wrong.
  if (outcome.duplicates > 0) {
    parts.push(`${plural(outcome.duplicates, 'duplicate guid')} in the feed, counted once`)
  }
  return parts.join('; ')
}

/**
 * "Sync from Podbean" — added to the `episode` document actions alongside the
 * publish action (wired in sanity.config.ts).
 *
 * A button, not a schedule. There is no cron, no webhook and no shared secret
 * anywhere in this integration: an editor presses this when they have published
 * an episode on Podbean, and every new feed item becomes a **draft** to review.
 *
 * It creates drafts and nothing else — it does not import `publishEpisode()`,
 * so it cannot freeze a slug or write a slug lock. That is deliberate and it is
 * AC-5.1/AC-5.2's mechanism: a permanent URL is only ever minted by a human
 * pressing Publish.
 *
 * The action is attached to a document because that is the only place the
 * Studio offers, but it operates on the dataset rather than on `props.id`, and
 * touches the document it was invoked from only if that episode is missing.
 *
 * Declared under an uppercase name because a document action *is* a React
 * component; `react-hooks/rules-of-hooks` only recognises it as one, and only
 * checks the hooks below, if it is named like one.
 */
const SyncFromPodbeanAction: DocumentActionComponent = (props) => {
  const {type, onComplete} = props
  const toast = useToast()
  const [isSyncing, setIsSyncing] = useState(false)

  // The Studio's own authenticated client, pinned to the same API version as
  // the read path so the two cannot drift apart. Permission to create a draft
  // is the dataset's decision; a reader who presses this gets the API's own
  // refusal in the error toast below rather than a disabled button, because
  // there is no document pair to ask `useDocumentPairPermissions` about — the
  // documents in question are the ones that do not exist yet.
  const client = useClient({apiVersion: SANITY_API_VERSION})

  const handle = useCallback(() => {
    setIsSyncing(true)

    syncEpisodeDrafts(client)
      .then((outcome) => {
        setIsSyncing(false)
        toast.push({
          status: outcome.created > 0 ? 'success' : 'info',
          title: summarise(outcome),
          description:
            outcome.created > 0
              ? 'New episodes are drafts. Give each one a URL slug and publish it when it is ready.'
              : undefined,
        })
        onComplete()
      })
      .catch((error: unknown) => {
        setIsSyncing(false)

        // The one failure an editor cannot diagnose from a generic message,
        // and the one this action's dependency on a third party's header makes
        // foreseeable. Named as itself.
        if (error instanceof PodbeanFeedUnreachableError) {
          toast.push({
            status: 'error',
            title: FEED_UNREACHABLE_TITLE,
            description: FEED_UNREACHABLE_DETAIL,
          })
          return
        }

        if (error instanceof PodbeanSyncCollisionError) {
          toast.push({status: 'error', title: error.message, description: error.detail})
          return
        }

        toast.push({
          status: 'error',
          title: error instanceof Error ? error.message : 'Failed to sync from Podbean',
        })
      })
  }, [client, onComplete, toast])

  if (type !== 'episode') return null

  return {
    label: isSyncing ? 'Syncing…' : 'Sync from Podbean',
    disabled: isSyncing,
    onHandle: handle,
  }
}

SyncFromPodbeanAction.displayName = 'SyncFromPodbeanAction'

export {SyncFromPodbeanAction as syncFromPodbeanAction}
