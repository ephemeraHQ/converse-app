/**
 * Represents an object with items indexed by their ids.
 *
 * @template T The type of items in the object
 * @template KeyType The type of ids (default: string)
 */
export type EntityObject<T, KeyType extends string = string> = {
  byId: Record<KeyType, T>
  ids: KeyType[]
}

/**
 * Transforms an array of items into an EntityObject.
 *
 * @param items - Array of items to be transformed
 * @param idFunc - Function to extract the id from an item
 * @returns EntityObject with items indexed by their ids
 *
 * @example
 * const users = [
 *   { id: 'user1', name: 'Alice' },
 *   { id: 'user2', name: 'Bob' }
 * ];
 * const userEntity = entify(users, user => user.id);
 * // Result:
 * // {
 * //   byId: {
 * //     user1: { id: 'user1', name: 'Alice' },
 * //     user2: { id: 'user2', name: 'Bob' }
 * //   },
 * //   ids: ['user1', 'user2']
 * // }
 */
export function entify<T, KeyType extends string = string>(
  items: T[],
  idFunc: (item: T) => KeyType,
): EntityObject<T, KeyType> {
  return items.reduce<EntityObject<T, KeyType>>(
    (acc, item) => {
      const id = idFunc(item)
      acc.ids.push(id)
      acc.byId[id] = item
      return acc
    },
    {
      byId: {} as Record<KeyType, T>,
      ids: [],
    },
  )
}

/**
 * Represents an EntityObject with an additional byAddress index.
 */
export type EntityObjectWithAddress<T, KeyType extends string = string> = {
  byId: Record<KeyType, T>
  byAddress: Record<string, KeyType>
  ids: KeyType[]
  addresses: string[]
}

/**
 * Transforms an array of items into an EntityObjectWithAddress.
 *
 * @param items - Array of items to be transformed
 * @param idFunc - Function to extract the id from an item
 * @param addressFunc - Function to extract the address from an item
 * @returns EntityObjectWithAddress with items indexed by ids and addresses
 *
 * @example
 * const users = [
 *   { id: 'user1', name: 'Alice', address: '0xD3ADB33F' },
 *   { id: 'user2', name: 'Bob', address: '0xC0FFEE42' }
 * ];
 * const userEntity = entifyWithAddress(
 *   users,
 *   user => user.id,
 *   user => user.address
 * );
 * // Result:
 * // {
 * //   byId: {
 * //     user1: { id: 'user1', name: 'Alice', address: '0xD3ADB33F' },
 * //     user2: { id: 'user2', name: 'Bob', address: '0xC0FFEE42' }
 * //   },
 * //   byAddress: {
 * //     '0xD3ADB33F': 'user1',
 * //     '0xC0FFEE42': 'user2'
 * //   },
 * //   ids: ['user1', 'user2']
 * // }
 */
export function entifyWithAddress<T, KeyType extends string = string>(
  items: T[],
  idFunc: (item: T) => KeyType,
  addressFunc: (item: T) => string,
): EntityObjectWithAddress<T, KeyType> {
  return items.reduce<EntityObjectWithAddress<T, KeyType>>(
    (acc, item) => {
      const id = idFunc(item)
      const address = addressFunc(item)
      acc.ids.push(id)
      acc.addresses.push(address)
      acc.byId[id] = item
      acc.byAddress[address] = id
      return acc
    },
    {
      byId: {} as Record<KeyType, T>,
      byAddress: {},
      ids: [],
      addresses: [],
    },
  )
}

/**
 * Transforms an array of pages (arrays) of items into a single EntityObject.
 *
 * @param pages - Array of arrays of items to be transformed
 * @param idFunc - Function to extract the id from an item
 * @returns EntityObject with all items from all pages indexed by their ids
 *
 * @example
 * const page1 = [{ id: 'user1', name: 'Alice', address: '0xBEEF1234' }];
 * const page2 = [{ id: 'user2', name: 'Bob', address: '0xFACE5678' }];
 * const userEntity = enitifyPages([page1, page2], user => user.id);
 * // Result:
 * // {
 * //   byId: {
 * //     user1: { id: 'user1', name: 'Alice', address: '0xBEEF1234' },
 * //     user2: { id: 'user2', name: 'Bob', address: '0xFACE5678' }
 * //   },
 * //   ids: ['user1', 'user2']
 * // }
 */
export function enitifyPages<T>(pages: T[][], idFunc: (item: T) => string): EntityObject<T> {
  return pages.reduce<EntityObject<T>>(
    (acc, page) => {
      const { byId, ids } = entify(page, idFunc)
      acc.ids.push(...ids)
      acc.byId = { ...acc.byId, ...byId }
      return acc
    },
    {
      byId: {},
      ids: [],
    },
  )
}
