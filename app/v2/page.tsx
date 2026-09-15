import { redirect } from 'next/navigation';

/**
 * The v2 landing became the standard home page (served at `/`). Keep this route
 * as a permanent redirect so old `/v2` links continue to work without serving
 * duplicate content.
 */
export default function V2Redirect() {
  redirect('/');
}
