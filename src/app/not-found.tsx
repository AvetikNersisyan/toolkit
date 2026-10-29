import { ProblemPage } from "@/components/SiteChrome";

// Shown for unknown URLs and for products that are drafts, archived or deleted.
// Kept static (no database) so the build never needs the DB. Next adds a noindex tag itself.
export default function NotFound() {
  return (
    <ProblemPage
      title="Էջը չի գտնվել"
      text="Հնարավոր է՝ ապրանքն այլևս հասանելի չէ կամ հղումը սխալ է։ Նայեք մեր մյուս գործիքները կամ զանգահարեք մեզ։"
    />
  );
}
