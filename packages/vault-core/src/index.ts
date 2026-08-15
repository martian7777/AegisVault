export type { VaultItemRecord, VaultItemType, VaultMetaKey, VaultMetaRecord } from './models/vault-item.js';
export type { VaultRepository } from './repository/repository.interface.js';
export { IndexedDbVaultRepository } from './repository/indexeddb-repository.js';
export { onboardVault, type OnboardingResult } from './services/onboarding-service.js';
export { unlockVault } from './services/unlock-service.js';
export { VaultService, type VaultItemSummary } from './services/vault-service.js';
export { exportVaultBackup, importVaultBackup, type VaultBackup } from './services/export-import-service.js';
