/**
 * Branded loading indicator: the DocuCheck flag mark, rotating.
 * Used for full-screen waits (auth guard) and inline loading states.
 */
export default function BrandLoader({ size = 46, fullscreen = false, label = "Loading" }) {
  const mark = (
    <span role="status" aria-label={label} className="inline-grid place-items-center">
      <img
        src="/landing/logo.svg"
        alt=""
        width={size}
        height={size}
        className="animate-spin [animation-duration:1100ms] [animation-timing-function:cubic-bezier(0.45,0,0.55,1)]"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
  if (!fullscreen) return mark;
  return <div className="grid min-h-screen place-items-center bg-paper">{mark}</div>;
}
