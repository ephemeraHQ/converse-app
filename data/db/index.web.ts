const dumbRepository = {
  find: async () => {
    return [];
  },
  update: async () => {},
};

export const getRepository = async (account: string, entity: string) => {
  return dumbRepository;
};
