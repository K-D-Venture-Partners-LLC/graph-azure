import {
  createDirectRelationship,
  Entity,
  RelationshipClass,
  Step,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAzureWebLinker } from '../../../azure';
import { IntegrationStepContext, IntegrationConfig } from '../../../types';
import {
  ACCOUNT_ENTITY_TYPE,
  STEP_AD_ACCOUNT,
} from '../../active-directory/constants';
import { KeyVaultClient } from './client';
import {
  ACCOUNT_KEY_VAULT_RELATIONSHIP_TYPE,
  KEY_VAULT_SERVICE_ENTITY_TYPE,
  STEP_RM_KEYVAULT_VAULTS,
  KEY_VAULT_SERVICE_ENTITY_CLASS,
  ACCOUNT_KEY_VAULT_RELATIONSHIP_CLASS,
} from './constants';
import { createKeyVaultEntity } from './converters';
import { STEP_RM_RESOURCES_RESOURCE_GROUPS } from '../resources/constants';
import createResourceGroupResourceRelationship, {
  createResourceGroupResourceRelationshipMetadata,
} from '../utils/createResourceGroupResourceRelationship';
import {
  createDiagnosticSettingsEntitiesAndRelationshipsForResource,
  diagnosticSettingsEntitiesForResource,
  diagnosticSettingsRelationshipsForResource,
} from '../utils/createDiagnosticSettingsEntitiesAndRelationshipsForResource';

export * from './constants';

export async function fetchKeyVaults(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);

  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);
  const client = new KeyVaultClient(instance.config, logger);

  await client.iterateKeyVaults(async (vault) => {
    const vaultEntity = createKeyVaultEntity(webLinker, vault);
    await jobState.addEntity(vaultEntity);
    await createResourceGroupResourceRelationship(
      executionContext,
      vaultEntity,
    );
    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: vaultEntity,
      }),
    );

    await createDiagnosticSettingsEntitiesAndRelationshipsForResource(
      executionContext,
      vaultEntity,
    );
  });
}

export const keyvaultSteps: Step<
  IntegrationStepExecutionContext<IntegrationConfig>
>[] = [
  {
    id: STEP_RM_KEYVAULT_VAULTS,
    name: 'Key Vaults',
    entities: [
      {
        resourceName: '[RM] Key Vault',
        _type: KEY_VAULT_SERVICE_ENTITY_TYPE,
        _class: KEY_VAULT_SERVICE_ENTITY_CLASS,
      },
      ...diagnosticSettingsEntitiesForResource,
    ],
    relationships: [
      {
        _type: ACCOUNT_KEY_VAULT_RELATIONSHIP_TYPE,
        sourceType: ACCOUNT_ENTITY_TYPE,
        _class: ACCOUNT_KEY_VAULT_RELATIONSHIP_CLASS,
        targetType: KEY_VAULT_SERVICE_ENTITY_TYPE,
      },
      createResourceGroupResourceRelationshipMetadata(
        KEY_VAULT_SERVICE_ENTITY_TYPE,
      ),
      ...diagnosticSettingsRelationshipsForResource,
    ],
    dependsOn: [STEP_AD_ACCOUNT, STEP_RM_RESOURCES_RESOURCE_GROUPS],
    executionHandler: fetchKeyVaults,
  },
];
