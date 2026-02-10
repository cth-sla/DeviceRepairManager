-- BẠN HÃY COPY TOÀN BỘ NỘI DUNG DƯỚI ĐÂY VÀ CHẠY TRONG SQL EDITOR CỦA SUPABASE --

-- 1. Bật extension để tạo UUID tự động (nếu cần thiết trong tương lai, hiện tại code client tạo UUID)
create extension if not exists "uuid-ossp";

-- 2. Tạo bảng Đơn vị (Organizations)
create table if not exists public.organizations (
    id uuid primary key,
    name text not null,
    address text,
    created_at bigint
);

-- 3. Tạo bảng Khách hàng (Customers)
create table if not exists public.customers (
    id uuid primary key,
    full_name text not null,
    organization_id uuid references public.organizations(id),
    phone text,
    address text,
    created_at bigint
);

-- 4. Tạo bảng Phiếu Sửa chữa (Repair Tickets)
create table if not exists public.tickets (
    id uuid primary key,
    customer_id uuid references public.customers(id),
    device_type text,
    serial_number text,
    device_condition text,
    receive_date text, -- Lưu dạng chuỗi YYYY-MM-DD
    status text,
    return_date text,
    return_note text,
    shipping_method text,
    created_at bigint, -- Lưu timestamp dạng số (Date.now())
    updated_at bigint
);

-- 5. Tạo bảng Phiếu Bảo hành/Gửi hãng (Warranty Tickets)
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

-- 6. Thiết lập Row Level Security (RLS)
-- Cho phép đọc/ghi dữ liệu nếu người dùng đã đăng nhập (authenticated)
-- Nếu bạn muốn test nhanh mà không cần login, có thể tắt RLS bằng lệnh: alter table tableName disable row level security;

alter table public.organizations enable row level security;
alter table public.customers enable row level security;
alter table public.tickets enable row level security;
alter table public.warranties enable row level security;

-- Tạo Policy cho phép xem/thêm/sửa/xóa với người dùng đã đăng nhập
create policy "Enable all access for authenticated users" on public.organizations for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.customers for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.tickets for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.warranties for all using (auth.role() = 'authenticated');

-- (Tùy chọn) Policy cho phép truy cập công khai (nếu không cần đăng nhập - KHÔNG KHUYẾN KHÍCH)
-- create policy "Public Access" on public.organizations for all using (true);
