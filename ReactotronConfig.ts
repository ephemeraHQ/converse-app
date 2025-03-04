import Reactotron from "reactotron-react-native"
import { QueryClientManager, reactotronReactQuery } from "reactotron-react-query"
import { queryClient } from "./queries/queryClient"

const queryClientManager = new QueryClientManager({
  queryClient,
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
