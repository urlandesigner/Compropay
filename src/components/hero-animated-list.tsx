import { Building2, CreditCard, Store, Wallet } from "lucide-react"

import { AnimatedList } from "@/components/shadcn-space/animated-list/animated-list-01"
import { cn } from "@/lib/utils"

const heroItems = [
  {
    icon: Wallet,
    title: "Ticket alimentação disponível",
    subtitle: "Saldo liberado para uso no app hoje",
    tone: "is-violet",
  },
  {
    icon: CreditCard,
    title: "Benefício creditado",
    subtitle: "Vale-refeição recebido na carteira digital",
    tone: "is-orange",
  },
  {
    icon: Building2,
    title: "Empresa ativa",
    subtitle: "Gestão centralizada para colaboradores",
    tone: "is-violet",
  },
  {
    icon: Store,
    title: "Pagamento aprovado",
    subtitle: "Compra concluída na rede credenciada",
    tone: "is-green",
  },
] as const

function HeroAnimatedListCard({
  icon: Icon,
  title,
  subtitle,
  tone,
}: (typeof heroItems)[number]) {
  return (
    <div className="hero-animated-list-card">
      <div className={cn("hero-animated-list-icon", tone)}>
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="hero-animated-list-copy">
        <p>{title}</p>
        <span>{subtitle}</span>
      </div>
    </div>
  )
}

export default function HeroAnimatedList() {
  return (
    <div className="hero-animated-list-shell fi v" aria-label="Atualizações da plataforma ComproPay">
      <AnimatedList delay={900} className="hero-animated-list">
        {heroItems.map((item) => (
          <HeroAnimatedListCard key={item.title} {...item} />
        ))}
      </AnimatedList>
      <div className="hero-animated-list-fade" aria-hidden="true" />
    </div>
  )
}
