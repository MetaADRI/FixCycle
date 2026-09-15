import { mapConfiguration, type RuntimeConfiguration } from '@fixcycle/config';

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

export interface ConfigurationPayload {
  merchant_id?: string | number;
  unique_no?: string;
  package_name?: string;
  apk_version?: string;
  device?: number;
  operating_system?: string;
  language_code?: string;
}

const DEFAULT_PAYLOAD: ConfigurationPayload = {
  unique_no: 'pwa-unique',
  package_name: 'com.fixcycle.pwa.user',
  apk_version: '1.0.0',
  device: 2,
  operating_system: 'WEB',
  language_code: 'en',
};

export function fetchUserConfiguration(client: ApiClient, extra?: ConfigurationPayload): Promise<RuntimeConfiguration> {
  return client
    .post<Record<string, unknown>>('/user/configuration', { ...DEFAULT_PAYLOAD, ...(extra ?? {}) })
    .then((envelope: ApiEnvelope<Record<string, unknown>>) => mapConfiguration(envelope.data));
}