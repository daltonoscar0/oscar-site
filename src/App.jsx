import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import CursorTrail from "./components/CursorTrail.jsx";
import Hero from "./pages/Hero.jsx";
import About from "./pages/About.jsx";
import Research from "./pages/Research.jsx";
import Now from "./pages/Now.jsx";
import Projects from "./pages/Projects.jsx";
import Contact from "./pages/Contact.jsx";
import Commits, { CommitsSection } from "./pages/Commits.jsx";

// Old routes still land on the right section of the home page.
const ROUTE_TO_SECTION = {
  "/about": "about",
  "/projects": "projects",
  "/books": "now",
  "/contact": "contact",
};

function Home() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const id = hash ? hash.slice(1) : ROUTE_TO_SECTION[pathname.replace(/\/$/, "")];
    if (!id) return;
    const go = () => document.getElementById(id)?.scrollIntoView({ block: "start" });
    requestAnimationFrame(go);
    // Sections above can grow once GitHub data arrives; land again after that.
    const t = setTimeout(go, 900);
    return () => clearTimeout(t);
  }, [pathname, hash]);

  return (
    <>
      <main>
        <Hero />
        <About />
        <Research />
        <Now />
        <CommitsSection />
        <Projects />
      </main>
      <Contact />
    </>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/commits" element={<Commits />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Nav />
      <CursorTrail />
    </>
  );
}
