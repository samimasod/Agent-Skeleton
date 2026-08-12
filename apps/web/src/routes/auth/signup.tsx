import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signupWithEmail, loginWithGoogle } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Lock, Mail, Loader2, UserPlus } from "lucide-react"

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type SignupFormData = z.infer<typeof signupSchema>

export function SignupPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    try {
      await signupWithEmail(data.email, data.password)
      toast({
        title: "Account created",
        description: "Welcome to Skeleton.",
      })
      navigate("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Could not create account",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "Could not sign up with Google",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="text-center space-y-2 border-b border-border/40 pb-6">
        <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">Create Skeleton Account</CardTitle>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Build your organization workspace, configure AI agents, and start orchestrating workflows.
        </p>
      </CardHeader>

      <CardContent className="pt-6 space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="border-border/80 bg-background/80 focus:border-primary text-foreground placeholder:text-muted-foreground/60 h-10"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              className="border-border/80 bg-background/80 focus:border-primary text-foreground placeholder:text-muted-foreground/60 h-10"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" /> Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="border-border/80 bg-background/80 focus:border-primary text-foreground placeholder:text-muted-foreground/60 h-10"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full py-2.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-wider">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-10 border-border/80 hover:bg-muted/60 text-foreground font-medium gap-2"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/40 py-4 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
