import { fetchApiManagementServices, fetchApiManagementApis } from '.';
import {
  MockIntegrationStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { IntegrationConfig } from '../../../types';
import { setupAzureRecording } from '../../../../test/helpers/recording';
import { createMockAzureStepExecutionContext } from '../../../../test/createMockAzureStepExecutionContext';
import { ACCOUNT_ENTITY_TYPE } from '../../active-directory';
import { ApiManagementEntities } from './constants';
import { MonitorEntities } from '../monitor/constants';

let recording: Recording;
let instanceConfig: IntegrationConfig;
let context: MockIntegrationStepExecutionContext<IntegrationConfig>;

describe('step - api management services', () => {
  beforeAll(async () => {
    instanceConfig = {
      clientId: process.env.CLIENT_ID || 'clientId',
      clientSecret: process.env.CLIENT_SECRET || 'clientSecret',
      directoryId: '4a17becb-fb42-4633-b5c8-5ab66f28d195',
      subscriptionId: '87f62f44-9dad-4284-a08f-f2fb3d8b528a',
      developerId: 'keionned',
    };

    recording = setupAzureRecording({
      directory: __dirname,
      name: 'resource-manager-step-api-management-services',
    });

    context = createMockAzureStepExecutionContext({
      instanceConfig,
      entities: [
        {
          _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev`,
          _type: 'azure_resource_group',
          _class: ['Group'],
        },
      ],
      setData: {
        [ACCOUNT_ENTITY_TYPE]: { defaultDomain: 'www.fake-domain.com' },
      },
    });

    await fetchApiManagementServices(context);
  });

  afterAll(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  it('should collect an Azure Api Management Service entity', () => {
    const { collectedEntities } = context.jobState;

    expect(collectedEntities).toContainEqual(
      expect.objectContaining({
        id: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        _class: ApiManagementEntities.SERVICE._class,
        _type: ApiManagementEntities.SERVICE._type,
        category: ['application'],
        developerPortalUrl: 'https://j1dev.developer.azure-api.net',
        disableGateway: false,
        displayName: 'j1dev',
        enableClientCertificate: false,
        function: ['api-gateway'],
        gatewayRegionalUrl: 'https://j1dev-eastus-01.regional.azure-api.net',
        gatewayUrl: 'https://j1dev.azure-api.net',
        location: 'East US',
        managementApiUrl: 'https://j1dev.management.azure-api.net',
        name: 'j1dev',
        notificationSenderEmail: 'apimgmt-noreply@mail.windowsazure.com',
        portalUrl: 'https://j1dev.portal.azure-api.net',
        provisioningState: 'Succeeded',
        public: true,
        publicIpAddresses: ['40.121.14.61'],
        publisherEmail: 'ndowmon@jupiterone.com',
        publisherName: 'JupiterOne',
        scmUrl: 'https://j1dev.scm.azure-api.net',
        targetProvisioningState: '',
        type: 'Microsoft.ApiManagement/service',
        virtualNetworkType: 'None',
        webLink: `https://portal.azure.com/#@www.fake-domain.com/resource/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
      }),
    );
  });

  it('should collect an Azure Diagnostic Log Setting entity', () => {
    const { collectedEntities } = context.jobState;

    expect(collectedEntities).toContainEqual(
      expect.objectContaining({
        id: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/logs/GatewayLogs/true/1/true`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/logs/GatewayLogs/true/1/true`,
        _class: MonitorEntities.DIAGNOSTIC_LOG_SETTING._class,
        _type: MonitorEntities.DIAGNOSTIC_LOG_SETTING._type,
        category: 'GatewayLogs',
        displayName: 'j1dev_api_mgmt_diag_set',
        enabled: true,
        eventHubAuthorizationRuleId: null,
        eventHubName: null,
        logAnalyticsDestinationType: 'AzureDiagnostics',
        name: 'j1dev_api_mgmt_diag_set',
        'retentionPolicy.days': 1,
        'retentionPolicy.enabled': true,
        serviceBusRuleId: null,
        storageAccountId: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/${instanceConfig.developerId}j1dev`,
        webLink: `https://portal.azure.com/#@www.fake-domain.com/resource/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set`,
        workspaceId: null,
      }),
    );
  });

  it('should collect an Azure Diagnostic Metric Setting entity', () => {
    const { collectedEntities } = context.jobState;

    expect(collectedEntities).toContainEqual(
      expect.objectContaining({
        id: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/metrics/AllMetrics/true/undefined/1/true`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/metrics/AllMetrics/true/undefined/1/true`,
        _class: MonitorEntities.DIAGNOSTIC_METRIC_SETTING._class,
        _type: MonitorEntities.DIAGNOSTIC_METRIC_SETTING._type,
        category: 'AllMetrics',
        displayName: 'j1dev_api_mgmt_diag_set',
        enabled: true,
        eventHubAuthorizationRuleId: null,
        eventHubName: null,
        logAnalyticsDestinationType: 'AzureDiagnostics',
        name: 'j1dev_api_mgmt_diag_set',
        'retentionPolicy.days': 1,
        'retentionPolicy.enabled': true,
        serviceBusRuleId: null,
        storageAccountId: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/${instanceConfig.developerId}j1dev`,
        timeGrain: undefined,
        webLink: `https://portal.azure.com/#@www.fake-domain.com/resource/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set`,
        workspaceId: null,
      }),
    );
  });

  it('should collect an Azure Resource Group has Azure Api Management Service relationship', () => {
    const { collectedRelationships } = context.jobState;

    expect(collectedRelationships).toContainEqual(
      expect.objectContaining({
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev|has|/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        _type: 'azure_resource_group_has_api_management_service',
        _class: 'HAS',
        _fromEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev`,
        _toEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        displayName: 'HAS',
      }),
    );
  });

  it('should collect an Azure Api Management Service has Azure Diagnostic Log Setting relationship', () => {
    const { collectedRelationships } = context.jobState;

    expect(collectedRelationships).toContainEqual(
      expect.objectContaining({
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev|has|/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/logs/GatewayLogs/true/1/true`,
        _type: 'azure_resource_has_diagnostic_log_setting',
        _class: 'HAS',
        _fromEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        _toEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/logs/GatewayLogs/true/1/true`,
        displayName: 'HAS',
      }),
    );
  });

  it('should collect an Azure Diagnostic Log Setting uses Azure Storage Account relationship', () => {
    const { collectedRelationships } = context.jobState;

    expect(collectedRelationships).toContainEqual(
      expect.objectContaining({
        _class: 'USES',
        _fromEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/logs/GatewayLogs/true/1/true`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/logs/GatewayLogs/true/1/true|uses|/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/${instanceConfig.developerId}j1dev`,
        _toEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/${instanceConfig.developerId}j1dev`,
        _type: 'azure_diagnostic_log_setting_uses_storage_account',
        displayName: 'USES',
      }),
    );
  });

  it('should collect an Azure Api Management Service has Azure Diagnostic Metric Setting relationship', () => {
    const { collectedRelationships } = context.jobState;

    expect(collectedRelationships).toContainEqual(
      expect.objectContaining({
        _class: 'HAS',
        _fromEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev|has|/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/metrics/AllMetrics/true/undefined/1/true`,
        _toEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/metrics/AllMetrics/true/undefined/1/true`,
        _type: 'azure_resource_has_diagnostic_metric_setting',
        displayName: 'HAS',
      }),
    );
  });

  it('should collect an Azure Diagnostic Metric Setting uses Azure Storage Account relationship', () => {
    const { collectedRelationships } = context.jobState;

    expect(collectedRelationships).toContainEqual(
      expect.objectContaining({
        _class: 'USES',
        _fromEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/metrics/AllMetrics/true/undefined/1/true`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourcegroups/j1dev/providers/microsoft.apimanagement/service/j1dev/providers/microsoft.insights/diagnosticSettings/j1dev_api_mgmt_diag_set/metrics/AllMetrics/true/undefined/1/true|uses|/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/${instanceConfig.developerId}j1dev`,
        _toEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.Storage/storageAccounts/${instanceConfig.developerId}j1dev`,
        _type: 'azure_diagnostic_metric_setting_uses_storage_account',
        displayName: 'USES',
      }),
    );
  });
});

describe('step - api management apis', () => {
  beforeAll(async () => {
    instanceConfig = {
      clientId: process.env.CLIENT_ID || 'clientId',
      clientSecret: process.env.CLIENT_SECRET || 'clientSecret',
      directoryId: '4a17becb-fb42-4633-b5c8-5ab66f28d195',
      subscriptionId: '87f62f44-9dad-4284-a08f-f2fb3d8b528a',
    };

    recording = setupAzureRecording({
      directory: __dirname,
      name: 'resource-manager-step-api-management-apis',
      options: {
        recordFailedRequests: true,
      },
    });

    context = createMockAzureStepExecutionContext({
      instanceConfig,
      entities: [
        {
          _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
          _type: 'azure_api_management_service',
          _class: ['Gateway'],
          id: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
          name: 'j1dev',
        },
      ],
      setData: {
        [ACCOUNT_ENTITY_TYPE]: { defaultDomain: 'www.fake-domain.com' },
      },
    });

    await fetchApiManagementApis(context);
  });

  afterAll(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  it('should collect an Azure API Management API entity', () => {
    const { collectedEntities } = context.jobState;

    expect(collectedEntities).toContainEqual(
      expect.objectContaining({
        id: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/j1dev-api`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/j1dev-api`,
        _class: ApiManagementEntities.API._class,
        _type: ApiManagementEntities.API._type,
        address: 'j1dev/test',
        apiRevision: '1',
        apiVersion: '',
        description: '',
        displayName: 'j1dev API',
        isCurrent: true,
        name: 'j1dev-api',
        path: 'j1dev/test',
        protocols: ['https'],
        serviceUrl: '',
        subscriptionRequired: true,
        type: 'Microsoft.ApiManagement/service/apis',
        webLink: `https://portal.azure.com/#@www.fake-domain.com/resource/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/j1dev-api`,
      }),
    );
  });

  it('should collect an Azure API Management API entity', () => {
    const { collectedEntities } = context.jobState;

    expect(collectedEntities).toContainEqual(
      expect.objectContaining({
        id: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/echo-api`,
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/echo-api`,
        _class: ApiManagementEntities.API._class,
        _type: ApiManagementEntities.API._type,
        address: 'echo',
        apiRevision: '1',
        displayName: 'Echo API',
        isCurrent: true,
        name: 'echo-api',
        path: 'echo',
        protocols: ['https'],
        serviceUrl: 'http://echoapi.cloudapp.net/api',
        subscriptionRequired: true,
        type: 'Microsoft.ApiManagement/service/apis',
        webLink: `https://portal.azure.com/#@www.fake-domain.com/resource/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/echo-api`,
      }),
    );
  });

  it('should collect an Azure API Management Service has Azure API Management API relationship', () => {
    const { collectedRelationships } = context.jobState;

    expect(collectedRelationships).toContainEqual(
      expect.objectContaining({
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev|has|/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/j1dev-api`,
        _type: 'azure_api_management_service_has_api',
        _class: 'HAS',
        _fromEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        _toEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/j1dev-api`,
        displayName: 'HAS',
      }),
    );
  });

  it('should collect an Azure API Management Service has Azure API Management API relationship', () => {
    const { collectedRelationships } = context.jobState;

    expect(collectedRelationships).toContainEqual(
      expect.objectContaining({
        _key: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev|has|/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/echo-api`,
        _type: 'azure_api_management_service_has_api',
        _class: 'HAS',
        _fromEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev`,
        _toEntityKey: `/subscriptions/${instanceConfig.subscriptionId}/resourceGroups/j1dev/providers/Microsoft.ApiManagement/service/j1dev/apis/echo-api`,
        displayName: 'HAS',
      }),
    );
  });
});
