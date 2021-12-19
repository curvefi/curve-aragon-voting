import { Kernel } from "../../typechain";
import { getEventArgument } from "./events";

export const installNewApp = async (
  dao: Kernel,
  appId: string,
  baseAppAddress: string
): Promise<string> => {
  const receipt = await dao["newAppInstance(bytes32,address,bytes,bool)"](
    appId,
    baseAppAddress,
    "0x",
    false
  );
  const proxyAddress = await getEventArgument(
    dao,
    receipt.hash,
    "NewAppProxy",
    "proxy"
  );

  return proxyAddress;
};
