import './App.css'
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

type IconName = 'arrow' | 'github' | 'linkedin' | 'x' | 'mail'

type SocialLink = {
  label: string
  href: string
  icon: IconName
}

type Project = {
  title: string
  summary: string
  stack: string
  liveUrl: string
  repoUrl: string
  tone: 'warm' | 'code' | 'violet' | 'cyan' | 'peach'
  size: 'wide' | 'tall' | 'feature' | 'standard'
}

const CARD_TILT_MAX_DEG = 11

type PointerPos = { x: number; y: number }

const PointerTiltContext = createContext<PointerPos | null>(null)

function PointerTiltProvider({ children }: { children: ReactNode }) {
  const [pos, setPos] = useState<PointerPos | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const frameRef = useRef<number | null>(null)
  const pendingRef = useRef<PointerPos | null>(null)

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    const flush = () => {
      frameRef.current = null
      const next = pendingRef.current
      if (!next) return
      setPos((prev) =>
        prev && prev.x === next.x && prev.y === next.y ? prev : next,
      )
    }

    const onPointerMove = (e: PointerEvent) => {
      pendingRef.current = { x: e.clientX, y: e.clientY }
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(flush)
    }

    const onPointerLeaveWindow = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      pendingRef.current = null
      setPos(null)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener(
      'mouseleave',
      onPointerLeaveWindow,
    )

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener(
        'mouseleave',
        onPointerLeaveWindow,
      )
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [reducedMotion])

  return (
    <PointerTiltContext.Provider value={reducedMotion ? null : pos}>
      {children}
    </PointerTiltContext.Provider>
  )
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)

    sync()
    mq.addEventListener('change', sync)

    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

function ProjectCard({
  project,
  index,
}: {
  project: Project
  index: number
}) {
  const pointer = useContext(PointerTiltContext)
  const cardRef = useRef<HTMLElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  useLayoutEffect(() => {
    const el = cardRef.current
    if (!el || !pointer) {
      setTilt((prev) =>
        prev.rx === 0 && prev.ry === 0 ? prev : { rx: 0, ry: 0 },
      )
      return
    }

    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const halfW = Math.max(rect.width / 2, 1)
    const halfH = Math.max(rect.height / 2, 1)
    const nx = (pointer.x - cx) / halfW
    const ny = (pointer.y - cy) / halfH
    const clamp = (v: number) => Math.max(-1, Math.min(1, v))
    const ry = clamp(nx) * CARD_TILT_MAX_DEG
    const rx = clamp(-ny) * CARD_TILT_MAX_DEG

    setTilt((prev) =>
      prev.rx === rx && prev.ry === ry ? prev : { rx, ry },
    )
  }, [pointer])

  const tiltStyle =
    pointer === null
      ? {}
      : ({
          '--tilt-rx': `${tilt.rx}deg`,
          '--tilt-ry': `${tilt.ry}deg`,
        } as CSSProperties)

  return (
    <article
      ref={cardRef}
      className="project-card"
      data-size={project.size}
      data-tone={project.tone}
      style={
        {
          '--card-index': index,
          ...tiltStyle,
        } as CSSProperties
      }
    >
      <div className="project-preview" aria-hidden="true">
        <span className="preview-orb" />
        <span className="preview-line preview-line-long" />
        <span className="preview-line" />
      </div>

      <div className="project-copy">
        <p>{project.stack}</p>
        <h3>{project.title}</h3>
        <span>{project.summary}</span>
      </div>

      <div className="project-actions">
        <a
          className="icon-button"
          href={project.liveUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open live site for ${project.title}`}
          title="Live site"
        >
          <Icon name="arrow" />
        </a>
        <a
          className="icon-button"
          href={project.repoUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open source repository for ${project.title}`}
          title="Source code"
        >
          <Icon name="github" />
        </a>
      </div>
    </article>
  )
}

const socialLinks: SocialLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/camatlala',
    icon: 'github',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/camatlala/',
    icon: 'linkedin',
  },
  {
    label: 'Email',
    href: 'mailto:antoniomatlala02@gmail.com',
    icon: 'mail',
  },
]

