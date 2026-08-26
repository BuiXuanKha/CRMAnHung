type JsonLdProps = {
  data: unknown;
};

/** SSR JSON-LD. Escapes `<` so listing copy cannot break out of the script tag. */
export function JsonLd({ data }: JsonLdProps) {
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: payload }} />
  );
}
