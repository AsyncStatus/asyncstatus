export function AsyncStatusLogo({
  className,
  pathClassName,
}: {
  className?: string;
  pathClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 431 359"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AsyncStatus Logo"
      className={className}
    >
      <path
        className={pathClassName}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M288.394 179.943L431 358.986H0.00490359L142.603 179.953L-0.00292969 0.90918L430.992 0.909207L288.394 179.943Z"
        fill="currentColor"
      />
    </svg>
  );
}
AsyncStatusLogo.displayName = "AsyncStatusLogo";