const projects: Project[] = [
  {
    title: 'Ster Stumpie · After Dark',
    summary:
      'My mockup marketing site for an alcoholic take on Steri Stumpie — single-page, night-mode brand play.',
    stack: 'React / Tailwind / Create React App',
    liveUrl: 'https://ster-stumpie.netlify.app/',
    repoUrl: 'https://github.com/camatlala/ster-stumpie',
    tone: 'warm',
    size: 'feature',
  },
  {
    title: 'ChatReplay',
    summary:
      'Read exported WhatsApp chats in a familiar scrollable UI — files stay on your device, no server or sign-in.',
    stack: 'React / TypeScript / Vite / Tailwind',
    liveUrl: 'https://mychatreplay.netlify.app/',
    repoUrl: 'https://github.com/camatlala/chatreplay',
    tone: 'code',
    size: 'tall',
  },
  {
    title: 'Orbit Notes',
    summary: 'Fast notes with keyboard-first capture and search.',
    stack: 'React / Local-first',
    liveUrl: 'https://antonio-matlala.dev/orbit-notes',
    repoUrl: 'https://github.com/AntonioMatlala/orbit-notes',
    tone: 'violet',
    size: 'standard',
  },
  {
    title: 'Kasi Maps',
    summary: 'Neighborhood discovery experience with curated routes.',
    stack: 'Maps API / CSS Motion',
    liveUrl: 'https://antonio-matlala.dev/kasi-maps',
    repoUrl: 'https://github.com/AntonioMatlala/kasi-maps',
    tone: 'cyan',
    size: 'wide',
  },
  {
    title: 'Pulse Forms',
    summary: 'Accessible form flows with clear validation states.',
    stack: 'TypeScript / Zod',
    liveUrl: 'https://antonio-matlala.dev/pulse-forms',
    repoUrl: 'https://github.com/AntonioMatlala/pulse-forms',
    tone: 'peach',
    size: 'standard',
  },
]

function Icon({ name }: { name: IconName }) {
  if (name === 'github') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.19-3.37-1.19a2.65 2.65 0 0 0-1.11-1.46c-.91-.62.07-.61.07-.61a2.1 2.1 0 0 1 1.53 1.03 2.13 2.13 0 0 0 2.91.83 2.14 2.14 0 0 1 .64-1.34c-2.22-.25-4.56-1.11-4.56-4.94a3.87 3.87 0 0 1 1.03-2.69 3.6 3.6 0 0 1 .1-2.65s.84-.27 2.75 1.03A9.45 9.45 0 0 1 12 6.98c.85 0 1.7.11 2.5.34 1.9-1.3 2.74-1.03 2.74-1.03.37.83.4 1.77.1 2.65a3.84 3.84 0 0 1 1.03 2.69c0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    )
  }

  if (name === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.94 8.98H3.75v10.27h3.19V8.98ZM5.35 4a1.85 1.85 0 1 0 0 3.7 1.85 1.85 0 0 0 0-3.7Zm13.9 9.57c0-3.1-1.66-4.54-3.87-4.54a3.34 3.34 0 0 0-3.02 1.66h-.04V8.98H9.27v10.27h3.18v-5.08c0-1.34.25-2.64 1.92-2.64 1.64 0 1.66 1.54 1.66 2.73v4.99h3.22v-5.68Z" />
      </svg>
    )
  }

  if (name === 'x') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m13.9 10.47 7.43-8.64h-1.76l-6.45 7.5-5.15-7.5H2.03l7.8 11.35-7.8 9.07h1.76l6.82-7.93 5.44 7.93H22l-8.1-11.78Zm-2.41 2.8-.8-1.13-6.28-8.98h2.72l5.07 7.25.79 1.13 6.59 9.43h-2.72l-5.37-7.7Z" />
      </svg>
    )
  }

  if (name === 'mail') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 5.5h15A2.5 2.5 0 0 1 22 8v8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 16V8a2.5 2.5 0 0 1 2.5-2.5Zm0 2 7.5 5.1 7.5-5.1h-15Zm15 9a.5.5 0 0 0 .5-.5V9.53l-7.44 5.06a1 1 0 0 1-1.12 0L4 9.53V16a.5.5 0 0 0 .5.5h15Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 4h6v6h-2V7.41l-7.3 7.3-1.4-1.42 7.29-7.29H14V4ZM5 6h6v2H7v9h9v-4h2v6H5V6Z" />
    </svg>
  )
}

function App() {
  return (
    <PointerTiltProvider>
    <main className="portfolio-page" aria-label="Antonio Matlala portfolio">
      <section className="portfolio-shell" aria-label="Portfolio showcase">
        <div className="portfolio-split">
          <aside className="identity-zone" aria-labelledby="intro-title">
            <div className="identity-card">
              <p className="eyebrow">Building digital products</p>
              <h1 id="intro-title">
                Antonio Matlala
                <span>Frontend Developer</span>
              </h1>
              <p className="tagline">
                I shape fast React interfaces, design systems, and practical
                product tools with a cinematic edge.
              </p>
              <p className="stack-line">
                React / TypeScript / Firebase / Supabase / CSS Motion
              </p>

              <nav className="social-list" aria-label="Social links">
                {socialLinks.map((link) => (
                  <a
                    className="social-link"
                    href={link.href}
                    key={link.label}
                    target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={
                      link.href.startsWith('mailto:')
                        ? undefined
                        : 'noreferrer'
                    }
                    aria-label={`Open Antonio Matlala on ${link.label}`}
                  >
                    <Icon name={link.icon} />
                    <span>{link.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <section className="project-zone" aria-labelledby="projects-title">
            <div className="project-heading">
              <p className="eyebrow">Selected work</p>
              <h2 id="projects-title">Project grid</h2>
            </div>

            <div className="project-grid">
              {projects.map((project, index) => (
                <ProjectCard
                  project={project}
                  index={index}
                  key={project.title}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
    </PointerTiltProvider>
  )
}

export default App
