import { IntegrationExecutionContext } from "@jupiterone/jupiter-managed-integration-sdk";

import { AzureClient, ResourceManagerClient } from "./azure";
import { AzureExecutionContext } from "./types";

export default function initializeContext(
  context: IntegrationExecutionContext,
): AzureExecutionContext {
  const {
    instance: { config },
    logger,
  } = context;

  return {
    ...context,
    ...context.clients.getClients(),
    azure: new AzureClient(
      config.clientId,
      config.clientSecret,
      config.directoryId,
      logger,
    ),
    azrm: new ResourceManagerClient(config, context.logger),
  };
}