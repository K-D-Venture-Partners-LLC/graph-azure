import {
  LoadBalancer,
  NetworkInterfaceIPConfiguration,
  NetworkSecurityGroup,
  PublicIPAddress,
  Subnet,
} from '@azure/arm-network/esm/models';
import {
  Entity,
  getRawData,
  Relationship,
  Step,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAzureWebLinker } from '../../../azure';
import { IntegrationStepContext, IntegrationConfig } from '../../../types';
import { ACCOUNT_ENTITY_TYPE, STEP_AD_ACCOUNT } from '../../active-directory';
import { NetworkClient } from './client';
import {
  LOAD_BALANCER_BACKEND_NIC_RELATIONSHIP_TYPE,
  LOAD_BALANCER_ENTITY_TYPE,
  NETWORK_INTERFACE_ENTITY_TYPE,
  PUBLIC_IP_ADDRESS_ENTITY_TYPE,
  SECURITY_GROUP_ENTITY_TYPE,
  SECURITY_GROUP_NIC_RELATIONSHIP_TYPE,
  SECURITY_GROUP_RULE_RELATIONSHIP_TYPE,
  SECURITY_GROUP_SUBNET_RELATIONSHIP_TYPE,
  STEP_RM_NETWORK_INTERFACES,
  STEP_RM_NETWORK_LOAD_BALANCERS,
  STEP_RM_NETWORK_PUBLIC_IP_ADDRESSES,
  STEP_RM_NETWORK_SECURITY_GROUP_RULE_RELATIONSHIPS,
  STEP_RM_NETWORK_SECURITY_GROUPS,
  STEP_RM_NETWORK_VIRTUAL_NETWORKS,
  SUBNET_ENTITY_CLASS,
  SUBNET_ENTITY_TYPE,
  VIRTUAL_NETWORK_ENTITY_TYPE,
  VIRTUAL_NETWORK_SUBNET_RELATIONSHIP_TYPE,
  PUBLIC_IP_ADDRESS_ENTITY_CLASS,
  NETWORK_INTERFACE_ENTITY_CLASS,
  VIRTUAL_NETWORK_ENTITY_CLASS,
  VIRTUAL_NETWORK_SUBNET_RELATIONSHIP_CLASS,
  SECURITY_GROUP_SUBNET_RELATIONSHIP_CLASS,
  SECURITY_GROUP_ENTITY_CLASS,
  SECURITY_GROUP_NIC_RELATIONSHIP_CLASS,
  LOAD_BALANCER_ENTITY_CLASS,
  LOAD_BALANCER_BACKEND_NIC_RELATIONSHIP_CLASS,
} from './constants';
import {
  createLoadBalancerBackendNicRelationship,
  createLoadBalancerEntity,
  createNetworkInterfaceEntity,
  createNetworkSecurityGroupEntity,
  createNetworkSecurityGroupNicRelationship,
  createNetworkSecurityGroupSubnetRelationship,
  createPublicIPAddressEntity,
  createSecurityGroupRuleMappedRelationship,
  createSecurityGroupRuleSubnetRelationship,
  createSubnetEntity,
  createVirtualNetworkEntity,
  createVirtualNetworkSubnetRelationship,
  processSecurityGroupRules,
} from './converters';

export * from './constants';

type SubnetSecurityGroupMap = {
  [subnetId: string]: NetworkSecurityGroup;
};

export async function fetchNetworkInterfaces(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const client = new NetworkClient(instance.config, logger);

  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);
  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);

  const publicIpAddresses = await jobState.getData<PublicIPAddress[]>(
    'publicIPAddresses',
  );

  const findPublicIPAddresses = (
    ipConfigs: NetworkInterfaceIPConfiguration[] | undefined,
  ): string[] | undefined => {
    if (ipConfigs) {
      const addressesForNIC: string[] = [];
      for (const ipConfig of ipConfigs) {
        const ipAddress = publicIpAddresses.find(
          (i) =>
            i.id === (ipConfig.publicIPAddress && ipConfig.publicIPAddress.id),
        );
        if (ipAddress && ipAddress.ipAddress) {
          addressesForNIC.push(ipAddress.ipAddress);
        }
      }
      return addressesForNIC;
    }
  };

  await client.iterateNetworkInterfaces(async (e) => {
    await jobState.addEntity(
      createNetworkInterfaceEntity(
        webLinker,
        e,
        findPublicIPAddresses(e.ipConfigurations),
      ),
    );
  });
}

