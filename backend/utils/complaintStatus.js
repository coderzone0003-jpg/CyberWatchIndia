const DB_STATUS = {
  PENDING: 'pending',
  INVESTIGATION: 'under investigation',
  INVESTIGATION_LEGACY: 'investigating',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

const TO_DB_STATUS = {
  pending: DB_STATUS.PENDING,
  investigating: DB_STATUS.INVESTIGATION,
  'under investigation': DB_STATUS.INVESTIGATION,
  resolved: DB_STATUS.RESOLVED,
  rejected: DB_STATUS.REJECTED,
  closed: DB_STATUS.RESOLVED,
};

const FROM_DB_STATUS = {
  pending: DB_STATUS.PENDING,
  investigating: DB_STATUS.INVESTIGATION,
  'under investigation': DB_STATUS.INVESTIGATION,
  resolved: DB_STATUS.RESOLVED,
  rejected: DB_STATUS.REJECTED,
};

function toDbStatus(status) {
  if (!status) return status;
  const key = String(status).trim().toLowerCase();
  return TO_DB_STATUS[key] || status;
}

function fromDbStatus(status) {
  if (!status) return status;
  const key = String(status).trim().toLowerCase();
  return FROM_DB_STATUS[key] || status;
}

function getAlternateDbStatus(status) {
  if (status === DB_STATUS.INVESTIGATION) return DB_STATUS.INVESTIGATION_LEGACY;
  if (status === DB_STATUS.INVESTIGATION_LEGACY) return DB_STATUS.INVESTIGATION;
  return null;
}

function getDbStatusFilterValues(status) {
  const primary = toDbStatus(status);
  const alternate = getAlternateDbStatus(primary);
  return alternate ? [primary, alternate] : [primary];
}

function isInvestigationStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'investigating' || normalized === 'under investigation';
}

function normalizeComplaint(complaint) {
  if (!complaint) return complaint;
  return {
    ...complaint,
    status: fromDbStatus(complaint.status),
  };
}

module.exports = {
  DB_STATUS,
  toDbStatus,
  fromDbStatus,
  getAlternateDbStatus,
  getDbStatusFilterValues,
  isInvestigationStatus,
  normalizeComplaint,
};
