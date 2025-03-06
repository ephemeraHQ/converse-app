import { FlatList, FlatListProps } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Center } from "@/design-system/Center"
import { EmptyState } from "@/design-system/empty-state"
import { Loader } from "@/design-system/loader"

export type ISearchUsersResultsListProps<T> = Omit<FlatListProps<T>, "data"> & {
  data: T[]
  isLoading?: boolean
  searchText?: string
}

export const SearchUsersResultsList = function SearchUsersResultsList<T>(
  props: ISearchUsersResultsListProps<T>,
) {
  const { isLoading, searchText, data, ...flatListProps } = props
  const insets = useSafeAreaInsets()

  return (
    <FlatList
      {...flatListProps}
      data={data}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <Center
          style={{
            paddingBottom: insets.bottom,
            flex: 1,
          }}
        >
          {isLoading ? (
            <Loader size="sm" />
          ) : searchText ? (
            <EmptyState
              description={
                data.length === 0 ? "No results found" : `Couldn't find what you are looking for`
              }
            />
          ) : null}
        </Center>
      }
      contentContainerStyle={[
        {
          paddingBottom: insets.bottom,
          flexGrow: 1,
        },
        props.contentContainerStyle,
      ]}
    />
  )
}
