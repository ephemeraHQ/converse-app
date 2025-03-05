import { memo } from "react"
import { IListItemProps, ListItem } from "@/components/list-item"
import { useAppTheme } from "@/theme/use-app-theme"

export const GroupDetailsListItem = memo(function GroupDetailsListItem(props: IListItemProps) {
  const { theme } = useAppTheme()
  const { style, ...rest } = props
  return (
    <ListItem
      style={[
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.xs,
        },
        style,
      ]}
      {...rest}
    />
  )
})
