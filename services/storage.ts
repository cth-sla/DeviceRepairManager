import { supabase } from './client';
import { Customer, RepairTicket, Organization, WarrantyTicket } from '../types';

// Helper function to map DB Snake_case to TS CamelCase if needed, 
// but we will do manual mapping in the functions for clarity.

export const StorageService = {
  // --- ORGANIZATIONS ---
  getOrganizations: async (): Promise<Organization[]> => {
    const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  },

  addOrganization: async (org: Organization) => {
    const { error } = await supabase.from('organizations').insert([org]);
    if (error) throw error;
  },

  updateOrganization: async (org: Organization) => {
    const { error } = await supabase.from('organizations').update(org).eq('id', org.id);
    if (error) throw error;
  },

  deleteOrganization: async (id: string) => {
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CUSTOMERS ---
  getCustomers: async (): Promise<Customer[]> => {
    // Map snake_case columns from DB to camelCase if they differ, 
    // here we assume DB columns match or we map manually
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    
    return data?.map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      organizationId: row.organization_id,
      phone: row.phone,
      address: row.address,
      createdAt: row.created_at
    })) || [];
  },

  addCustomer: async (c: Customer) => {
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
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  // --- REPAIR TICKETS ---
  getTickets: async (): Promise<RepairTicket[]> => {
    const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }

    return data?.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      deviceType: row.device_type,
      serialNumber: row.serial_number,
      deviceCondition: row.device_condition,
      receiveDate: row.receive_date,
      status: row.status,
      returnDate: row.return_date,
      returnNote: row.return_note,
      shippingMethod: row.shipping_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) || [];
  },

  addTicket: async (t: RepairTicket) => {
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
      created_at: t.createdAt,
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('tickets').insert([dbRow]);
    if (error) throw error;
  },

  updateTicket: async (t: RepairTicket) => {
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
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('tickets').update(dbRow).eq('id', t.id);
    if (error) throw error;
  },

  deleteTicket: async (id: string) => {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
  },

  // --- WARRANTY TICKETS ---
  getWarrantyTickets: async (): Promise<WarrantyTicket[]> => {
    const { data, error } = await supabase.from('warranties').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }

    return data?.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      deviceType: row.device_type,
      serialNumber: row.serial_number,
      description: row.description,
      sentDate: row.sent_date,
      status: row.status,
      returnDate: row.return_date,
      cost: row.cost,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) || [];
  },

  addWarrantyTicket: async (t: WarrantyTicket) => {
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
      created_at: t.createdAt,
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('warranties').insert([dbRow]);
    if (error) throw error;
  },

  updateWarrantyTicket: async (t: WarrantyTicket) => {
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
      updated_at: t.updatedAt
    };
    const { error } = await supabase.from('warranties').update(dbRow).eq('id', t.id);
    if (error) throw error;
  },

  deleteWarrantyTicket: async (id: string) => {
    const { error } = await supabase.from('warranties').delete().eq('id', id);
    if (error) throw error;
  }
};