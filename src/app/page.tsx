import { ConnectionStatus } from "@/components/connection-status";
import Link from "next/link";

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="StudyCraft home">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span>StudyCraft</span>
        </a>
        <div className="nav-actions"><Link className="foundation-badge" href="/login">Sign in</Link></div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Family-first learning</p>
          <h1>A calmer way to prepare, practise and remember.</h1>
          <p className="hero-lede">
            StudyCraft will turn the chapters your children already study into
            focused practice, helpful feedback and revision that adapts to each
            learner.
          </p>
          <ConnectionStatus />
        </div>

        <aside className="study-preview" aria-label="Product direction preview">
          <div className="preview-topline">
            <span>Coming next</span>
            <span className="preview-page">Early Vedic Civilization</span>
          </div>
          <div className="preview-question">
            <p className="preview-kicker">Chapter practice</p>
            <h2>Built around what they actually need to learn.</h2>
            <div className="preview-progress" aria-hidden="true">
              <span />
            </div>
            <div className="preview-answer">
              Questions, textbook citations and progress will appear here as
              the next stories are delivered.
            </div>
          </div>
        </aside>
      </section>

      <section className="principles" aria-label="StudyCraft principles">
        <article>
          <span className="principle-number">01</span>
          <h2>Grounded in their books</h2>
          <p>Every scored idea will point back to the chapter page that supports it.</p>
        </article>
        <article>
          <span className="principle-number">02</span>
          <h2>Personal, never comparative</h2>
          <p>Each child gets private progress, review timing and encouragement.</p>
        </article>
        <article>
          <span className="principle-number">03</span>
          <h2>Useful AI, controlled cost</h2>
          <p>Heavy content work happens once; everyday practice stays lightweight.</p>
        </article>
      </section>
    </main>
  );
}
