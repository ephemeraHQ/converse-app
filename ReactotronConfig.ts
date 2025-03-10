import Reactotron from "reactotron-react-native"
import { QueryClientManager, reactotronReactQuery } from "reactotron-react-query"
import { reactQueryClient } from "./utils/react-query/react-query.client"

const queryClientManager = new QueryClientManager({
  queryClient: reactQueryClient,
})

// eslint-disable-next-line react-hooks/rules-of-hooks
Reactotron.use(reactotronReactQuery(queryClientManager))
  .configure({
    onDisconnect: () => {
      queryClientManager.unsubscribe()
    },
  })
  .useReactNative()
  .connect()