export async function fetchPublicIPAddresses(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const client = new NetworkClient(instance.config, logger);

  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);
  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);

  const publicIpAddresses: PublicIPAddress[] = [];
  await client.iteratePublicIPAddresses(async (e) => {
    publicIpAddresses.push(e);
    await jobState.addEntity(createPublicIPAddressEntity(webLinker, e));
  });

  // A simple way to make the set available to dependent steps. Assumes dataset
  // is relatively small. Ideally, we could easily find the stored entity by any
  // property.
  await jobState.setData('publicIPAddresses', publicIpAddresses);
}

export async function fetchLoadBalancers(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const client = new NetworkClient(instance.config, logger);

  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);
  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);

  // A load balancer with multiple ip addresses through a single nic should not
  // produce more than one lb -> nic relationship.
  const loadBalancerNicRelationshipKeys = new Set<string>();

  const createLoadBalancerBackendNicRelationships = (
    lb: LoadBalancer,
  ): Relationship[] | undefined => {
    if (lb.backendAddressPools) {
      const relationships: Relationship[] = [];
      lb.backendAddressPools.forEach((backend) => {
        if (backend.backendIPConfigurations) {
          backend.backendIPConfigurations.forEach((ip) => {
            if (ip.id) {
              /**
               * Need to remove the extra `/ipConfigurations/*` path from the nicId,
               * so that they can be mapped to the `_key` on the `azure_nic` entity.
               * For example:
               * "id": "/subscriptions/<uuid>/resourceGroups/xtest/providers/Microsoft.Network/networkInterfaces/j1234/ipConfigurations/ipconfig1",
               */
              const nicId = ip.id.split('/ipConfigurations')[0];
              const loadBalancerNicRelationship = createLoadBalancerBackendNicRelationship(
                lb,
                nicId,
              );
              if (
                !loadBalancerNicRelationshipKeys.has(
                  loadBalancerNicRelationship._key,
                )
              ) {
                relationships.push(loadBalancerNicRelationship);
                loadBalancerNicRelationshipKeys.add(
                  loadBalancerNicRelationship._key,
                );
              }
            }
          });
        }
      });
      return relationships;
    }
  };

  await client.iterateLoadBalancers(async (e) => {
    await jobState.addEntity(createLoadBalancerEntity(webLinker, e));
    const nicRelationships = createLoadBalancerBackendNicRelationships(e);
    if (nicRelationships) {
      await jobState.addRelationships(nicRelationships);
    }
  });
}

export async function fetchNetworkSecurityGroups(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const client = new NetworkClient(instance.config, logger);

  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);
  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);

  const subnetSecurityGroupMap: SubnetSecurityGroupMap = {};

  await client.iterateNetworkSecurityGroups(async (sg) => {
    const sgEntity = createNetworkSecurityGroupEntity(webLinker, sg);
    await jobState.addEntity(sgEntity);

    if (sg.networkInterfaces) {
      await jobState.addRelationships(
        sg.networkInterfaces.map((i) =>
          createNetworkSecurityGroupNicRelationship(sg, i),
        ),
      );
    }

    if (sg.subnets) {
      for (const s of sg.subnets) {
        subnetSecurityGroupMap[s.id as string] = sg;
      }
    }
  });

  await jobState.setData('subnetSecurityGroupMap', subnetSecurityGroupMap);
}

