import { getGoogleAccessToken, googleRequest } from './lib/google-oauth.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const config = {
  gtmAccountId: process.env.GTM_ACCOUNT_ID ?? '6351125681',
  gtmContainerId: process.env.GTM_CONTAINER_ID ?? '250120383',
  gtmWorkspaceId: process.env.GTM_WORKSPACE_ID ?? '3',
  ga4PropertyId: process.env.GA4_PROPERTY_ID ?? '534026680',
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-HQTS3GVK6E',
};

const funnelEvents = [
  { name: 'preview_cta_clicked', parameters: ['location', 'package_key', 'package_name'] },
  { name: 'brief_builder_started', parameters: ['step', 'language', 'has_token'] },
  { name: 'brief_builder_step_completed', parameters: ['step', 'language', 'has_token'] },
  { name: 'brief_builder_resumed', parameters: ['step', 'language', 'has_token'] },
  { name: 'brief_builder_submitted', parameters: ['step', 'language', 'has_token'] },
  {
    name: 'select_item',
    parameters: ['item_list_name', 'package_key', 'package_name', 'currency', 'value', 'monthly_value', 'items'],
  },
  { name: 'begin_checkout', parameters: ['package_key', 'package_name', 'currency', 'value', 'monthly_value', 'items'] },
  {
    name: 'purchase',
    parameters: [
      'transaction_id',
      'currency',
      'value',
      'package_key',
      'package_name',
      'setup_fee',
      'monthly_value',
      'items',
    ],
  },
];

const customDimensions = [
  ['package_key', 'Package Key'],
  ['package_name', 'Package Name'],
  ['step', 'Wizard Step'],
  ['location', 'CTA Location'],
  ['language', 'Language'],
  ['item_list_name', 'Item List Name'],
];

const customMetrics = [
  ['setup_fee', 'Setup Fee'],
  ['monthly_value', 'Monthly Value'],
];

const keyEvents = ['brief_builder_submitted', 'begin_checkout', 'purchase'];

function workspacePath() {
  return `/tagmanager/v2/accounts/${config.gtmAccountId}/containers/${config.gtmContainerId}/workspaces/${config.gtmWorkspaceId}`;
}

function propertyPath() {
  return `/v1beta/properties/${config.ga4PropertyId}`;
}

async function requestWithPacing(path, accessToken, options) {
  const data = await googleRequest(path, accessToken, options);
  await sleep(2200);
  return data;
}

function templateParameter(key, value) {
  return { type: 'template', key, value };
}

function dataLayerVariableBody(parameterName) {
  return {
    name: `DLV - ${parameterName}`,
    type: 'v',
    parameter: [
      templateParameter('name', parameterName),
      { type: 'integer', key: 'dataLayerVersion', value: '2' },
    ],
  };
}

function customEventTriggerBody(eventName) {
  return {
    name: `Event - ${eventName}`,
    type: 'CUSTOM_EVENT',
    customEventFilter: [
      {
        type: 'EQUALS',
        parameter: [
          templateParameter('arg0', '{{_event}}'),
          templateParameter('arg1', eventName),
        ],
      },
    ],
  };
}

function eventSettingsTable(parameters) {
  return {
    type: 'list',
    key: 'eventSettingsTable',
    list: parameters.map((parameterName) => ({
      type: 'map',
      map: [
        templateParameter('parameter', parameterName),
        templateParameter('parameterValue', `{{DLV - ${parameterName}}}`),
      ],
    })),
  };
}

function ga4EventTagBody(eventName, triggerId, parameters) {
  return {
    name: `GA4 Event - ${eventName}`,
    type: 'gaawe',
    parameter: [
      templateParameter('eventName', eventName),
      templateParameter('measurementIdOverride', config.ga4MeasurementId),
      eventSettingsTable(parameters),
    ],
    firingTriggerId: [triggerId],
    tagFiringOption: 'oncePerEvent',
  };
}

