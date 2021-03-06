import {
  Entity,
  Step,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';
import { createAzureWebLinker } from '../../../azure';
import { IntegrationStepContext, IntegrationConfig } from '../../../types';
import { ACCOUNT_ENTITY_TYPE } from '../../active-directory/constants';
import { STEP_RM_STORAGE_RESOURCES } from '../storage/constants';
import { STEP_RM_SUBSCRIPTIONS } from '../subscriptions/constants';
import { MonitorClient } from './client';
import {
  MonitorSteps,
  MonitorEntities,
  MonitorRelationships,
} from './constants';
import { createMonitorLogProfileEntity } from './converters';

export async function fetchLogProfiles(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);
  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);
  const client = new MonitorClient(instance.config, logger);

  await client.iterateLogProfiles(async (logProfile) => {
    if (!logProfile) return;

    const logProfileEntity = await jobState.addEntity(
      createMonitorLogProfileEntity(webLinker, logProfile),
    );

    const subscriptionId = `/subscriptions/${instance.config.subscriptionId}`;
    const subscriptionEntity = await jobState.findEntity(subscriptionId);

    if (subscriptionEntity) {
      await jobState.addRelationship(
        createDirectRelationship({
          _class:
            MonitorRelationships.SUBSCRIPTION_HAS_MONITOR_LOG_PROFILE._class,
          from: subscriptionEntity,
          to: logProfileEntity,
        }),
      );
    }

    const { storageAccountId } = logProfile;
    if (!storageAccountId) return;

    const storageAccountEntity = await jobState.findEntity(storageAccountId);
    if (!storageAccountEntity) return;

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.USES,
        from: logProfileEntity,
        to: storageAccountEntity,
      }),
    );
  });
}

export const monitorSteps: Step<
  IntegrationStepExecutionContext<IntegrationConfig>
>[] = [
  {
    id: MonitorSteps.MONITOR_LOG_PROFILES,
    name: 'Monitor Log Profiles',
    entities: [MonitorEntities.MONITOR_LOG_PROFILE],
    relationships: [
      MonitorRelationships.SUBSCRIPTION_HAS_MONITOR_LOG_PROFILE,
      MonitorRelationships.MONITOR_LOG_PROFILE_USES_STORAGE_ACCOUNT,
    ],
    dependsOn: [STEP_RM_SUBSCRIPTIONS, STEP_RM_STORAGE_RESOURCES],
    executionHandler: fetchLogProfiles,
  },
];
