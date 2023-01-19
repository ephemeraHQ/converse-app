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
          name: name.toLowerCase(),
        },
      }
    );
    return data.data?.domains?.[0]?.resolvedAddress?.id || undefined;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const resolveENSAddress = async (
  address: string
): Promise<string | undefined> => {
  try {
    const { data } = await axios.post(
      "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
      {
        operationName: "ResolveAddress",
        query:
          "query ResolveAddress($address: String!) {\n  domains(where: {resolvedAddress: $address}) {\n   name\n  }\n}",
        variables: {
          address: address.toLowerCase(),
        },
      }
    );
    return data.data?.domains?.[0]?.name || undefined;
  } catch (e) {
    console.log(e);
  }
  return undefined;
};