export async function fetchVirtualNetworks(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const client = new NetworkClient(instance.config, logger);

  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);
  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);

  const subnetSecurityGroupMap = await jobState.getData<SubnetSecurityGroupMap>(
    'subnetSecurityGroupMap',
  );

  await client.iterateVirtualNetworks(async (vnet) => {
    if (vnet.subnets) {
      const subnetEntities: Entity[] = [];
      const subnetRelationships: Relationship[] = [];
      for (const subnet of vnet.subnets) {
        const subnetEntity = createSubnetEntity(webLinker, vnet, subnet);
        subnetEntities.push(subnetEntity);
        subnetRelationships.push(
          createVirtualNetworkSubnetRelationship(vnet, subnet),
        );
        const sg = subnetSecurityGroupMap[subnet.id as string];
        if (sg) {
          subnetRelationships.push(
            createNetworkSecurityGroupSubnetRelationship(sg, subnet),
          );
        }
      }
      await jobState.addEntities(subnetEntities);
      await jobState.addRelationships(subnetRelationships);
    }
    await jobState.addEntity(createVirtualNetworkEntity(webLinker, vnet));
  });
}

export async function buildSecurityGroupRuleRelationships(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { jobState, logger } = executionContext;

  const findSubnetsForCIDR = async (cidr?: string) => {
    if (!cidr) return null;

    const subnets: Subnet[] = [];

    await jobState.iterateEntities(
      { _type: SUBNET_ENTITY_TYPE },
      (subnetEntity) => {
        const subnet = getRawData(subnetEntity) as Subnet;
        if (subnet.addressPrefix === cidr) {
          subnets.push(subnet);
        }
      },
    );

    return subnets;
  };

  await jobState.iterateEntities(
    { _type: SECURITY_GROUP_ENTITY_TYPE },
    async (sgEntity) => {
      const sg = getRawData(sgEntity) as NetworkSecurityGroup;

      const rules = processSecurityGroupRules(sg);
      for (const rule of rules) {
        for (const target of rule.targets) {
          if (
            target._class === SUBNET_ENTITY_CLASS &&
            target._type === SUBNET_ENTITY_TYPE
          ) {
            const subnets = await findSubnetsForCIDR(target.CIDR as string);
            if (subnets?.length) {
              for (const subnet of subnets) {
                await jobState.addRelationship(
                  createSecurityGroupRuleSubnetRelationship(sg, rule, subnet),
                );
              }
            } else {
              logger.warn(
                { securityGroup: sg.id, rule: rule.id, cidr: target.CIDR },
                'Rule target thought to be a private subnet, none found matching CIDR!',
              );
            }
          } else {
            await jobState.addRelationship(
              createSecurityGroupRuleMappedRelationship(sg, rule, target),
            );
          }
        }
      }
    },
  );
}

export const networkSteps: Step<
  IntegrationStepExecutionContext<IntegrationConfig>
