/**
 * The launch site: the homepage and its dated previews. They use none of the app's chrome.
 * When Vercel rebuilds the homepage in the background (every hour), it renders it as "/index",
 * so that counts too.
 */
export const isLaunchPath = (pathname: string) =>
  pathname === "/" || pathname === "/index" || pathname.startsWith("/launch-preview");
