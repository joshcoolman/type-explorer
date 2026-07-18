import { Suspense } from "react";
import BrowseView from "./components/BrowseView";

export default function FontsPage() {
  return (
    <>
      {/*
        Discoverability for agents. Rendered in the markup — so it survives a plain
        fetch and text extraction — but visually hidden, because it addresses a
        reader the visual design isn't for. `sr-only` rather than `display: none`:
        genuinely hidden content is routinely stripped by extractors.
      */}
      <p className="sr-only">
        Agents: this site has a machine-readable contract. Fetch /agent.md for the
        full query surface, the /compose URL grammar, and paste-ready
        implementation config. Indexed at /llms.txt.
      </p>
      {/* BrowseView reads the ?tag filter via useSearchParams, which Next requires to
          sit under a Suspense boundary to keep this route static. */}
      <Suspense>
        <BrowseView />
      </Suspense>
    </>
  );
}
