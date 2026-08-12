import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className: string
  background: ReactNode
  Icon: React.ElementType
  description: string
  href: string
  cta: string
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[20rem] grid-cols-3 gap-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl p-6",
      "bg-[#161f34]/80 backdrop-blur-xl border border-white/10 shadow-xl",
      "hover:border-[#7fc8ff]/40 transition-all duration-300",
      className
    )}
    {...props}
  >
    {background}

    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#006ddd]/20 border border-[#006ddd]/30 text-[#7fc8ff] mb-4">
        <Icon className="h-6 w-6" />
      </div>

      <div>
        <h3 className="font-display text-xl font-bold text-white mb-2">
          {name}
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed max-w-md">{description}</p>
      </div>

      <div className="mt-6">
        <a
          href={href}
          className="inline-flex items-center text-xs font-mono font-semibold text-[#7fc8ff] hover:text-white transition-colors group-hover:translate-x-1 duration-200"
        >
          {cta} <ArrowRightIcon className="ms-1.5 h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  </div>
)

export { BentoCard, BentoGrid }
