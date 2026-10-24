/**
 * Small icons for the drawn marker page, shaped after the Material Symbols the
 * real page uses, so the drawing and the app look the same.
 */

const I = {
  pin: <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />,
  route: (
    <path
      d="M12 22v-8.5M12 13.5 6 7.5M12 13.5l6-6M6 7.5V3.5M6 3.5H2.5M6 3.5 3 6.5M18 7.5V3.5M18 3.5h3.5M18 3.5l3 3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  near: <path d="M21 3 3 10.5l7.2 2.3L12.5 20z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />,
  stay: <path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z" />,
  food: <path d="M7 2v8a2 2 0 0 0 2 2v10h2V12a2 2 0 0 0 2-2V2h-1.6v6h-1.2V2H8.8v6H7.6V2zm9 0c-1.7 0-3 2.2-3 5v6h2v9h2V2z" />,
  water: <path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5z" />,
  shop: <path d="M6 7h12l1 15H5zM9 7V6a3 3 0 0 1 6 0v1" />,
  wc: (
    <path d="M6 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM4 8h4l1 7H7.5v7h-3v-7H3zm12 0h4l2 8h-2.5v6h-3v-6H14z" />
  ),
  cloud: <path d="M7 19a5 5 0 0 1-.6-10A6.5 6.5 0 0 1 19 10.5 4.3 4.3 0 0 1 18 19z" fill="none" stroke="currentColor" strokeWidth="2" />,
  person: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8c0-3 3.1-5 7-5s7 2 7 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  ),
  map: <path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  // Look Out For and the rest of the page
  eye: (
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  ),
  bird: (
    <path d="M2 9c3 0 5 1.2 6.5 3.5C10 9 13 6.5 17 6.5c1.6 0 2.8.6 3.5 1.5l1.5.5-1.6 1c-.6 4.6-4.2 8-9 8-2.6 0-4.6-1-6-2.5L8 13.5C5.8 13.2 3.6 11.6 2 9z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  ),
  frost: (
    <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  leaf: (
    <path d="M5 19C5 10 10 4.5 20 4c.4 9.6-5 15-13.5 15M5 19l7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  flag: <path d="M5 21V4h11l-1.5 4L16 12H5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  camera: (
    <path d="M3 8h4l2-3h6l2 3h4v11H3zm9 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  ),
  phone: (
    <path d="M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM11 18.5h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  ),
};

export type IconName = keyof typeof I;

export const Icon = ({ i, size = 24, fill = "currentColor" }: { i: IconName; size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
    {I[i]}
  </svg>
);
