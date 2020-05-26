import {
  createIntegrationRelationship,
  Entity,
  generateRelationshipType,
} from "@jupiterone/integration-sdk";

import { createAzureWebLinker } from "../../../../azure";
import { ACCOUNT_ENTITY_TYPE } from "../../../../jupiterone";
import { IntegrationStepContext } from "../../../../types";
import { createDatabaseEntity, createDbServerEntity } from "../converters";
import { PostgreSQLClient } from "./client";

export const RM_POSTGRESQL_SERVER_ENTITY_TYPE = "azure_postgresql_server";
export const RM_POSTGRESQL_DATABASE_ENTITY_TYPE = "azure_postgresql_database";
export const RM_POSTGRESQL_SERVER_DATABASE_RELATIONSHIP_TYPE = generateRelationshipType(
  "HAS",
  RM_POSTGRESQL_SERVER_ENTITY_TYPE,
  RM_POSTGRESQL_DATABASE_ENTITY_TYPE,
);

export async function fetchPostgreSQLDatabases(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const accountEntity = await jobState.getData<Entity>(ACCOUNT_ENTITY_TYPE);

  const webLinker = createAzureWebLinker(accountEntity.defaultDomain as string);
  const client = new PostgreSQLClient(instance.config, logger);

  await client.iterateServers(async (server) => {
    const serverEntity = createDbServerEntity(
      webLinker,
      server,
      RM_POSTGRESQL_SERVER_ENTITY_TYPE,
    );
    await jobState.addEntity(serverEntity);

    try {
      await client.iterateDatabases(server, async (database) => {
        const databaseEntity = createDatabaseEntity(
          webLinker,
          database,
          RM_POSTGRESQL_DATABASE_ENTITY_TYPE,
        );

        await jobState.addEntity(databaseEntity);
        await jobState.addRelationship(
          createIntegrationRelationship({
            _class: "HAS",
            from: serverEntity,
            to: databaseEntity,
          }),
        );
      });
    } catch (err) {
      logger.warn(
        { err, server: { id: server.id, type: server.type } },
        "Failure fetching databases for server",
      );
      // In the case this is a transient failure, ideally we would avoid
      // deleting previously ingested databases for this server. That would
      // require that we process each server independently, and have a way
      // to communicate to the synchronizer that only a subset is partial.
    }
  });
}