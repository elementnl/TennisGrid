export default function TennisBallLogo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ball */}
      <circle cx="50" cy="50" r="46" fill="currentColor" stroke="currentColor" strokeWidth="2" />
      {/* Seam curves */}
      <path
        d="M 28 12 Q 10 35, 18 58 Q 26 82, 38 94"
        stroke="var(--background, #fff)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 62 6 Q 74 18, 82 42 Q 90 65, 72 88"
        stroke="var(--background, #fff)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
