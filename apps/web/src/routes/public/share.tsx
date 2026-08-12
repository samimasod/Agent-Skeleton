import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Star, ArrowRight, ExternalLink } from "lucide-react"

export function PublicSharePage() {
  const { slug } = useParams<{ slug: string }>()

  const SAMPLE_ITEMS = [
    {
      id: "item-1",
      title: "AI Customer Support Assistant",
      price: "$149.00",
      category: "AI Tool",
      rating: 4.9,
      description: "Prebuilt support agent configured for automated ticket triaging and multi-channel chat.",
    },
    {
      id: "item-2",
      title: "Multi-Tenant E-Commerce Starter",
      price: "$299.00",
      category: "SaaS Template",
      rating: 4.8,
      description: "Complete unauthenticated public product catalog with guest checkout and tenant data scoping.",
    },
    {
      id: "item-3",
      title: "TOON Token Compressor",
      price: "$79.00",
      category: "Developer Tool",
      rating: 5.0,
      description: "Token-Oriented Object Notation serializer saving 30% to 60% of LLM prompt tokens.",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Public Header */}
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              {slug ? slug.replace("-", " ").toUpperCase() : "Public Storefront"}
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                Tenant Verified
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">Public storefront catalog powered by Skeleton Multi-Tenant Platform.</p>
          </div>
        </div>

        <Link to="/signup">
          <Button size="sm" className="gap-2">
            Sign Up & Get Access <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      {/* Main Catalog View */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Public Products & Services</h2>
          <p className="text-xs text-muted-foreground">
            Browse published modules and tools offered by this organization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_ITEMS.map((item) => (
            <Card key={item.id} className="border border-border/80 bg-card/70 hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-[10px] font-mono">{item.category}</Badge>
                  <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {item.rating}
                  </span>
                </div>
                <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                <CardDescription className="text-xs mt-1.5 leading-relaxed">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between border-t border-border/40 mt-4 pt-4">
                <span className="text-lg font-black text-foreground">{item.price}</span>
                <Link to="/signup">
                  <Button size="sm" variant="outline" className="text-xs gap-1.5">
                    Select & Purchase <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
