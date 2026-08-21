import * as React from "react";

const DESKTOP_REQUIRED_BREAKPOINT = 1024;

/** Returns true for phones and tablets; admin workspaces require a desktop-class viewport. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < DESKTOP_REQUIRED_BREAKPOINT);
    update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update);
  }, []);
  return isMobile;
}
