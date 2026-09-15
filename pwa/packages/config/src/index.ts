export type AppRole = 'user' | 'driver' | 'store';

export interface PublicEnv {
  appRole: AppRole;
  apiBase: string;
  merchantPublicKey: string;
  merchantSecretKey: string;
  oneSignalAppId: string;
  googleMapsKey: string;
  locale: string;
  packageName: string;
  appVersion: string;
}

const APP_ROLE = (process.env.NEXT_PUBLIC_APP_ROLE ?? 'user') as AppRole;

export const publicEnv: PublicEnv = {
  appRole: APP_ROLE,
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? '',
  merchantPublicKey: process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_KEY ?? '',
  merchantSecretKey: process.env.NEXT_PUBLIC_MERCHANT_SECRET_KEY ?? '',
  oneSignalAppId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? '',
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en',
  packageName: process.env.NEXT_PUBLIC_PACKAGE_NAME ?? 'com.fixcycle.pwa.user',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
};

export function hasMerchantCredentials(env: PublicEnv = publicEnv): boolean {
  return env.merchantPublicKey.length > 0 && env.merchantSecretKey.length > 0;
}

export function apiBaseUrl(env: PublicEnv = publicEnv): string {
  return env.apiBase.replace(/\/+$/, '');
}

export function merchantDefaultLocale(env: PublicEnv = publicEnv): string {
  return env.locale === 'en' ? 'en' : env.locale;
}

export interface MerchantConfiguration {
  appName: string;
  appLogoUrl?: string;
  locale: string;
  loginType?: string;
  flags: Record<string, unknown>;
  theme: ThemeColorSet;
  raw?: Record<string, unknown>;
}

export interface ThemeColorSet {
  bgColorPrimary: string;
  bgColorSecondary: string;
  textColorPrimary: string;
  textColorSecondary: string;
}

export interface LanguageOption {
  id: number;
  name?: string;
  shortName?: string;
}

export interface RuntimeConfiguration {
  appName: string;
  theme: ThemeColorSet;
  locale: string;
  flags: Record<string, unknown>;
  businessLogoUrl?: string;
  languages: LanguageOption[];
  raw?: Record<string, unknown>;
}

const DEFAULT_THEME: ThemeColorSet = {
  bgColorPrimary: '#0b1b3f',
  bgColorSecondary: '#ff6b35',
  textColorPrimary: '#101828',
  textColorSecondary: '#667085',
};

const DEFAULTS: RuntimeConfiguration = {
  appName: 'Fixcycle',
  theme: DEFAULT_THEME,
  locale: 'en',
  flags: {},
  languages: [],
};

