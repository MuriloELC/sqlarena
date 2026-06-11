import { PRIVACY_VERSION, TERMS_VERSION } from "./constants";

export type LegalAcceptanceProfile = {
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
};

export function hasAcceptedLatestLegal(profile: LegalAcceptanceProfile | null) {
  if (!profile) return false;

  return Boolean(
    profile.terms_accepted_at &&
      profile.terms_version === TERMS_VERSION &&
      profile.privacy_accepted_at &&
      profile.privacy_version === PRIVACY_VERSION,
  );
}
