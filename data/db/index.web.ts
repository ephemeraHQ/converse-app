const dumbRepository = {
  find: async () => {
    return [];
  },
  update: async () => {},
  query: async () => {},
  findOneBy: async () => {
    return {};
  },
  delete: async () => {},
};

export const getRepository = async (account: string, entity: string) => {
  return dumbRepository;
};

export const clearConverseDb = async (account: string) => {};

export const initDb = async (account: string): Promise<void> => {};
