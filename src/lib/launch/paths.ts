/** The launch site: the homepage and its dated previews. They use none of the app's chrome. */
export const isLaunchPath = (pathname: string) => pathname === "/" || pathname.startsWith("/launch-preview");
