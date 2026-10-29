import { useEffect, useRef } from "react"

import landingHtml from "@/content/landing.html?raw"

declare global {
  interface Window {
    closeMenu?: () => void
  }
}

function App() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const nav = root.querySelector<HTMLElement>("#nav")
    const ham = root.querySelector<HTMLButtonElement>("#ham")
    const mob = root.querySelector<HTMLElement>("#mobNav")
    const backdrop = root.querySelector<HTMLElement>("#mobBackdrop")
    const form = root.querySelector<HTMLFormElement>("#cForm")
    const formSuccess = root.querySelector<HTMLElement>("#fOk")
    const servicesSection = root.querySelector<HTMLElement>(".services")
    const selects = [...root.querySelectorAll<HTMLSelectElement>("#cForm select.fi-in")]
    const fiElements = [...root.querySelectorAll<HTMLElement>(".fi")]
    const hashLinks = [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
    const navLinks = [
      ...root.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"], .mob-nav-links a[href^="#"]'),
    ]

    if (!nav || !ham || !mob) return

    const updateNav = () => {
      const scrolled = window.scrollY > 40
      nav.classList.toggle("scrolled", scrolled)
      nav.classList.toggle("on-hero", !scrolled)
    }

    const updateActiveNav = () => {
      const offset = window.scrollY + Math.min(window.innerHeight * 0.3, 420)
      const targets = [...root.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]')]
        .map((link) => {
          const href = link.getAttribute("href")
          if (!href) return null
          const section = root.querySelector<HTMLElement>(href)
          return section ? { href, section } : null
        })
        .filter((target): target is { href: string; section: HTMLElement } => Boolean(target))
        .sort((a, b) => a.section.offsetTop - b.section.offsetTop) as Array<{
          href: string
          section: HTMLElement
        }>

      let current = "#home"
      targets.forEach(({ href, section }) => {
        if (section.offsetTop <= offset) current = href
      })

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === current)
      })
    }

    const closeMenu = () => {
      mob.classList.remove("open")
      backdrop?.classList.remove("open")
      ham.classList.remove("open")
      ham.setAttribute("aria-expanded", "false")
      document.body.style.overflow = ""
    }

    const onHamClick = () => {
      const open = mob.classList.toggle("open")
      backdrop?.classList.toggle("open", open)
      ham.classList.toggle("open", open)
      ham.setAttribute("aria-expanded", String(open))
      document.body.style.overflow = open ? "hidden" : ""
    }

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && backdrop?.contains(target)) {
        closeMenu()
        return
      }
      if (target && !ham.contains(target) && !mob.contains(target)) {
        closeMenu()
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("v")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    )

    const smoothHandlers = hashLinks.flatMap((link) => {
      const href = link.getAttribute("href")
      if (!href || href === "#") return []

      const handler = (event: Event) => {
        const target = root.querySelector<HTMLElement>(href)
        if (!target) return
        event.preventDefault()
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 80,
          behavior: "smooth",
        })
      }

      link.addEventListener("click", handler)
      return [{ link, handler }]
    })

    const selectHandlers = selects.map((select) => {
      const handler = () => {
        select.classList.toggle("placeholder", !select.value)
      }
      select.addEventListener("change", handler)
      return { select, handler }
    })

    const onSubmit = (event: Event) => {
      event.preventDefault()
      if (!form || !formSuccess) return

      const name = root.querySelector<HTMLInputElement>("#fname")
      const company = root.querySelector<HTMLInputElement>("#fcompany")
      const email = root.querySelector<HTMLInputElement>("#femail")
      const phone = root.querySelector<HTMLInputElement>("#fphone")
      const segment = root.querySelector<HTMLSelectElement>("#fsegment")

      if (!name || !company || !email || !phone || !segment) return

      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      let isValid = true

      const fields: Array<[HTMLElement, string, () => boolean]> = [
        [name, "eNome", () => name.value.trim().length > 0],
        [company, "eCompany", () => company.value.trim().length > 0],
        [email, "eEmail", () => emailRx.test(email.value)],
        [phone, "ePhone", () => phone.value.trim().length >= 8],
        [segment, "eSegment", () => Boolean(segment.value)],
      ]

      fields.forEach(([field, errorId, test]) => {
        const pass = test()
        field.classList.toggle("err", !pass)
        root.querySelector(`#${errorId}`)?.classList.toggle("on", !pass)
        if (!pass) isValid = false
      })

      if (isValid) {
        form.style.display = "none"
        formSuccess.classList.add("on")
      }
    }

    let servicesResizeHandler: (() => void) | null = null
    let servicesScrollHandler: (() => void) | null = null

    if (servicesSection) {
      const sticky = servicesSection.querySelector<HTMLElement>(".sv-sticky")
      const cards = servicesSection.querySelector<HTMLElement>(".sv-cards")

      if (sticky && cards) {
        const setup = () => {
          if (window.innerWidth <= 860) {
            servicesSection.style.height = ""
            cards.style.transform = ""
            return
          }
          const overflow = cards.scrollWidth - sticky.clientWidth
          servicesSection.style.height = overflow > 0 ? `${sticky.offsetHeight + overflow}px` : ""
        }

        const tick = () => {
          if (window.innerWidth <= 860) return
          const overflow = cards.scrollWidth - sticky.clientWidth
          if (overflow <= 0) return
          const top = servicesSection.getBoundingClientRect().top
          const progress = Math.max(0, Math.min(1, -top / overflow))
          cards.style.transform = `translateX(${-progress * overflow}px)`
        }

        servicesResizeHandler = setup
        servicesScrollHandler = tick
        setup()
        tick()
        window.addEventListener("resize", setup, { passive: true })
        window.addEventListener("scroll", tick, { passive: true })
      }
    }

    window.closeMenu = closeMenu
    fiElements.forEach((element) => observer.observe(element))

    updateNav()
    updateActiveNav()

    window.addEventListener("scroll", updateNav, { passive: true })
    window.addEventListener("scroll", updateActiveNav, { passive: true })
    ham.addEventListener("click", onHamClick)
    document.addEventListener("click", onDocumentClick)
    form?.addEventListener("submit", onSubmit)

    return () => {
      window.removeEventListener("scroll", updateNav)
      window.removeEventListener("scroll", updateActiveNav)
      document.removeEventListener("click", onDocumentClick)
      ham.removeEventListener("click", onHamClick)
      form?.removeEventListener("submit", onSubmit)
      selectHandlers.forEach(({ select, handler }) => {
        select.removeEventListener("change", handler)
      })
      smoothHandlers.forEach(({ link, handler }) => {
        link.removeEventListener("click", handler)
      })
      fiElements.forEach((element) => observer.unobserve(element))
      observer.disconnect()
      if (servicesResizeHandler) {
        window.removeEventListener("resize", servicesResizeHandler)
      }
      if (servicesScrollHandler) {
        window.removeEventListener("scroll", servicesScrollHandler)
      }
      if (window.closeMenu === closeMenu) {
        delete window.closeMenu
      }
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <div ref={rootRef} dangerouslySetInnerHTML={{ __html: landingHtml }} />
    </>
  )
}

export default App
