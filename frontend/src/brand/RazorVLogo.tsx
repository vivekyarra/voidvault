import type { SVGProps } from "react";

interface RazorVLogoProps extends SVGProps<SVGSVGElement> {
  innerFill?: string;
}

export function RazorVLogo({
  innerFill = "#06070a",
  viewBox = "0 0 64 52",
  ...props
}: RazorVLogoProps) {
  return (
    <svg fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M2 2 L32 50 L62 2 L50 2 L32 38 L14 2 Z" fill="#f4f5f8" />
      <path d="M18 2 L32 28 L46 2 Z" fill={innerFill} />
    </svg>
  );
}
