const dumbRepository = {
  find: async () => {
    return [];
  },
  update: async () => {},
  query: async () => {},
};

export const getRepository = async (account: string, entity: string) => {
  return dumbRepository;
};
