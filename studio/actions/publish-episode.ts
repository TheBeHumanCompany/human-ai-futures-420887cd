import {useCallback, useMemo, useState} from 'react'
import {useToast} from '@sanity/ui'
import {
  useClient,
  useDocumentPairPermissions,
  useSyncState,
  useValidationStatus,
  type DocumentActionComponent,
  type SanityClient,
} from 'sanity'

import {SANITY_API_VERSION} from '../../src/lib/sanity/config'
import {
  publishEpisode,
  PublishConflictError,
  SlugImmutableError,
  SlugTakenError,
  type PublishDeps,
} from '../../src/lib/sanity/publish'

/**
 * Dropped from the draft before it becomes the published document.
 *
 * A denylist rather than an allowlist of authored fields: an allowlist has to be
 * kept in step with `schemaTypes/episode.ts` forever, and the day it falls
 * behind, `createOrReplace` silently wipes whatever it forgot — `guestKey` and
 * `seededBy` are exactly the readOnly provenance fields nobody would remember to
 * add. Everything here is either set explicitly below, a Sanity draft artifact,
 * or recomputed by `publishEpisode()` itself.
 */
const OMITTED_FIELDS = new Set([
  '_id',
  '_rev',
  '_createdAt',
  '_updatedAt',
  '_originalId',
  'slug',
  'slugFrozenAt',
  'searchText',
])

/**
 * Re-exported so the Studio's transport story stays readable from this file,
 * and so the existing `studio-publish-deps.test.ts` import keeps resolving.
 *
 * The implementation moved to `src/lib/sanity/client-errors.ts` when the Node
 * scripts adopted `@sanity/client` too (Decision D): both writers that speak to
 * Sanity through the official client need the same `statusCode` -> `status`
 * translation, and this module imports React and `sanity` at module scope, so a
 * script cannot borrow it from here.
 */
import {normalizeSanityError} from '../../src/lib/sanity/client-errors'

export {normalizeSanityError}

/**
 * The Studio-side transport for `publishEpisode()`.
 *
 * Kept as a plain function of a client — no hooks — so the adapter logic that
 * actually has to be right (the null filtering, the error translation above) is
 * testable without a React or Studio runtime. The component below supplies the
 * real client from `useClient()`.
 */
export function createStudioPublishDeps(client: SanityClient): PublishDeps {
  return {
    // `client.getDocuments()` returns an array parallel to `ids` with a `null`
    // per missing document; `publishEpisode()` expects only the documents that
    // exist, the way Sanity's own doc endpoint replies.
    getDocuments: (ids) =>
      client
        .getDocuments(ids)
        .then((docs) => docs.filter((doc): doc is NonNullable<typeof doc> => doc !== null)),
    mutate: async (mutations) => {
      try {
        return await client.mutate(mutations as Parameters<typeof client.mutate>[0])
      } catch (error) {
        throw normalizeSanityError(error)
      }
    },
  }
}

/**
 * Replaces the built-in `publish` action for `episode` documents only (wired
 * in sanity.config.ts). Calls `publishEpisode()` directly — Decision F's
 * slug/episode compare-and-set — rather than Sanity's own publish operation.
 *
 * Replacing the built-in action means also replacing the safeguards it carried,
 * which is what `useValidationStatus`, `useDocumentPairPermissions` and
 * `useSyncState` are doing below: without them this action would happily
 * publish a draft missing `guid`, `title`, `audioUrl` or `publishedAt` — all
 * `rule.required()` — that Sanity's own button would have refused.
 *
 * Release/version publishing is deliberately out of scope: this project has no
 * release workflow, so the action ignores `props.version`/`props.release` the
 * way the pre-release Studio did. Considered, not overlooked.
 *
 * Declared under an uppercase name because a document action *is* a React
 * component; `react-hooks/rules-of-hooks` only recognises it as one, and only
 * checks the hooks below, if it is named like one.
 */
