import type { Tenant } from '@/types/database';

export const OFFICIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-gams-sucre',
    slug: 'sucre',
    name: 'Gobierno Autónomo Municipal de Sucre',
    short_name: 'GAMS - Sucre',
    city: 'Sucre',
    country: 'Bolivia',
    badge: 'Mesa Oficial v3.3',
    is_active: true,
    currency: 'Bs.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-09-29T00:00:00Z'
  },
  {
    id: 'tenant-ecotraffic',
    slug: 'ecotraffic',
    name: 'Ecotraffic Consultoría Regulatoria & Movilidad',
    short_name: 'Ecotraffic',
    city: 'La Paz / Sucre',
    country: 'Bolivia',
    badge: 'SuperAdmin Master',
    is_active: true,
    currency: 'Bs.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-09-29T00:00:00Z'
  },
  {
    id: 'tenant-sindicato-san-cristobal',
    slug: 'san-cristobal',
    name: 'Sindicato de Choferes San Cristóbal',
    short_name: 'Sindicato San Cristóbal',
    city: 'Sucre',
    country: 'Bolivia',
    badge: 'Operador Urbano',
    is_active: true,
    currency: 'Bs.',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-09-29T00:00:00Z'
  },
  {
    id: 'tenant-sindicato-sucre',
    slug: 'sindicato-sucre',
    name: 'Sindicato de Micros y Colectivos Sucre',
    short_name: 'Sindicato Sucre',
    city: 'Sucre',
    country: 'Bolivia',
    badge: 'Operador Urbano',
    is_active: true,
    currency: 'Bs.',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-09-29T00:00:00Z'
  }
];

export function getDefaultTenant(): Tenant {
  return OFFICIAL_TENANTS[0];
}

export function getTenantBySlug(slug: string): Tenant | undefined {
  return OFFICIAL_TENANTS.find(t => t.slug.toLowerCase() === slug.toLowerCase());
}

export function getTenantById(id: string): Tenant | undefined {
  return OFFICIAL_TENANTS.find(t => t.id === id);
}
