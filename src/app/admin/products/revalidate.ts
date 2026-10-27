import "server-only";
import { revalidatePath } from "next/cache";

/** Product pages are cached; any change can show up on several of them (related cards, reviews), so refresh all. */
export function refreshSite() {
  revalidatePath("/", "layout");
}
