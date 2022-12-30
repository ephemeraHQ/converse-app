import axios from "axios";

export const getLensHandle = async (
  address: string
): Promise<string | undefined> => {
  try {
    const { data } = await axios.post("https://api.lens.dev/", {
      operationName: "DefaultProfile",
      query:
        "query DefaultProfile($address: EthereumAddress!) {\n  defaultProfile(request: {ethereumAddress: $address}) {\n    handle\n  }\n}\n",
      variables: {
        address,
      },
    });
    return data.data?.defaultProfile?.handle || undefined;
  } catch (e: any) {
    console.log(e?.response);
  }
  return undefined;
};

export const getLensOwner = async (
  handle: string
): Promise<string | undefined> => {
  try {
    const { data } = await axios.post("https://api.lens.dev/", {
      operationName: "Profile",
      query:
        "query Profile($handle: Handle) {\n  profile(request: {handle: $handle}) {\n    ownedBy\n  }\n}\n",
      variables: {
        handle,
      },
    });
    return data.data?.profile?.ownedBy || undefined;
  } catch (e: any) {
    console.log(e?.response);
  }
  return undefined;
};
