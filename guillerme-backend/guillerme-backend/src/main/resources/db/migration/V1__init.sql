-- USERS
create table users (
  id bigserial primary key,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  role varchar(20) not null,
  created_at timestamptz not null default now()
);

-- PRODUCTS
create table products (
  id bigserial primary key,
  nombre varchar(200) not null,
  descripcion_corta varchar(400),
  info_modal text,
  img_url text,
  categorias text, -- simple (csv o json string). En MVP lo dejamos así.
  servicios text,
  keywords text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STOCK (1:1 con product)
create table stock (
  product_id bigint primary key references products(id) on delete cascade,
  stock int not null default 0,
  updated_at timestamptz not null default now()
);

-- CART
create table carts (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  status varchar(20) not null,
  updated_at timestamptz not null default now()
);

create index idx_carts_user_status on carts(user_id, status);

-- CART ITEMS
create table cart_items (
  id bigserial primary key,
  cart_id bigint not null references carts(id) on delete cascade,
  product_id bigint not null references products(id),
  qty int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_cart_product unique (cart_id, product_id)
);