function toHex(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readRecord<K extends string>(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

// Map the Laravel /configuration resource (UserConfiguration) theme colors.
// The live resource exposes the merchant accent at theme_cofig.primary_color_user.
// Flat keys (bg_color_primary etc.) are still accepted as a fallback shape.
export function mapThemeFromConfiguration(config: Record<string, unknown> | undefined): ThemeColorSet {
  if (!config) {
    return DEFAULT_THEME;
  }
  const themeConfig = readRecord(config['theme_cofig']);
  return {
    bgColorPrimary: toHex(config['bg_color_primary']) ?? DEFAULT_THEME.bgColorPrimary,
    bgColorSecondary:
      toHex(themeConfig?.['primary_color_user']) ?? toHex(config['bg_color_secondary']) ?? DEFAULT_THEME.bgColorSecondary,
    textColorPrimary: toHex(config['text_color_primary']) ?? DEFAULT_THEME.textColorPrimary,
    textColorSecondary: toHex(config['text_color_secondary']) ?? DEFAULT_THEME.textColorSecondary,
  };
}

function mapLanguages(data: Record<string, unknown>): LanguageOption[] {
  const raw = data['languages'];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((entry) => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const id = typeof record['id'] === 'number' ? record['id'] : Number(record['id']);
    if (!Number.isFinite(id) || id <= 0) {
      return [];
    }
    return [
      {
        id,
        name: typeof record['name'] === 'string' ? record['name'] : undefined,
        shortName: typeof record['short_name'] === 'string' ? record['short_name'] : undefined,
      },
    ];
  });
}

function mapAppName(data: Record<string, unknown>): string {
  const generalConfig = readRecord(data['general_config']);
  const splashScreen = generalConfig?.['splash_screen'];
  if (typeof splashScreen === 'string' && splashScreen.trim().length > 0) {
    return splashScreen.trim();
  }
  if (typeof data['app_name'] === 'string' && data['app_name'].trim().length > 0) {
    return data['app_name'].trim();
  }
  return DEFAULTS.appName;
}

function mapLocale(data: Record<string, unknown>): string {
  const generalConfig = readRecord(data['general_config']);
  const defaultLanguage = generalConfig?.['default_language'];
  if (typeof defaultLanguage === 'string' && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(defaultLanguage.trim())) {
    return defaultLanguage.trim();
  }
  if (typeof data['language'] === 'string' && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(data['language'].trim())) {
    return data['language'].trim();
  }
  return DEFAULTS.locale;
}

export function mapConfiguration(data: Record<string, unknown> | undefined): RuntimeConfiguration {
  if (!data) {
    return DEFAULTS;
  }
  const generalConfig = readRecord(data['general_config']);
  const themeConfig = readRecord(data['theme_cofig']);
  const userAppLogo = themeConfig?.['user_app_logo'];
  const businessLogo = data['business_logo'];
  const logoUrl =
    (typeof userAppLogo === 'string' && userAppLogo.trim().length > 0
      ? userAppLogo.trim()
      : typeof businessLogo === 'string' && businessLogo.trim().length > 0
        ? businessLogo.trim()
        : undefined) ?? undefined;
  return {
    appName: mapAppName(data),
    theme: mapThemeFromConfiguration(data),
    locale: mapLocale(data),
    flags: data,
    businessLogoUrl: logoUrl,
    languages: mapLanguages(data),
    raw: data,
  };
}

type ConfigurationState = RuntimeConfiguration;

let currentConfiguration: ConfigurationState = { ...DEFAULTS };

export function getConfiguration(): RuntimeConfiguration {
  return currentConfiguration;
}

export function setConfiguration(configuration: RuntimeConfiguration): void {
  currentConfiguration = { ...configuration };
}

export function resetConfiguration(): void {
  currentConfiguration = { ...DEFAULTS };
}

// ---------------------------------------------------------------------------
// Auth / onboarding view models derived from the raw /configuration resource.
// The Laravel source of truth is app/Http/Resources/UserConfiguration.php.
// ---------------------------------------------------------------------------

export interface CountryOption {
  id: number;
  phonecode: string;
  country_code: string;
  isoCode?: string;
  name?: string;
  currency?: string;
  minNumPhone?: string;
  maxNumPhone?: string;
  sub_area_codes?: string[];
}

export interface CmsPageRef {
  slug: string;
  name?: string;
}

export interface LoginOptions {
  email: boolean;
  phone: boolean;
  otp: boolean;
  skipLogin: boolean;
  ignoreLogin: boolean;
}

export interface RegisterOptions {
  smoker: boolean;
  email: boolean;
  userEmailVisibility: boolean;
  userEmailOtp: boolean;
  phone: boolean;
  userPhoneOtp: boolean;
  gender: boolean;
  userImage: boolean;
}

export interface SocialOptions {
  enable: boolean;
  google: boolean;
  googleSignupKey: string;
  facebook: boolean;
  facebookSignupKey: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  secret: string;
  iv: string;
}

// Mirrors the fallbacks used by app/Helpers/common-helper.php getSecAndIvKeys().
const DEFAULT_ENCRYPTION_SECRET = 'p9Nf8xLqzB1wKv3rjY5Tg4D2H7VbXs6C';
const DEFAULT_ENCRYPTION_IV = '1a2b3c4d5e6f7890';

function readBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function readRecordValue(
  config: Record<string, unknown>,
  section: string,
  key: string,
): unknown {
  const record = readRecord(config[section]);
  return record?.[key];
}

function readSection(config: Record<string, unknown>, section: string): Record<string, unknown> {
  return readRecord(config[section]) ?? {};
}

function readGeneralConfig(config: Record<string, unknown>): Record<string, unknown> {
  return readSection(config, 'general_config');
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function getLoginOptions(config: RuntimeConfiguration = getConfiguration()): LoginOptions {
  const section = readSection(config.flags, 'login');
  return {
    email: readBoolean(section['email']),
    phone: readBoolean(section['phone']),
    otp: readBoolean(section['otp']),
    skipLogin: readBoolean(section['skip_login']),
    ignoreLogin: readBoolean(section['ignore_login']),
  };
}

export function getRegisterOptions(config: RuntimeConfiguration = getConfiguration()): RegisterOptions {
  const section = readSection(config.flags, 'register');
  return {
    smoker: readBoolean(section['smoker']),
    email: readBoolean(section['email']),
    userEmailVisibility: readBoolean(section['user_email_visibility']),
    userEmailOtp: readBoolean(section['user_email_otp']),
    phone: readBoolean(section['phone']),
    userPhoneOtp: readBoolean(section['user_phone_otp']),
    gender: readBoolean(section['gender']),
    userImage: readBoolean(section['userImage_enable']),
  };
}

export function getSocialOptions(config: RuntimeConfiguration = getConfiguration()): SocialOptions {
  const section = readSection(config.flags, 'social');
  return {
    enable: readBoolean(section['enable']),
    google: readBoolean(section['google']),
    googleSignupKey: typeof section['google_signup_key'] === 'string' ? section['google_signup_key'] : '',
    facebook: readBoolean(section['facebook']),
    facebookSignupKey: typeof section['facebook_signup_key'] === 'string' ? section['facebook_signup_key'] : '',
  };
}

export function getGuestEnabled(config: RuntimeConfiguration = getConfiguration()): boolean {
  return readBoolean(readGeneralConfig(config.flags)['guest_user']);
}

export function getNetworkCodeVisibility(config: RuntimeConfiguration = getConfiguration()): boolean {
  return readBoolean(readGeneralConfig(config.flags)['network_code_visibility']);
}

export function getReferralCodeMandatory(
  config: RuntimeConfiguration = getConfiguration(),
): boolean {
  return readBoolean(readGeneralConfig(config.flags)['referral_code_mandatory_user_signup']);
}

export function getCpfEnabled(config: RuntimeConfiguration = getConfiguration()): boolean {
  return readBoolean(readGeneralConfig(config.flags)['user_cpf_number_enable']);
}

export function getPasswordLength(config: RuntimeConfiguration = getConfiguration()): number {
  const value = readGeneralConfig(config.flags)['password_length_for_app'];
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}

export function getCmsSlugs(config: RuntimeConfiguration = getConfiguration()): CmsPageRef[] {
  const value = readGeneralConfig(config.flags)['cms_pages'];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    const record = readRecord(entry);
    if (!record || typeof record['slug'] !== 'string' || record['slug'].length === 0) {
      return [];
    }
    return [{ slug: record['slug'], name: typeof record['name'] === 'string' ? record['name'] : undefined }];
  });
}

