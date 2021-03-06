import {
  generateRelationshipType,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';
import { KEY_VAULT_SERVICE_ENTITY_TYPE } from '../key-vault/constants';

// Step IDs
export const STEP_RM_STORAGE_RESOURCES = 'rm-storage-resources';

// Graph objects
/**
 * azure_storage_account --HAS--> (azure_storage_container | azure_storage_queue | azure_storage_file_share | azure_storage_table)
 * azure_storage_container --HAS--> azure_storage_blob
 * azure_storage_file_share --HAS--> azure_storage_file_share_directory
 * azure_storage_table --HAS--> azure_storage_table_entity
 */
export const STORAGE_ACCOUNT_ENTITY_METADATA = {
  _type: 'azure_storage_account',
  _class: ['Service'],
  resourceName: '[RM] Storage Account',
};

export const STORAGE_CONTAINER_ENTITY_METADATA = {
  _type: 'azure_storage_container',
  _class: ['DataStore'],
  resourceName: '[RM] Storage Container',
};

export const STORAGE_ACCOUNT_RELATIONSHIP_CLASS = RelationshipClass.HAS;
export const STORAGE_ACCOUNT_CONTAINER_RELATIONSHIP_METADATA = {
  _type: generateRelationshipType(
    STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
    STORAGE_ACCOUNT_ENTITY_METADATA._type,
    STORAGE_CONTAINER_ENTITY_METADATA._type,
  ),
  sourceType: STORAGE_ACCOUNT_ENTITY_METADATA._type,
  _class: STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
  targetType: STORAGE_CONTAINER_ENTITY_METADATA._type,
};

export const StorageRelationships = {
  STORAGE_ACCOUNT_USES_KEY_VAULT: {
    _type: 'azure_storage_account_uses_keyvault_service',
    sourceType: STORAGE_ACCOUNT_ENTITY_METADATA._type,
    _class: RelationshipClass.USES,
    targetType: KEY_VAULT_SERVICE_ENTITY_TYPE,
  },
};

export const STORAGE_FILE_SHARE_ENTITY_METADATA = {
  _type: 'azure_storage_file_share',
  _class: ['DataStore'],
  resourceName: '[RM] Storage File Share',
};

export const STORAGE_ACCOUNT_FILE_SHARE_RELATIONSHIP_METADATA = {
  _type: generateRelationshipType(
    STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
    STORAGE_ACCOUNT_ENTITY_METADATA._type,
    STORAGE_FILE_SHARE_ENTITY_METADATA._type,
  ),
  sourceType: STORAGE_ACCOUNT_ENTITY_METADATA._type,
  _class: STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
  targetType: STORAGE_FILE_SHARE_ENTITY_METADATA._type,
};

// Storage Queues
export const STEP_RM_STORAGE_QUEUES = 'rm-storage-queues';
export const STORAGE_QUEUE_ENTITY_METADATA = {
  _type: 'azure_storage_queue',
  _class: ['Queue'],
  resourceName: '[RM] Storage Queue',
};

export const STORAGE_ACCOUNT_QUEUE_RELATIONSHIP_METADATA = {
  _type: generateRelationshipType(
    STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
    STORAGE_ACCOUNT_ENTITY_METADATA._type,
    STORAGE_QUEUE_ENTITY_METADATA._type,
  ),
  sourceType: STORAGE_ACCOUNT_ENTITY_METADATA._type,
  _class: STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
  targetType: STORAGE_QUEUE_ENTITY_METADATA._type,
};

// Storage Tables
export const STEP_RM_STORAGE_TABLES = 'rm-storage-tables';
export const STORAGE_TABLE_ENTITY_METADATA = {
  _type: 'azure_storage_table',
  _class: ['DataStore', 'Database'],
  resourceName: '[RM] Storage Table',
};

export const STORAGE_ACCOUNT_TABLE_RELATIONSHIP_METADATA = {
  _type: generateRelationshipType(
    STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
    STORAGE_ACCOUNT_ENTITY_METADATA._type,
    STORAGE_TABLE_ENTITY_METADATA._type,
  ),
  sourceType: STORAGE_ACCOUNT_ENTITY_METADATA._type,
  _class: STORAGE_ACCOUNT_RELATIONSHIP_CLASS,
  targetType: STORAGE_TABLE_ENTITY_METADATA._type,
};
