| table_name     | column_name      | data_type                  | is_nullable | column_default      |
|----------------|------------------|----------------------------|-------------|---------------------|
| field_aliases | id               | uuid                        | NO          | gen_random_uuid()
| field_aliases | organization_id  | uuid                        | NO          | 
| field_aliases | table_name       | character varying           | NO          | 
| field_aliases | field_name       | character varying           | NO          | 
| field_aliases | display_name     | character varying           | NO          | 
| field_aliases | description      | text                        | YES         | 
| field_aliases | is_hidden        | boolean                     | NO          | false
| field_aliases | sort_order       | bigint                      | NO          | 0
| field_aliases | created_at       | timestamp without time zone | NO          | now()
| field_aliases | updated_at       | timestamp without time zone | NO          | now()
| inventory     | id               | uuid                        | NO          | gen_random_uuid()
| inventory     | organization_id  | uuid                        | NO          | 
| inventory     | sku_id           | uuid                        | NO          | 
| inventory     | quantity         | bigint                      | NO          | 0
| inventory     | weighted_cost    | numeric                     | NO          | 0.0
| inventory     | total_value      | numeric                     | NO          | 0.0
| inventory     | is_manual_cost   | boolean                     | NO          | false
| inventory     | created_at       | timestamp with time zone    | NO          | now()
| inventory     | updated_at       | timestamp with time zone    | NO          | now()
| organizations | id               | uuid                        | NO          | gen_random_uuid()
| organizations | name             | text                        | NO          | 
| organizations | created_at       | timestamp with time zone    | NO          | now()
| organizations | updated_at       | timestamp with time zone    | NO          | now()
| skus          | id               | uuid                        | NO          | gen_random_uuid()
| skus          | organization_id  | uuid                        | NO          | 
| skus          | sku_code         | character varying           | NO          | 
| skus          | product_name     | character varying           | NO          | 
| skus          | description      | text                        | YES         | 
| skus          | category         | character varying           | YES         | 
| skus          | supplier         | character varying           | YES         | 
| skus          | barcode          | character varying           | YES         | 
| skus          | is_active        | boolean                     | NO          | true
| skus          | created_at       | timestamp with time zone    | NO          | now()
| skus          | updated_at       | timestamp with time zone    | NO          | now()
| transactions  | id               | uuid                        | NO          | gen_random_uuid()
| transactions  | organization_id  | uuid                        | NO          | 
| transactions  | sku_id           | uuid                        | NO          | 
| transactions  | transaction_type | character varying           | NO          | 
| transactions  | quantity         | bigint                      | NO          | 
| transactions  | unit_cost        | numeric                     | NO          | 0.0
| transactions  | total_cost       | numeric                     | NO          | 0.0
| transactions  | reference_number | character varying           | YES         | 
| transactions  | notes            | text                        | YES         | 
| transactions  | created_by       | uuid                        | NO          | 
| transactions  | created_at       | timestamp with time zone    | NO          | now()
| transactions  | updated_at       | timestamp with time zone    | NO          | now()
| users         | id               | uuid                        | NO          | gen_random_uuid()
| users         | organization_id  | uuid                        | NO          | 
| users         | email            | text                        | NO          | 
| users         | name             | text                        | NO          | 
| users         | role             | text                        | NO          | 'member'
| users         | is_active        | boolean                     | NO          | true
| users         | last_login_at    | timestamp with time zone    | YES         | 
| users         | created_at       | timestamp with time zone    | NO          | now()
| users         | updated_at       | timestamp with time zone    | NO          | now()
