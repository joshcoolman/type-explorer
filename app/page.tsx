import SuggestedPairings from "./components/SuggestedPairings";
import type { Pairing } from "../lib/types";
import data from "../content/suggested-pairings.json";

export default function Home() {
  return <SuggestedPairings pairings={data.pairings as Pairing[]} />;
}
