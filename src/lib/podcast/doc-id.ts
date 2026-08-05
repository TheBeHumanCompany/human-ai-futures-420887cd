export function episodeDocId(guid: string): string {
  // '.' is deliberately excluded from the allowed set (despite being a legal
  // Sanity _id character): Sanity's path()-glob ACL grants (e.g. the default
  // public group's `_id in path("*")`) treat '.' as a path-segment separator,
  // the same way "drafts." and "versions." are. A raw domain-bearing guid
  // (e.g. "show.podbean.com/id") would otherwise sanitise to a multi-segment
  // id that silently falls outside single-segment grants.
  return "episode-" + guid.replace(/[^a-zA-Z0-9_-]/g, "-");
}