export function mapCountries(value: unknown): CountryOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    const record = readRecord(entry);
    if (!record) {
      return [];
    }
    const id = typeof record['id'] === 'number' ? record['id'] : Number(record['id']);
    if (!Number.isFinite(id) || id <= 0) {
      return [];
    }
    const phonecode = record['phonecode'];
    if (typeof phonecode !== 'string' && typeof phonecode !== 'number') {
      return [];
    }
    const subArea = record['sub_area_codes'];
    return [
      {
        id,
        phonecode: String(phonecode),
        country_code: typeof record['country_code'] === 'string' ? record['country_code'] : '',
        isoCode: typeof record['isoCode'] === 'string' ? record['isoCode'] : undefined,
        name: typeof record['name'] === 'string' ? record['name'] : undefined,
        currency: typeof record['currency'] === 'string' ? record['currency'] : undefined,
        minNumPhone:
          typeof record['minNumPhone'] === 'string' || typeof record['minNumPhone'] === 'number'
            ? String(record['minNumPhone'])
            : undefined,
        maxNumPhone:
          typeof record['maxNumPhone'] === 'string' || typeof record['maxNumPhone'] === 'number'
            ? String(record['maxNumPhone'])
            : undefined,
        sub_area_codes: Array.isArray(subArea)
          ? subArea.filter((item): item is string => typeof item === 'string')
          : undefined,
      },
    ];
  });
}

export function getCountries(config: RuntimeConfiguration = getConfiguration()): CountryOption[] {
  return mapCountries(config.flags['countries']);
}

export function getEncryptionConfig(config: RuntimeConfiguration = getConfiguration()): EncryptionConfig | null {
  const general = readGeneralConfig(config.flags);
  const enabled =
    readBoolean(general['encrypt_decrypt_enable']) || readBoolean(general['encrypt_decrypt_configuration']);
  if (!enabled) {
    return null;
  }
  const secretKey =
    (typeof general['encrypt_decrypt_secret_key'] === 'string' ? general['encrypt_decrypt_secret_key'] : '') ||
    DEFAULT_ENCRYPTION_SECRET;
  const ivKey =
    (typeof general['encrypt_decrypt_iv_key'] === 'string' ? general['encrypt_decrypt_iv_key'] : '') ||
    DEFAULT_ENCRYPTION_IV;
  const secret = [secretKey, DEFAULT_ENCRYPTION_SECRET].find(
    (candidate) => candidate.length > 0 && [16, 24, 32].includes(byteLength(candidate)),
  );
  const iv = [ivKey, DEFAULT_ENCRYPTION_IV].find(
    (candidate) => candidate.length > 0 && byteLength(candidate) === 16,
  );
  if (!secret || !iv) {
    return null;
  }
  return { enabled: true, secret, iv };
}