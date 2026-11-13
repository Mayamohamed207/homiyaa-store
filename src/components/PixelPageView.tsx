import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/pixel";

export default function PixelPageView() {
  const location = useLocation();
  const first = useRef(true);

  useEffect(() => {
    // index.html already fires PageView on the first load
    if (first.current) {
      first.current = false;
      return;
    }
    trackPageView();
  }, [location.pathname]);

  return null;
}