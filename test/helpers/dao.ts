import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { ACL, DAOFactory, Kernel } from "../../typechain";
import { getEventArgument } from "./events";

export const newDaoFactory = async (): Promise<DAOFactory> => {
  const Kernel = await ethers.getContractFactory("Kernel");
  const ACL = await ethers.getContractFactory("ACL");
  const EVMScriptRegistryFactory = await ethers.getContractFactory(
    "EVMScriptRegistryFactory"
  );
  const DAOFactory = await ethers.getContractFactory("DAOFactory");

  const kernelBase = await Kernel.deploy(true);
  const aclBase = await ACL.deploy();
  const registryFactory = await EVMScriptRegistryFactory.deploy();

  return (await DAOFactory.deploy(
    kernelBase.address,
    aclBase.address,
    registryFactory.address
  )) as DAOFactory;
};

export const newDao = async (
  root: SignerWithAddress
): Promise<[Kernel, ACL]> => {
  const daoFactory = await newDaoFactory();
  const rootAddress = await root.getAddress();

  const daoReceipt = await (await daoFactory.newDAO(rootAddress)).wait();
  const daoAddress = await getEventArgument(
    daoFactory,
    daoReceipt.transactionHash,
    "DeployDAO",
    "dao"
  );

  const kernel = (await ethers.getContractAt(
    "Kernel",
    daoAddress,
    root
  )) as Kernel;
  const APP_MANAGER_ROLE = await kernel.APP_MANAGER_ROLE();
  const acl = (await ethers.getContractAt("ACL", await kernel.acl())) as ACL;

  // Grant the root account permission to install apps in the DAO
  await acl.createPermission(
    rootAddress,
    kernel.address,
    APP_MANAGER_ROLE,
    rootAddress
  );

  return [kernel, acl];
};
