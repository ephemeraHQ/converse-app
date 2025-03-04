const init = jest.fn()
const captureException = jest.fn()
const captureMessage = jest.fn()
const addBreadcrumb = jest.fn()
const withScope = jest.fn()

const MockedSentry = {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  withScope,
}

export { init, captureException, captureMessage, addBreadcrumb, withScope }

export default MockedSentry
