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
    organization_id uuid references public.organizations(id) on delete cascade,
    phone text,
    address text,
    created_at bigint
);

-- 4. Tạo hoặc Cập nhật bảng Phiếu Sửa chữa (Tickets)
create table if not exists public.tickets (
    id uuid primary key,
    customer_id uuid references public.customers(id) on delete cascade,
    device_type text,
    serial_number text,
    device_condition text,
    receive_date text,
    status text,
    return_date text,
    return_note text,
    created_at bigint,
    updated_at bigint
);

-- Đảm bảo có cột mới trong tickets
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='tickets' and column_name='shipping_method') then
        alter table public.tickets add column shipping_method text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='tickets' and column_name='tracking_number') then
        alter table public.tickets add column tracking_number text;
    end if;
end $$;

-- 5. Tạo hoặc Cập nhật bảng Phiếu Bảo hành (Warranties)
create table if not exists public.warranties (
    id uuid primary key,
    organization_id uuid references public.organizations(id) on delete cascade,
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

-- Đảm bảo có cột mới trong warranties
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='warranties' and column_name='shipping_method') then
        alter table public.warranties add column shipping_method text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='warranties' and column_name='tracking_number') then
        alter table public.warranties add column tracking_number text;
    end if;
end $$;

-- 6. THIẾT LẬP LẠI QUYỀN TRUY CẬP (RLS)
alter table public.organizations enable row level security;
alter table public.customers enable row level security;
alter table public.tickets enable row level security;
alter table public.warranties enable row level security;

-- Xóa chính sách cũ để tránh trùng lặp
drop policy if exists "Enable all access for authenticated users" on public.organizations;
drop policy if exists "Enable all access for authenticated users" on public.customers;
drop policy if exists "Enable all access for authenticated users" on public.tickets;
drop policy if exists "Enable all access for authenticated users" on public.warranties;

-- Tạo chính sách mới cho phép truy cập toàn quyền khi đã đăng nhập
create policy "Enable all access for authenticated users" on public.organizations for all using (true);
create policy "Enable all access for authenticated users" on public.customers for all using (true);
create policy "Enable all access for authenticated users" on public.tickets for all using (true);
create policy "Enable all access for authenticated users" on public.warranties for all using (true);