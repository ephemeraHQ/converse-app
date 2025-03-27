import { useAppTheme } from "@/theme/use-app-theme"

export const useProfileContactCardStyles = () => {
  const { theme } = useAppTheme()

  return {
    container: {
      margin: theme.spacing.md, // Not best practice to add margin but since we have shadow, we need it
    },
  }
}
