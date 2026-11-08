import WorkspacePage from "./workspace/[section]/page";

// The public entrypoint must show the same seven-section workspace as Vercel.
// Reuse the overview page instead of maintaining a stale parallel homepage.
export default function Home() {
  return <WorkspacePage params={Promise.resolve({ section: "overview" })} />;
}
