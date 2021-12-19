import { Contract } from "@ethersproject/contracts";

export const getEventArgument = async (
  contract: Contract,
  txHash: string,
  eventName: string,
  eventArg?: string
): Promise<any> => {
  const filterFn = contract.filters[eventName];

  if (!filterFn) {
    throw new Error(`Event ${eventName} not found in contract`);
  }

  const filter = filterFn();
  const events = await contract.queryFilter(filter);
  // Filter both by tx hash and event signature hash
  const [event] = events.filter(
    (event) =>
      event.transactionHash === txHash && event.topics[0] === filter.topics[0]
  );

  if (eventArg) {
    const argValue = event.args[eventArg];

    if (!argValue) {
      throw new Error(`Argument ${eventArg} not found in event ${eventName}`);
    }

    return argValue;
  } else {
    return event.args;
  }
};
