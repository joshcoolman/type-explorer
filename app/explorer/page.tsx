import { redirect } from "next/navigation";

/** The font browser moved to the app root; keep old links working. */
export default function ExplorerPage() {
  redirect("/");
}
