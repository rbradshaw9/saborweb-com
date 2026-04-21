import { getGoogleAccessToken, googleRequest } from './lib/google-oauth.mjs';

const targetGtmPublicId = 'GTM-53B8CS5S';
const targetGtmAccountId = '6351125681';
const targetGtmContainerId = '250120383';

const accessToken = await getGoogleAccessToken();

const container = await googleRequest(
  `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${targetGtmAccountId}/containers/${targetGtmContainerId}`,
  accessToken
);
console.log(
  `SaborWeb GTM: account=${targetGtmAccountId} container=${targetGtmContainerId} publicId=${container.publicId ?? targetGtmPublicId}`
);

const gaAccounts = await googleRequest('https://analyticsadmin.googleapis.com/v1beta/accounts', accessToken);
console.log(`GA accounts found: ${gaAccounts.accounts?.length ?? 0}`);
