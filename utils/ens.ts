import axios from "axios";

export const resolveENSName = async (
  name: string
): Promise<string | undefined> => {
  try {
    const { data } = await axios.post(
      "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
      {
        operationName: "ResolveName",
        query:
          "query ResolveName($name: String!) {\n  domains(where: {name: $name}) {\n    resolvedAddress {\n      id\n    }\n  }\n}",
        variables: {
          name,
        },
      }
    );
    return data.data?.domains?.[0]?.resolvedAddress?.id || undefined;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};
