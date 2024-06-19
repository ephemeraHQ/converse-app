export type EntityObject<T, KeyType extends string = string> = {
  byId: Record<KeyType, T>;
  ids: KeyType[];
};

export function entify<T, KeyType extends string = string>(
  items: T[],
  idFunc: (item: T) => KeyType
): EntityObject<T, KeyType> {
  return items.reduce<EntityObject<T, KeyType>>(
    (acc, item) => {
      const id = idFunc(item);
      acc.ids.push(id);
      acc.byId[id] = item;
      return acc;
    },
    {
      byId: {} as Record<KeyType, T>,
      ids: [],
    }
  );
}

export type EntityObjectWithAddress<T, KeyType extends string = string> = {
  byId: Record<KeyType, T>;
  byAddress: Record<string, KeyType>;
  ids: KeyType[];
};

export function entifyWithAddress<T, KeyType extends string = string>(
  items: T[],
  idFunc: (item: T) => KeyType,
  addressFunc: (item: T) => string
): EntityObjectWithAddress<T, KeyType> {
  return items.reduce<EntityObjectWithAddress<T, KeyType>>(
    (acc, item) => {
      const id = idFunc(item);
      const address = addressFunc(item);
      acc.ids.push(id);
      acc.byId[id] = item;
      acc.byAddress[address] = id;
      return acc;
    },
    {
      byId: {} as Record<KeyType, T>,
      byAddress: {},
      ids: [],
    }
  );
}

export function enitifyPages<T>(
  pages: T[][],
  idFunc: (item: T) => string
): EntityObject<T> {
  return pages.reduce<EntityObject<T>>(
    (acc, page) => {
      const { byId, ids } = entify(page, idFunc);
      acc.ids.push(...ids);
      acc.byId = { ...acc.byId, ...byId };
      return acc;
    },
    {
      byId: {},
      ids: [],
    }
  );
}
