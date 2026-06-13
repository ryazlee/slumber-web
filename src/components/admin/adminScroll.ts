export function scrollAdminPanelIntoView(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export const ADMIN_CATALOG_FORM_ID = 'admin-catalog-form';
