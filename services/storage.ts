import { supabase, isSupabaseConfigured } from './client';
import { Customer, RepairTicket, Organization, WarrantyTicket } from '../types';

// --- LOCAL STORAGE IMPLEMENTATION (FALLBACK) ---
const LS_KEYS = {
  ORGS: 'device_mgr_orgs',
  CUSTOMERS: 'device_mgr_customers',
  TICKETS: 'device_mgr_tickets',
  WARRANTIES: 'device_mgr_warranties'
};

const localDB = {
  get: <T>(key: string): T[] => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch (e) { 
      console.error(`LocalDB Get Error (${key}):`, e);
      return []; 
    }
  },
  set: <T>(key: string, data: T[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`LocalDB Set Error (${key}):`, e);
    }
  },
  add: <T>(key: string, item: T) => {
    const list = localDB.get<T>(key);
    localDB.set(key, [item, ...list]);
  },
  update: <T extends { id: string }>(key: string, item: T) => {
    const list = localDB.get<T>(key);
    const updated = list.map(i => i.id === item.id ? { ...i, ...item } : i);
    localDB.set(key, updated);
  },
  delete: <T extends { id: string }>(key: string, id: string) => {
    const list = localDB.get<T>(key);
    localDB.set(key, list.filter(i => i.id !== id));
  }
};

