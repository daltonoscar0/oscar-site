import RollingTitle from "../components/RollingTitle.jsx";
import GitHubCard from "../components/GitHubCard.jsx";
import NowBlock from "../components/NowBlock.jsx";
import RecentlyPlayed from "../components/RecentlyPlayed.jsx";
import { site } from "../config.js";

export default function Home() {
  return (
    <>
      <RollingTitle />
      <p className="tagline">{site.tagline}</p>
      <GitHubCard />
      <NowBlock />
      <RecentlyPlayed />
    </>
  );
}
