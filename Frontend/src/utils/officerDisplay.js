export function getAssignedOfficer(complaint) {
  return complaint?.officer || complaint?.officer_profile || null;
}

export function getOfficerName(complaint) {
  const officer = getAssignedOfficer(complaint);
  if (!officer) return null;
  return officer.full_name || officer.name || null;
}

export function formatOfficerSummary(complaint) {
  const officer = getAssignedOfficer(complaint);
  if (!officer) return 'Not assigned yet';

  const parts = [officer.full_name || officer.name || 'Officer'];
  if (officer.badge_number) parts.push(`Badge ${officer.badge_number}`);
  if (officer.specialization) parts.push(officer.specialization);

  return parts.join(' • ');
}