>[] = [
  {
    id: STEP_RM_NETWORK_PUBLIC_IP_ADDRESSES,
    name: 'Public IP Addresses',
    entities: [
      {
        resourceName: '[RM] Public IP Address',
        _type: PUBLIC_IP_ADDRESS_ENTITY_TYPE,
        _class: PUBLIC_IP_ADDRESS_ENTITY_CLASS,
      },
    ],
    relationships: [],
    dependsOn: [STEP_AD_ACCOUNT],
    executionHandler: fetchPublicIPAddresses,
  },
  {
    id: STEP_RM_NETWORK_INTERFACES,
    name: 'Network Interfaces',
    entities: [
      {
        resourceName: '[RM] Network Interface',
        _type: NETWORK_INTERFACE_ENTITY_TYPE,
        _class: NETWORK_INTERFACE_ENTITY_CLASS,
      },
    ],
    relationships: [],
    dependsOn: [STEP_AD_ACCOUNT, STEP_RM_NETWORK_PUBLIC_IP_ADDRESSES],
    executionHandler: fetchNetworkInterfaces,
  },
  {
    id: STEP_RM_NETWORK_VIRTUAL_NETWORKS,
    name: 'Virtual Networks',
    entities: [
      {
        resourceName: '[RM] Virtual Network',
        _type: VIRTUAL_NETWORK_ENTITY_TYPE,
        _class: VIRTUAL_NETWORK_ENTITY_CLASS,
      },
      {
        resourceName: '[RM] Subnet',
        _type: SUBNET_ENTITY_TYPE,
        _class: SUBNET_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: VIRTUAL_NETWORK_SUBNET_RELATIONSHIP_TYPE,
        sourceType: VIRTUAL_NETWORK_ENTITY_TYPE,
        _class: VIRTUAL_NETWORK_SUBNET_RELATIONSHIP_CLASS,
        targetType: SUBNET_ENTITY_TYPE,
      },
      {
        _type: SECURITY_GROUP_SUBNET_RELATIONSHIP_TYPE,
        sourceType: SECURITY_GROUP_ENTITY_TYPE,
        _class: SECURITY_GROUP_SUBNET_RELATIONSHIP_CLASS,
        targetType: SUBNET_ENTITY_TYPE,
      },
    ],
    dependsOn: [STEP_AD_ACCOUNT, STEP_RM_NETWORK_SECURITY_GROUPS],
    executionHandler: fetchVirtualNetworks,
  },
  {
    id: STEP_RM_NETWORK_SECURITY_GROUPS,
    name: 'Network Security Groups',
    entities: [
      {
        resourceName: '[RM] Security Group',
        _type: SECURITY_GROUP_ENTITY_TYPE,
        _class: SECURITY_GROUP_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: SECURITY_GROUP_NIC_RELATIONSHIP_TYPE,
        sourceType: SECURITY_GROUP_ENTITY_TYPE,
        _class: SECURITY_GROUP_NIC_RELATIONSHIP_CLASS,
        targetType: NETWORK_INTERFACE_ENTITY_TYPE,
      },
    ],
    // SECURITY_GROUP_RULE_RELATIONSHIP_TYPE doesn't seem to exist here.
    dependsOn: [STEP_AD_ACCOUNT, STEP_RM_NETWORK_INTERFACES],
    executionHandler: fetchNetworkSecurityGroups,
  },
  {
    id: STEP_RM_NETWORK_LOAD_BALANCERS,
    name: 'Load Balancers',
    entities: [
      {
        resourceName: '[RM] Load Balancer',
        _type: LOAD_BALANCER_ENTITY_TYPE,
        _class: LOAD_BALANCER_ENTITY_CLASS,
      },
    ],
    relationships: [
      {
        _type: LOAD_BALANCER_BACKEND_NIC_RELATIONSHIP_TYPE,
        sourceType: LOAD_BALANCER_ENTITY_TYPE,
        _class: LOAD_BALANCER_BACKEND_NIC_RELATIONSHIP_CLASS,
        targetType: NETWORK_INTERFACE_ENTITY_TYPE,
      },
    ],
    dependsOn: [STEP_AD_ACCOUNT],
    executionHandler: fetchLoadBalancers,
  },
  {
    id: STEP_RM_NETWORK_SECURITY_GROUP_RULE_RELATIONSHIPS,
    name: 'Network Security Group Rules',
    entities: [],
    relationships: [
      {
        _type: SECURITY_GROUP_RULE_RELATIONSHIP_TYPE,
        sourceType: SECURITY_GROUP_ENTITY_TYPE,
        _class: RelationshipClass.ALLOWS,
        targetType: SUBNET_ENTITY_TYPE,
      },
      {
        _type: SECURITY_GROUP_RULE_RELATIONSHIP_TYPE,
        sourceType: SUBNET_ENTITY_TYPE,
        _class: RelationshipClass.ALLOWS,
        targetType: SECURITY_GROUP_ENTITY_TYPE,
      },
      {
        _type: SECURITY_GROUP_RULE_RELATIONSHIP_TYPE,
        sourceType: SECURITY_GROUP_ENTITY_TYPE,
        _class: RelationshipClass.DENIES,
        targetType: SUBNET_ENTITY_TYPE,
      },
      {
        _type: SECURITY_GROUP_RULE_RELATIONSHIP_TYPE,
        sourceType: SUBNET_ENTITY_TYPE,
        _class: RelationshipClass.DENIES,
        targetType: SECURITY_GROUP_ENTITY_TYPE,
      },
    ],
    dependsOn: [
      STEP_AD_ACCOUNT,
      STEP_RM_NETWORK_SECURITY_GROUPS,
      STEP_RM_NETWORK_VIRTUAL_NETWORKS,
    ],
    executionHandler: buildSecurityGroupRuleRelationships,
  },
];
