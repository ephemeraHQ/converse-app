import { memo } from "react"
import { AuthContactCard } from "@/features/authentication/components/auth-contact-card"
import { AuthWelcomeContent } from "@/features/authentication/components/auth-welcome-content"
import {
  AuthContextProvider,
  useAuthContext,
} from "@/features/authentication/contexts/auth-context"

export const AuthScreen = memo(function AuthScreen() {
  return (
    <AuthContextProvider>
      <Content />
    </AuthContextProvider>
  )
})

export const Content = memo(function Content() {
  const { user } = useAuthContext()

  if (!user) {
    return <AuthWelcomeContent />
  }

  return <AuthContactCard />
})
