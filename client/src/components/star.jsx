// The four-point spark mark — the brand motif.
// Reusable at any size via the `size` prop and currentColor for colour.
function Star({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}
      fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* A sharp 4-point spark: long tapered spines meeting at the centre */}
      <path d="M50 0 L56 44 L100 50 L56 56 L50 100 L44 56 L0 50 L44 44 Z" />
    </svg>
  );
}

export default Star;