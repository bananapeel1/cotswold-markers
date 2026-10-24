/** The arrow on the page's buttons, drawn rather than typed so it matches the other icons. */
export default function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg className={down ? "ar dn" : "ar"} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={down ? "M8 2.5v11M3.5 9l4.5 4.5L12.5 9" : "M2.5 8h11M9 3.5 13.5 8 9 12.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