export const StorageService = {
  // --- ORGANIZATIONS ---
  getOrganizations: async (): Promise<Organization[]> => {
    try {
      if (!isSupabaseConfigured) return localDB.get<Organization>(LS_KEYS.ORGS);

      const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      return data?.map((row: any) => ({
        id: row.id,
        name: row.name || 'Không tên',
        address: row.address || '',
        createdAt: row.created_at || row.createdAt || Date.now()
      })) || [];
    } catch (e) {
      console.error('Error fetching orgs:', e);
      return [];
    }
  },

  addOrganization: async (org: Organization) => {
    if (!isSupabaseConfigured) return localDB.add(LS_KEYS.ORGS, org);

    const { error } = await supabase.from('organizations').insert([{
      id: org.id,
      name: org.name,
      address: org.address,
      created_at: org.createdAt
    }]);
    if (error) {
      console.error('Add Organization Error:', error);
      throw error;
    }
  },

  updateOrganization: async (org: Organization) => {
    if (!isSupabaseConfigured) return localDB.update(LS_KEYS.ORGS, org);

    const { error } = await supabase.from('organizations').update({
      name: org.name,
      address: org.address,
      created_at: org.createdAt // Đảm bảo giữ nguyên ngày tạo
    }).eq('id', org.id);
    if (error) {
      console.error('Update Organization Error:', error);
      throw error;
    }
  },

  deleteOrganization: async (id: string) => {
    if (!isSupabaseConfigured) return localDB.delete(LS_KEYS.ORGS, id);

    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) {
      console.error('Delete Organization Error:', error);
      throw error;
    }
  },

  // --- CUSTOMERS ---
  getCustomers: async (): Promise<Customer[]> => {
    try {
      if (!isSupabaseConfigured) return localDB.get<Customer>(LS_KEYS.CUSTOMERS);

      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      return data?.map((row: any) => ({
        id: row.id,
        fullName: row.full_name || row.fullName,
        organizationId: row.organization_id || row.organizationId,
        phone: row.phone || '',
        address: row.address || '',
        createdAt: row.created_at || row.createdAt || Date.now()
      })) || [];
    } catch (e) {
      console.error('Error fetching customers:', e);
      return [];
    }
  },

  addCustomer: async (c: Customer) => {
    if (!isSupabaseConfigured) return localDB.add(LS_KEYS.CUSTOMERS, c);

    const dbRow = {
      id: c.id,
      full_name: c.fullName,
      organization_id: c.organizationId,
      phone: c.phone,
      address: c.address,
      created_at: c.createdAt
    };
    const { error } = await supabase.from('customers').insert([dbRow]);
    if (error) throw error;
  },

  updateCustomer: async (c: Customer) => {
    if (!isSupabaseConfigured) return localDB.update(LS_KEYS.CUSTOMERS, c);

    const dbRow = {
      full_name: c.fullName,
      organization_id: c.organizationId,
      phone: c.phone,
      address: c.address,
    };
    const { error } = await supabase.from('customers').update(dbRow).eq('id', c.id);
    if (error) throw error;
  },

  deleteCustomer: async (id: string) => {
    if (!isSupabaseConfigured) return localDB.delete(LS_KEYS.CUSTOMERS, id);
    
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('Delete Customer Error:', error);
      throw error;
    }
  },

  // --- REPAIR TICKETS ---
  getTickets: async (): Promise<RepairTicket[]> => {
    try {
      if (!isSupabaseConfigured) return localDB.get<RepairTicket>(LS_KEYS.TICKETS);

      const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      return data?.map((row: any) => ({
        id: row.id,
        customerId: row.customer_id || row.customerId,
        deviceType: row.device_type || row.deviceType,
        serialNumber: row.serial_number || row.serialNumber,
        deviceCondition: row.device_condition || row.deviceCondition || '',
        receiveDate: row.receive_date || row.receiveDate || '',
        status: row.status,
        returnDate: row.return_date || row.returnDate,
        returnNote: row.return_note || row.returnNote,
        shippingMethod: row.shipping_method || row.shippingMethod,
        trackingNumber: row.tracking_number || row.trackingNumber, 
        createdAt: row.created_at || row.createdAt || Date.now(),
        updatedAt: row.updated_at || row.updatedAt || Date.now()
      })) || [];
    } catch (e) {
      console.error('Error fetching tickets:', e);
      return [];
    }
  },

  addTicket: async (t: RepairTicket) => {
    if (!isSupabaseConfigured) return localDB.add(LS_KEYS.TICKETS, t);

    const dbRow = {
      id: t.id,
      customer_id: t.customerId,
      device_type: t.deviceType,
      serial_number: t.serialNumber,
      device_condition: t.deviceCondition,
      receive_date: t.receiveDate,
      status: t.status,
      return_date: t.returnDate,
      return_note: t.returnNote,
      shipping_method: t.shippingMethod,
      tracking_number: t.trackingNumber, 
      created_at: t.createdAt,
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('tickets').insert([dbRow]);
    if (error) throw error;
  },

  updateTicket: async (t: RepairTicket) => {
    if (!isSupabaseConfigured) return localDB.update(LS_KEYS.TICKETS, t);

    const dbRow = {
      customer_id: t.customerId,
      device_type: t.deviceType,
      serial_number: t.serialNumber,
      device_condition: t.deviceCondition,
      receive_date: t.receiveDate,
      status: t.status,
      return_date: t.returnDate,
      return_note: t.returnNote,
      shipping_method: t.shippingMethod,
      tracking_number: t.trackingNumber, 
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('tickets').update(dbRow).eq('id', t.id);
    if (error) throw error;
  },

  deleteTicket: async (id: string) => {
    if (!isSupabaseConfigured) return localDB.delete(LS_KEYS.TICKETS, id);

    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) {
      console.error('Delete Ticket Error:', error);
      throw error;
    }
  },

  // --- WARRANTY TICKETS ---
  getWarrantyTickets: async (): Promise<WarrantyTicket[]> => {
    try {
      if (!isSupabaseConfigured) return localDB.get<WarrantyTicket>(LS_KEYS.WARRANTIES);

      const { data, error } = await supabase.from('warranties').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      return data?.map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id || row.organizationId,
        deviceType: row.device_type || row.deviceType,
        serialNumber: row.serial_number || row.serialNumber,
        description: row.description || '',
        sentDate: row.sent_date || row.sentDate || '',
        status: row.status,
        returnDate: row.return_date || row.returnDate,
        cost: row.cost,
        note: row.note,
        shippingMethod: row.shipping_method || row.shippingMethod,
        trackingNumber: row.tracking_number || row.trackingNumber, 
        createdAt: row.created_at || row.createdAt || Date.now(),
        updatedAt: row.updated_at || row.updatedAt || Date.now()
      })) || [];
    } catch (e) {
      console.error('Error fetching warranties:', e);
      return [];
    }
  },

  addWarrantyTicket: async (t: WarrantyTicket) => {
    if (!isSupabaseConfigured) return localDB.add(LS_KEYS.WARRANTIES, t);

    const dbRow = {
      id: t.id,
      organization_id: t.organizationId,
      device_type: t.deviceType,
      serial_number: t.serialNumber,
      description: t.description,
      sent_date: t.sentDate,
      status: t.status,
      return_date: t.returnDate,
      cost: t.cost,
      note: t.note,
      shipping_method: t.shippingMethod,
      tracking_number: t.trackingNumber, 
      created_at: t.createdAt,
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('warranties').insert([dbRow]);
    if (error) throw error;
  },

  updateWarrantyTicket: async (t: WarrantyTicket) => {
    if (!isSupabaseConfigured) return localDB.update(LS_KEYS.WARRANTIES, t);

    const dbRow = {
      organization_id: t.organizationId,
      device_type: t.deviceType,
      serial_number: t.serialNumber,
      description: t.description,
      sent_date: t.sentDate,
      status: t.status,
      return_date: t.returnDate,
      cost: t.cost,
      note: t.note,
      shipping_method: t.shippingMethod,
      tracking_number: t.trackingNumber, 
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('warranties').update(dbRow).eq('id', t.id);
    if (error) throw error;
  },

  deleteWarrantyTicket: async (id: string) => {
    if (!isSupabaseConfigured) return localDB.delete(LS_KEYS.WARRANTIES, id);

    const { error } = await supabase.from('warranties').delete().eq('id', id);
    if (error) {
      console.error('Delete Warranty Error:', error);
      throw error;
    }
  }
};