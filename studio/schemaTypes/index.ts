import {episode} from './episode'
import {topic} from './topic'
import {slugLock} from './slugLock'

/**
 * Registered schema types.
 *
 * Exported individually as well as in the array so the schema-contract test can
 * import a single type and assert against its fields. That test is what makes a
 * renamed CMS field break CI instead of silently blanking a section on every
 * rendered page, so these exports are load-bearing, not convenience.
 */
export {episode, topic, slugLock}

export const schemaTypes = [episode, topic, slugLock]
