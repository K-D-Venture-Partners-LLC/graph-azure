import map from "lodash.map";

import { VirtualMachine } from "@azure/arm-compute/esm/models";
import { NetworkInterface } from "@azure/arm-network/esm/models";
import {
  Entity,
  getRawData,
  JobState,
  Relationship,
} from "@jupiterone/integration-sdk";

import {
  NETWORK_INTERFACE_ENTITY_TYPE,
  VIRTUAL_MACHINE_ENTITY_TYPE,
} from "../../../jupiterone";
import { IntegrationStepContext } from "../../../types";
import {
  createSubnetVirtualMachineRelationship,
  createVirtualMachineNetworkInterfaceRelationship,
  createVirtualMachinePublicIPAddressRelationship,
} from "./converters";

export async function buildComputeNetworkRelationships(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { jobState } = executionContext;

  const networkInterfaces: NetworkInterface[] = loadNetworkInterfaces(jobState);
  const relationships: Relationship[] = [];

  await jobState.iterateEntities(
    { _type: VIRTUAL_MACHINE_ENTITY_TYPE },
    (vmEntity: Entity) => {
      const vmData = getRawData<VirtualMachine>(vmEntity);
      if (!vmData) {
        throw new Error(
          "Iterating virtual machine entities, raw data is missing!",
        );
      }

      const nicData = findVirtualMachineNetworkInterfaces(
        vmData,
        networkInterfaces,
      );
      for (const nic of nicData) {
        relationships.push(
          createVirtualMachineNetworkInterfaceRelationship(vmData, nic),
        );
        for (const c of nic.ipConfigurations || []) {
          if (c.subnet) {
            relationships.push(
              createSubnetVirtualMachineRelationship(c.subnet, vmData),
            );
          }
          if (c.publicIPAddress) {
            relationships.push(
              createVirtualMachinePublicIPAddressRelationship(
                vmData,
                c.publicIPAddress,
              ),
            );
          }
        }
      }
    },
  );
}

function loadNetworkInterfaces(jobState: JobState): NetworkInterface[] {
  const networkInterfaces: NetworkInterface[] = [];
  jobState.iterateEntities({ _type: NETWORK_INTERFACE_ENTITY_TYPE }, (nic) => {
    networkInterfaces.push(nic);
  });
  return networkInterfaces;
}

function findVirtualMachineNetworkInterfaces(
  vm: VirtualMachine,
  nics: NetworkInterface[],
): NetworkInterface[] {
  const vmNics: NetworkInterface[] = [];
  if (vm.networkProfile) {
    map(vm.networkProfile.networkInterfaces, (n) =>
      nics.find((e) => e.id === n.id),
    ).forEach((e) => e && vmNics.push(e));
  }
  return vmNics;
}