import { Suspense } from "react";
import BrowseView from "./components/BrowseView";

export default function FontsPage() {
  // BrowseView reads the ?tag filter via useSearchParams, which Next requires to
  // sit under a Suspense boundary to keep this route static.
  return (
    <Suspense>
      <BrowseView />
    </Suspense>
  );
}
