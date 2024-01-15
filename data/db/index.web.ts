const dumbRepository = {
  find: async () => {
    return [];
  },
  update: async () => {},
  query: async () => {},
  findOneBy: async () => {
    return {};
  },
};

export const getRepository = async (account: string, entity: string) => {
  return dumbRepository;
};
