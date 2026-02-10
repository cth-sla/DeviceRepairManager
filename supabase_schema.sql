
-- BẠN HÃY COPY TOÀN BỘ NỘI DUNG DƯỚI ĐÂY VÀ CHẠY TRONG SQL EDITOR CỦA SUPABASE --

-- 1. Bật extension
create extension if not exists "uuid-ossp";

-- 2. Tạo hoặc Cập nhật bảng Đơn vị (Organizations)
create table if not exists public.organizations (
    id uuid primary key,
    name text not null,
    address text,
    created_at bigint
);

-- 3. Tạo hoặc Cập nhật bảng Khách hàng (Customers)
create table if not exists public.customers (
    id uuid primary key,
    full_name text not null,
    organization_id uuid references public.organizations(id),
    phone text,
    address text,
    created_at bigint
);

-- 4. Tạo hoặc Cập nhật bảng Phiếu Sửa chữa (Tickets)
create table if not exists public.tickets (
    id uuid primary key,
    customer_id uuid references public.customers(id),
    device_type text,
    serial_number text,
    device_condition text,
    receive_date text,
    status text,
    return_date text,
    return_note text,
    shipping_method text,
    created_at bigint,
    updated_at bigint
);

-- 5. Tạo hoặc Cập nhật bảng Phiếu Bảo hành (Warranties)
create table if not exists public.warranties (
    id uuid primary key,
    organization_id uuid references public.organizations(id),
    device_type text,
    serial_number text,
    description text,
    sent_date text,
    status text,
    return_date text,
    cost numeric,
    note text,
    created_at bigint,
    updated_at bigint
);

-- 6. CẬP NHẬT RÀNG BUỘC CASCADE (Để xóa được cha thì con tự động mất)
-- Thao tác này an toàn ngay cả khi bảng đã có dữ liệu
do $$
begin
    -- Cập nhật bảng customers
    alter table public.customers drop constraint if exists customers_organization_id_fkey;
    alter table public.customers add constraint customers_organization_id_fkey 
        foreign key (organization_id) references public.organizations(id) on delete cascade;

    -- Cập nhật bảng tickets
    alter table public.tickets drop constraint if exists tickets_customer_id_fkey;
    alter table public.tickets add constraint tickets_customer_id_fkey 
        foreign key (customer_id) references public.customers(id) on delete cascade;

    -- Cập nhật bảng warranties
    alter table public.warranties drop constraint if exists warranties_organization_id_fkey;
    alter table public.warranties add constraint warranties_organization_id_fkey 
        foreign key (organization_id) references public.organizations(id) on delete cascade;
end $$;

-- 7. THIẾT LẬP LẠI QUYỀN TRUY CẬP (RLS)
alter table public.organizations enable row level security;
alter table public.customers enable row level security;
alter table public.tickets enable row level security;
alter table public.warranties enable row level security;

-- Xóa chính sách cũ nếu tồn tại để tránh lỗi 42710
drop policy if exists "Enable all access for authenticated users" on public.organizations;
drop policy if exists "Enable all access for authenticated users" on public.customers;
drop policy if exists "Enable all access for authenticated users" on public.tickets;
drop policy if exists "Enable all access for authenticated users" on public.warranties;

-- Tạo chính sách mới
create policy "Enable all access for authenticated users" on public.organizations for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.customers for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.tickets for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.warranties for all using (auth.role() = 'authenticated');