async function ensureCustomDefinitions(accessToken) {
  const existingDimensions = await googleRequest(`${propertyPath()}/customDimensions`, accessToken);
  const dimensionNames = new Set((existingDimensions.customDimensions ?? []).map((item) => item.parameterName));

  for (const [parameterName, displayName] of customDimensions) {
    if (dimensionNames.has(parameterName)) {
      console.log(`GA4 custom dimension exists: ${parameterName}`);
      continue;
    }

    await requestWithPacing(`${propertyPath()}/customDimensions`, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        parameterName,
        displayName,
        scope: 'EVENT',
        description: `SaborWeb funnel event parameter: ${parameterName}`,
      }),
    });
    console.log(`Created GA4 custom dimension: ${parameterName}`);
  }

  const existingMetrics = await googleRequest(`${propertyPath()}/customMetrics`, accessToken);
  const metricNames = new Set((existingMetrics.customMetrics ?? []).map((item) => item.parameterName));

  for (const [parameterName, displayName] of customMetrics) {
    if (metricNames.has(parameterName)) {
      console.log(`GA4 custom metric exists: ${parameterName}`);
      continue;
    }

    await requestWithPacing(`${propertyPath()}/customMetrics`, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        parameterName,
        displayName,
        scope: 'EVENT',
        measurementUnit: 'CURRENCY',
        restrictedMetricType: ['REVENUE_DATA'],
        description: `SaborWeb funnel event metric: ${parameterName}`,
      }),
    });
    console.log(`Created GA4 custom metric: ${parameterName}`);
  }

  const existingKeyEvents = await googleRequest(`${propertyPath()}/keyEvents`, accessToken);
  const keyEventNames = new Set((existingKeyEvents.keyEvents ?? []).map((item) => item.eventName));

  for (const eventName of keyEvents) {
    if (keyEventNames.has(eventName)) {
      console.log(`GA4 key event exists: ${eventName}`);
      continue;
    }

    await requestWithPacing(`${propertyPath()}/keyEvents`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ eventName }),
    });
    console.log(`Created GA4 key event: ${eventName}`);
  }
}

async function ensureGtmContainer(accessToken) {
  const [variablesResponse, triggersResponse, tagsResponse] = await Promise.all([
    googleRequest(`${workspacePath()}/variables`, accessToken),
    googleRequest(`${workspacePath()}/triggers`, accessToken),
    googleRequest(`${workspacePath()}/tags`, accessToken),
  ]);

  const variablesByName = new Map((variablesResponse.variable ?? []).map((item) => [item.name, item]));
  const triggersByName = new Map((triggersResponse.trigger ?? []).map((item) => [item.name, item]));
  const tagsByName = new Map((tagsResponse.tag ?? []).map((item) => [item.name, item]));
  const parameterNames = [...new Set(funnelEvents.flatMap((event) => event.parameters))];

  for (const parameterName of parameterNames) {
    const variableName = `DLV - ${parameterName}`;
    if (variablesByName.has(variableName)) {
      console.log(`GTM variable exists: ${variableName}`);
      continue;
    }

    const variable = await requestWithPacing(`${workspacePath()}/variables`, accessToken, {
      method: 'POST',
      body: JSON.stringify(dataLayerVariableBody(parameterName)),
    });
    variablesByName.set(variable.name, variable);
    console.log(`Created GTM variable: ${variable.name}`);
  }

  for (const event of funnelEvents) {
    const triggerName = `Event - ${event.name}`;
    let trigger = triggersByName.get(triggerName);
    if (!trigger) {
      trigger = await requestWithPacing(`${workspacePath()}/triggers`, accessToken, {
        method: 'POST',
        body: JSON.stringify(customEventTriggerBody(event.name)),
      });
      triggersByName.set(trigger.name, trigger);
      console.log(`Created GTM trigger: ${trigger.name}`);
    } else {
      console.log(`GTM trigger exists: ${triggerName}`);
    }

    const tagName = `GA4 Event - ${event.name}`;
    if (tagsByName.has(tagName)) {
      console.log(`GTM tag exists: ${tagName}`);
      continue;
    }

    const tag = await requestWithPacing(`${workspacePath()}/tags`, accessToken, {
      method: 'POST',
      body: JSON.stringify(ga4EventTagBody(event.name, trigger.triggerId, event.parameters)),
    });
    tagsByName.set(tag.name, tag);
    console.log(`Created GTM tag: ${tag.name}`);
  }
}

async function publishGtmVersion(accessToken) {
  const version = await googleRequest(`${workspacePath()}:create_version`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      name: `SaborWeb funnel analytics ${new Date().toISOString().slice(0, 10)}`,
      notes: 'Adds GA4 forwarding tags for SaborWeb funnel, checkout, and purchase dataLayer events.',
    }),
  });

  const containerVersion = version.containerVersion;
  if (!containerVersion?.containerVersionId) {
    console.log('No GTM container version created. The workspace may have no pending changes.');
    return null;
  }

  await googleRequest(
    `/tagmanager/v2/accounts/${config.gtmAccountId}/containers/${config.gtmContainerId}/versions/${containerVersion.containerVersionId}:publish`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );

  console.log(`Published GTM version ${containerVersion.containerVersionId}: ${containerVersion.name}`);
  return containerVersion;
}

const accessToken = await getGoogleAccessToken();

console.log(`Syncing GA4 property ${config.ga4PropertyId} and GTM container ${config.gtmContainerId}...`);
await ensureCustomDefinitions(accessToken);
await ensureGtmContainer(accessToken);
await publishGtmVersion(accessToken);
console.log('Google analytics sync complete.');
