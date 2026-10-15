/**
 * Renders a schema.org JSON-LD block.
 *
 * Server component: emits a plain <script type="application/ld+json">. The
 * payload is serialized with JSON.stringify and the closing-tag sequence is
 * escaped, so restaurant/dish names coming from owner input cannot break out of
 * the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // `</script>` inside a JSON string would terminate the block early; escaping
  // the `<` prevents that without changing the parsed value.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      // The content is our own serialized object, not raw user HTML.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