const PublishEpisodeAction: DocumentActionComponent = (props) => {
  const {type, draft, onComplete} = props
  const toast = useToast()
  const [isPublishing, setIsPublishing] = useState(false)

  // The Studio's own authenticated client. `publishEpisode()` defaults to the
  // raw-fetch transport in src/lib/sanity/http.ts, whose `mutate()` reads
  // SANITY_WRITE_TOKEN from process.env — which does not exist in a browser
  // bundle, and which must never be shipped to one even if it did. Pinned to
  // the same API version as the read path so the two cannot drift apart.
  const client = useClient({apiVersion: SANITY_API_VERSION})

  // The draft is what is being validated and what is about to be published, so
  // it — not the published document — is the validation target. `true` for
  // `requirePublishedReferences` mirrors the built-in action, which passes
  // `!release` and therefore `true` for every non-release publish.
  const validationStatus = useValidationStatus(draft?._id ?? props.id, props.type, true)
  const syncState = useSyncState(props.id, props.type)

  const permissionOptions = useMemo(
    () => ({id: props.id, type: props.type, permission: 'publish' as const}),
    [props.id, props.type],
  )
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions(permissionOptions)

  const slug = (draft?.slug as {current?: string} | undefined)?.current
  const hasValidationErrors = validationStatus.validation.some((marker) => marker.level === 'error')
  // Stale validation is pending validation: `revision` lags `draft._rev` until
  // the markers describe the edit actually on screen, and markers for a
  // superseded revision say nothing about what is about to be published.
  const isValidationPending =
    validationStatus.isValidating || (draft !== null && validationStatus.revision !== draft._rev)
  // Not yet safe to read the draft as final: either the markers or the draft
  // itself are still catching up with the editor.
  const isSettling = isValidationPending || syncState.isSyncing
  const canPublish = permissions?.granted === true

  const handle = useCallback(() => {
    if (!draft) return

    if (!slug) {
      toast.push({
        status: 'error',
        title: 'this episode needs a URL slug before it can be published',
      })
      return
    }

    // Defence in depth, not belt-and-braces: Sanity documents `disabled` as a
    // presentation hint that does not reliably prevent invocation, and every
    // one of these is a safeguard the built-in publish action enforced before
    // this one took its place.
    if (!canPublish) {
      toast.push({status: 'error', title: 'you do not have permission to publish this episode'})
      return
    }

    if (isSettling) {
      toast.push({status: 'warning', title: 'still checking this episode — try again in a moment'})
      return
    }

    if (hasValidationErrors) {
      toast.push({
        status: 'error',
        title: 'this episode has validation errors; fix them before publishing',
      })
      return
    }

    const episodeDoc: Record<string, unknown> = {}
    for (const [field, value] of Object.entries(draft)) {
      if (!OMITTED_FIELDS.has(field)) episodeDoc[field] = value
    }
    // After the copy, not before: these two are the published identity and must
    // win over anything carried across from the `drafts.<id>` document.
    episodeDoc._id = props.id
    episodeDoc._type = 'episode'

    setIsPublishing(true)

    publishEpisode(
      {episodeDoc, slug, mode: 'author', deleteDraftId: draft._id},
      createStudioPublishDeps(client),
    )
      .then(() => {
        setIsPublishing(false)
        onComplete()
      })
      .catch((error: unknown) => {
        setIsPublishing(false)
        if (error instanceof PublishConflictError) {
          toast.push({
            status: 'error',
            title: 'this episode was published by someone else; reload and try again',
          })
          return
        }
        if (error instanceof SlugTakenError || error instanceof SlugImmutableError) {
          toast.push({status: 'error', title: error.message})
          return
        }
        toast.push({
          status: 'error',
          title: error instanceof Error ? error.message : 'Failed to publish episode',
        })
      })
  }, [
    client,
    draft,
    slug,
    props.id,
    onComplete,
    toast,
    canPublish,
    hasValidationErrors,
    isSettling,
  ])

  if (type !== 'episode') return null

  // Ordered so the reason shown is the one the editor can act on first.
  const disabledReason = !draft
    ? 'there is nothing to publish'
    : !slug
      ? 'this episode needs a URL slug before it can be published'
      : !isPermissionsLoading && !canPublish
        ? 'you do not have permission to publish this episode'
        : hasValidationErrors
          ? 'this episode has validation errors; fix them before publishing'
          : null

  const isBusy = isPublishing || isPermissionsLoading || isSettling

  return {
    label: isPublishing ? 'Publishing…' : 'Publish episode',
    tone: 'positive',
    disabled: disabledReason !== null || isBusy || !canPublish,
    title: disabledReason ?? undefined,
    onHandle: handle,
  }
}

PublishEpisodeAction.action = 'publish'
PublishEpisodeAction.displayName = 'PublishEpisodeAction'

export {PublishEpisodeAction as publishEpisodeAction}
