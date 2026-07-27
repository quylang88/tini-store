import { migrateProductCodes } from "../inventory/productCode.js";

export const BACKUP_VERSION = 2;

export const buildBackupData = ({
  products = [],
  orders = [],
  settings = {},
  customers = [],
  aiChatSummary = "",
  purchaseLists = [],
}) => ({
  backupVersion: BACKUP_VERSION,
  products,
  orders,
  settings,
  aiChatSummary,
  customers,
  purchaseLists,
});

export const normalizeBackupProducts = (backupData = {}) =>
  migrateProductCodes(backupData.products || [], {
    replaceAll: Number(backupData.backupVersion || 0) < BACKUP_VERSION,
  });
