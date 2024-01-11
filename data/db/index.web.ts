const dumbRepository = {
  find: async () => {
    return [];
  },
};

export const getRepository = async (account: string, entity: string) => {
  return dumbRepository;
};
