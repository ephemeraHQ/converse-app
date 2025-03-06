import { memo } from "react"
import { IListItemProps, ListItem } from "@/design-system/list-item"
import { useAppTheme } from "@/theme/use-app-theme"

export const GroupDetailsListItem = memo(function GroupDetailsListItem(props: IListItemProps) {
  const { style, ...rest } = props

  const { theme } = useAppTheme()

  return <ListItem style={[{}, style]} {...rest} />
})
