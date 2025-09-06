-- DROP SCHEMA curio;

CREATE SCHEMA curio AUTHORIZATION yugabyte;

-- DROP SEQUENCE alerts_id_seq;

CREATE SEQUENCE alerts_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE alerts_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE alerts_id_seq TO yugabyte;

-- DROP SEQUENCE balance_manager_addresses_id_seq;

CREATE SEQUENCE balance_manager_addresses_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE balance_manager_addresses_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE balance_manager_addresses_id_seq TO yugabyte;

-- DROP SEQUENCE base_id_seq;

CREATE SEQUENCE base_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE base_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE base_id_seq TO yugabyte;

-- DROP SEQUENCE harmony_config_id_seq;

CREATE SEQUENCE harmony_config_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE harmony_config_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE harmony_config_id_seq TO yugabyte;

-- DROP SEQUENCE harmony_machine_details_id_seq;

CREATE SEQUENCE harmony_machine_details_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE harmony_machine_details_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE harmony_machine_details_id_seq TO yugabyte;

-- DROP SEQUENCE harmony_machines_id_seq;

CREATE SEQUENCE harmony_machines_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE harmony_machines_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE harmony_machines_id_seq TO yugabyte;

-- DROP SEQUENCE harmony_task_follow_id_seq;

CREATE SEQUENCE harmony_task_follow_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE harmony_task_follow_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE harmony_task_follow_id_seq TO yugabyte;

-- DROP SEQUENCE harmony_task_history_id_seq;

CREATE SEQUENCE harmony_task_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE harmony_task_history_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE harmony_task_history_id_seq TO yugabyte;

-- DROP SEQUENCE harmony_task_id_seq;

CREATE SEQUENCE harmony_task_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE harmony_task_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE harmony_task_id_seq TO yugabyte;

-- DROP SEQUENCE harmony_task_impl_id_seq;

CREATE SEQUENCE harmony_task_impl_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE harmony_task_impl_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE harmony_task_impl_id_seq TO yugabyte;

-- DROP SEQUENCE ipni_order_number_seq;

CREATE SEQUENCE ipni_order_number_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE ipni_order_number_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE ipni_order_number_seq TO yugabyte;

-- DROP SEQUENCE itest_scratch_id_seq;

CREATE SEQUENCE itest_scratch_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE itest_scratch_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE itest_scratch_id_seq TO yugabyte;

-- DROP SEQUENCE message_sends_eth_send_task_id_seq;

CREATE SEQUENCE message_sends_eth_send_task_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE message_sends_eth_send_task_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE message_sends_eth_send_task_id_seq TO yugabyte;

-- DROP SEQUENCE mining_base_block_id_seq;

CREATE SEQUENCE mining_base_block_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE mining_base_block_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE mining_base_block_id_seq TO yugabyte;

-- DROP SEQUENCE parked_piece_refs_ref_id_seq;

CREATE SEQUENCE parked_piece_refs_ref_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE parked_piece_refs_ref_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE parked_piece_refs_ref_id_seq TO yugabyte;

-- DROP SEQUENCE parked_pieces_id_seq;

CREATE SEQUENCE parked_pieces_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE parked_pieces_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE parked_pieces_id_seq TO yugabyte;

-- DROP SEQUENCE pdp_piecerefs_id_seq;

CREATE SEQUENCE pdp_piecerefs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE pdp_piecerefs_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE pdp_piecerefs_id_seq TO yugabyte;

-- DROP SEQUENCE pdp_services_id_seq;

CREATE SEQUENCE pdp_services_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE pdp_services_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE pdp_services_id_seq TO yugabyte;

-- DROP SEQUENCE scrub_unseal_commd_check_check_id_seq;

CREATE SEQUENCE scrub_unseal_commd_check_check_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 100
	NO CYCLE;

-- Permissions

ALTER SEQUENCE scrub_unseal_commd_check_check_id_seq OWNER TO yugabyte;
GRANT ALL ON SEQUENCE scrub_unseal_commd_check_check_id_seq TO yugabyte;
-- curio.alerts definition

-- Drop table

-- DROP TABLE alerts;

CREATE TABLE alerts ( id serial4 NOT NULL, machine_name varchar(255) NOT NULL, message text NOT NULL, CONSTRAINT alerts_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE alerts OWNER TO yugabyte;
GRANT ALL ON TABLE alerts TO yugabyte;


-- curio.autocert_cache definition

-- Drop table

-- DROP TABLE autocert_cache;

CREATE TABLE autocert_cache ( k text NOT NULL, v bytea NOT NULL, CONSTRAINT autocert_cache_pkey PRIMARY KEY (k));

-- Permissions

ALTER TABLE autocert_cache OWNER TO yugabyte;
GRANT ALL ON TABLE autocert_cache TO yugabyte;


-- curio.balance_manager_addresses definition

-- Drop table

-- DROP TABLE balance_manager_addresses;

CREATE TABLE balance_manager_addresses ( id serial4 NOT NULL, subject_address text NOT NULL, second_address text NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, last_action timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, action_type text NOT NULL, low_watermark_fil_balance text DEFAULT '0'::text NOT NULL, high_watermark_fil_balance text DEFAULT '0'::text NOT NULL, active_task_id int8 NULL, last_msg_cid text NULL, last_msg_sent_at timestamp NULL, last_msg_landed_at timestamp NULL, subject_type text DEFAULT 'wallet'::text NOT NULL, CONSTRAINT balance_manager_addresses_pkey PRIMARY KEY (id), CONSTRAINT balance_manager_addresses_subject_address_second_address_unique UNIQUE (subject_address, second_address, action_type), CONSTRAINT subject_not_equal_second CHECK (((subject_type = 'proofshare'::text) OR (subject_address <> second_address))));
CREATE INDEX balance_manager_addresses_last_msg_cid_idx ON curio.balance_manager_addresses USING lsm (last_msg_cid HASH);

-- Permissions

ALTER TABLE balance_manager_addresses OWNER TO yugabyte;
GRANT ALL ON TABLE balance_manager_addresses TO yugabyte;


-- curio.base definition

-- Drop table

-- DROP TABLE base;

CREATE TABLE base ( id serial4 NOT NULL, entry bpchar(12) NULL, applied timestamp DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT base_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE base OWNER TO yugabyte;
GRANT ALL ON TABLE base TO yugabyte;


-- curio.eth_keys definition

-- Drop table

-- DROP TABLE eth_keys;

CREATE TABLE eth_keys ( address text NOT NULL, private_key bytea NOT NULL, "role" text NOT NULL, CONSTRAINT eth_keys_pkey PRIMARY KEY (address));

-- Permissions

ALTER TABLE eth_keys OWNER TO yugabyte;
GRANT ALL ON TABLE eth_keys TO yugabyte;


-- curio.harmony_config definition

-- Drop table

-- DROP TABLE harmony_config;

CREATE TABLE harmony_config ( id serial4 NOT NULL, title varchar(300) NOT NULL, config text NOT NULL, CONSTRAINT harmony_config_pkey PRIMARY KEY (id), CONSTRAINT harmony_config_title_key UNIQUE (title));

-- Permissions

ALTER TABLE harmony_config OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_config TO yugabyte;


-- curio.harmony_machines definition

-- Drop table

-- DROP TABLE harmony_machines;

CREATE TABLE harmony_machines ( id serial4 NOT NULL, last_contact timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, host_and_port varchar(300) NOT NULL, cpu int4 NOT NULL, ram int8 NOT NULL, gpu float8 NOT NULL, unschedulable bool DEFAULT false NULL, restart_request timestamptz NULL, CONSTRAINT harmony_machines_pkey PRIMARY KEY (id));
CREATE INDEX idx_harmony_machines_unschedulable ON curio.harmony_machines USING lsm (unschedulable HASH);

-- Permissions

ALTER TABLE harmony_machines OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_machines TO yugabyte;


-- curio.harmony_task_history definition

-- Drop table

-- DROP TABLE harmony_task_history;

CREATE TABLE harmony_task_history ( id serial4 NOT NULL, task_id int4 NOT NULL, "name" varchar(16) NOT NULL, posted timestamptz NOT NULL, work_start timestamptz NOT NULL, work_end timestamptz NOT NULL, "result" bool NOT NULL, err varchar NULL, completed_by_host_and_port varchar(300) NOT NULL, CONSTRAINT harmony_task_history_pkey PRIMARY KEY (id));
CREATE INDEX harmony_task_history_task_id_result_index ON curio.harmony_task_history USING lsm (task_id HASH, result ASC);
CREATE INDEX harmony_task_history_work_index ON curio.harmony_task_history USING lsm (work_end DESC, completed_by_host_and_port ASC, name ASC, result ASC);

-- Column comments

COMMENT ON COLUMN curio.harmony_task_history."result" IS 'Use to detemine if this was a successful run.';

-- Permissions

ALTER TABLE harmony_task_history OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_task_history TO yugabyte;


-- curio.harmony_test definition

-- Drop table

-- DROP TABLE harmony_test;

CREATE TABLE harmony_test ( task_id int8 NOT NULL, "options" text NULL, "result" text NULL, CONSTRAINT harmony_test_pk PRIMARY KEY (task_id));

-- Permissions

ALTER TABLE harmony_test OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_test TO yugabyte;


-- curio.ipni definition

-- Drop table

-- DROP TABLE ipni;

CREATE TABLE ipni ( order_number bigserial NOT NULL, ad_cid text NOT NULL, context_id bytea NOT NULL, is_rm bool NOT NULL, previous text NULL, provider text NOT NULL, addresses text NOT NULL, signature bytea NOT NULL, entries text NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, is_skip bool DEFAULT false NOT NULL, CONSTRAINT ipni_ad_cid_key UNIQUE (ad_cid), CONSTRAINT ipni_pkey PRIMARY KEY (order_number));
CREATE UNIQUE INDEX ipni_ad_cid ON curio.ipni USING lsm (ad_cid HASH);
CREATE INDEX ipni_context_id ON curio.ipni USING lsm (context_id HASH, ad_cid ASC, is_rm ASC, is_skip ASC);
CREATE INDEX ipni_entries_skip ON curio.ipni USING lsm (entries HASH, is_skip ASC, piece_cid ASC);
CREATE INDEX ipni_provider_ad_cid ON curio.ipni USING lsm (provider HASH, ad_cid ASC);
CREATE INDEX ipni_provider_order_number ON curio.ipni USING lsm (provider HASH, order_number ASC);

-- Table Triggers

create trigger trigger_update_piece_summary_ipni after
insert
    or
update
    on
    curio.ipni for each row execute procedure curio.update_piece_summary();

-- Permissions

ALTER TABLE ipni OWNER TO yugabyte;
GRANT ALL ON TABLE ipni TO yugabyte;


-- curio.ipni_chunks definition

-- Drop table

-- DROP TABLE ipni_chunks;

CREATE TABLE ipni_chunks ( cid text NOT NULL, piece_cid text NOT NULL, chunk_num int4 NOT NULL, first_cid text NULL, start_offset int8 NULL, num_blocks int8 NOT NULL, from_car bool NOT NULL, CONSTRAINT ipni_chunks_check CHECK ((((from_car = false) AND (first_cid IS NOT NULL) AND (start_offset IS NULL)) OR ((from_car = true) AND (first_cid IS NULL) AND (start_offset IS NOT NULL)))), CONSTRAINT ipni_chunks_piece_cid_chunk_num_key UNIQUE (piece_cid, chunk_num), CONSTRAINT ipni_chunks_pkey PRIMARY KEY (cid));

-- Permissions

ALTER TABLE ipni_chunks OWNER TO yugabyte;
GRANT ALL ON TABLE ipni_chunks TO yugabyte;


-- curio.ipni_peerid definition

-- Drop table

-- DROP TABLE ipni_peerid;

CREATE TABLE ipni_peerid ( priv_key bytea NOT NULL, peer_id text NOT NULL, sp_id int8 NOT NULL, CONSTRAINT ipni_peerid_peer_id_key UNIQUE (peer_id), CONSTRAINT ipni_peerid_pkey PRIMARY KEY (priv_key), CONSTRAINT ipni_peerid_sp_id_key UNIQUE (sp_id));

-- Permissions

ALTER TABLE ipni_peerid OWNER TO yugabyte;
GRANT ALL ON TABLE ipni_peerid TO yugabyte;


-- curio.ipni_task definition

-- Drop table

-- DROP TABLE ipni_task;

CREATE TABLE ipni_task ( sp_id int8 NOT NULL, sector int8 NOT NULL, reg_seal_proof int4 NOT NULL, sector_offset int8 NULL, context_id bytea NOT NULL, is_rm bool NOT NULL, provider text NOT NULL, created_at timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, task_id int8 NULL, complete bool DEFAULT false NULL, CONSTRAINT ipni_task_pkey PRIMARY KEY (provider, context_id, is_rm));

-- Permissions

ALTER TABLE ipni_task OWNER TO yugabyte;
GRANT ALL ON TABLE ipni_task TO yugabyte;


-- curio.itest_scratch definition

-- Drop table

-- DROP TABLE itest_scratch;

CREATE TABLE itest_scratch ( id serial4 NOT NULL, "content" text NULL, some_int int4 NULL, second_int int4 NULL, update_time timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT itest_scratch_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE itest_scratch OWNER TO yugabyte;
GRANT ALL ON TABLE itest_scratch TO yugabyte;


-- curio.libp2p definition

-- Drop table

-- DROP TABLE libp2p;

CREATE TABLE libp2p ( priv_key bytea NOT NULL, peer_id text NOT NULL, running_on text NULL, local_listen text NULL, updated_at timestamptz NULL, singleton bool DEFAULT true NULL, CONSTRAINT libp2p_peer_id_key UNIQUE (peer_id), CONSTRAINT libp2p_pkey PRIMARY KEY (priv_key), CONSTRAINT libp2p_singleton_check CHECK ((singleton = true)), CONSTRAINT libp2p_singleton_key UNIQUE (singleton));

-- Permissions

ALTER TABLE libp2p OWNER TO yugabyte;
GRANT ALL ON TABLE libp2p TO yugabyte;


-- curio.market_allow_list definition

-- Drop table

-- DROP TABLE market_allow_list;

CREATE TABLE market_allow_list ( wallet text NOT NULL, status bool NOT NULL, CONSTRAINT market_allow_list_pkey PRIMARY KEY (wallet));

-- Permissions

ALTER TABLE market_allow_list OWNER TO yugabyte;
GRANT ALL ON TABLE market_allow_list TO yugabyte;


-- curio.market_direct_deals definition

-- Drop table

-- DROP TABLE market_direct_deals;

CREATE TABLE market_direct_deals ( "uuid" text NOT NULL, sp_id int8 NOT NULL, created_at timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, client text NOT NULL, offline bool NOT NULL, verified bool NOT NULL, start_epoch int8 NOT NULL, end_epoch int8 NOT NULL, allocation_id int8 NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, fast_retrieval bool NOT NULL, announce_to_ipni bool NOT NULL, error text NULL, CONSTRAINT market_direct_deals_uuid_key UNIQUE (uuid));

-- Table Triggers

create trigger check_duplicate_successful_mk12ddo_deals before
insert
    on
    curio.market_direct_deals for each row execute procedure curio.prevent_duplicate_successful_mk12ddo_deals();

-- Permissions

ALTER TABLE market_direct_deals OWNER TO yugabyte;
GRANT ALL ON TABLE market_direct_deals TO yugabyte;


-- curio.market_legacy_deals definition

-- Drop table

-- DROP TABLE market_legacy_deals;

CREATE TABLE market_legacy_deals ( signed_proposal_cid text NOT NULL, sp_id int8 NOT NULL, client_peer_id text NOT NULL, proposal_signature bytea NOT NULL, proposal jsonb NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, verified bool NOT NULL, start_epoch int8 NOT NULL, end_epoch int8 NOT NULL, publish_cid text NOT NULL, chain_deal_id int8 NOT NULL, fast_retrieval bool NOT NULL, created_at timestamptz NOT NULL, sector_num int8 NOT NULL, CONSTRAINT market_legacy_deals_pkey PRIMARY KEY (sp_id, piece_cid, signed_proposal_cid));

-- Permissions

ALTER TABLE market_legacy_deals OWNER TO yugabyte;
GRANT ALL ON TABLE market_legacy_deals TO yugabyte;


-- curio.market_mk12_client_filters definition

-- Drop table

-- DROP TABLE market_mk12_client_filters;

CREATE TABLE market_mk12_client_filters ( "name" text NOT NULL, active bool DEFAULT false NOT NULL, wallets _text NULL, peer_ids _text NULL, pricing_filters _text NULL, max_deals_per_hour int8 DEFAULT 0 NOT NULL, max_deal_size_per_hour int8 DEFAULT 0 NOT NULL, additional_info text DEFAULT ''::text NOT NULL, CONSTRAINT market_mk12_client_filters_pkey PRIMARY KEY (name));

-- Table Triggers

create trigger unique_wallets_trigger before
insert
    or
update
    on
    curio.market_mk12_client_filters for each row execute procedure curio.enforce_unique_wallets();
create trigger unique_peers_trigger before
insert
    or
update
    on
    curio.market_mk12_client_filters for each row execute procedure curio.enforce_unique_peers();
create trigger unique_pricing_filters_trigger before
insert
    or
update
    on
    curio.market_mk12_client_filters for each row execute procedure curio.enforce_unique_pricing_filters();
create trigger enforce_name_convention_market_mk12_client_filters before
insert
    or
update
    on
    curio.market_mk12_client_filters for each row execute procedure curio.enforce_name_naming_convention();

-- Permissions

ALTER TABLE market_mk12_client_filters OWNER TO yugabyte;
GRANT ALL ON TABLE market_mk12_client_filters TO yugabyte;


-- curio.market_mk12_deal_pipeline definition

-- Drop table

-- DROP TABLE market_mk12_deal_pipeline;

CREATE TABLE market_mk12_deal_pipeline ( "uuid" text NOT NULL, sp_id int8 NOT NULL, started bool DEFAULT false NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, raw_size int8 NULL, offline bool NOT NULL, url text NULL, headers jsonb DEFAULT '{}'::jsonb NOT NULL, commp_task_id int8 NULL, after_commp bool DEFAULT false NULL, psd_task_id int8 NULL, after_psd bool DEFAULT false NULL, psd_wait_time timestamptz NULL, find_deal_task_id int8 NULL, after_find_deal bool DEFAULT false NULL, sector int8 NULL, reg_seal_proof int4 NULL, sector_offset int8 NULL, sealed bool DEFAULT false NULL, should_index bool DEFAULT false NULL, indexing_created_at timestamptz NULL, indexing_task_id int8 NULL, indexed bool DEFAULT false NULL, announce bool DEFAULT false NULL, complete bool DEFAULT false NOT NULL, created_at timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, is_ddo bool DEFAULT false NOT NULL, CONSTRAINT market_mk12_deal_pipeline_identity_key UNIQUE (uuid));

-- Permissions

ALTER TABLE market_mk12_deal_pipeline OWNER TO yugabyte;
GRANT ALL ON TABLE market_mk12_deal_pipeline TO yugabyte;


-- curio.market_mk12_deal_pipeline_migration definition

-- Drop table

-- DROP TABLE market_mk12_deal_pipeline_migration;

CREATE TABLE market_mk12_deal_pipeline_migration ( "uuid" text NOT NULL, sp_id int8 NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, raw_size int8 NULL, sector int8 NULL, reg_seal_proof int4 NULL, sector_offset int8 NULL, should_announce bool NOT NULL, CONSTRAINT market_mk12_deal_pipeline_migration_pkey PRIMARY KEY (uuid));

-- Permissions

ALTER TABLE market_mk12_deal_pipeline_migration OWNER TO yugabyte;
GRANT ALL ON TABLE market_mk12_deal_pipeline_migration TO yugabyte;


-- curio.market_mk12_deals definition

-- Drop table

-- DROP TABLE market_mk12_deals;

CREATE TABLE market_mk12_deals ( "uuid" text NOT NULL, sp_id int8 NOT NULL, created_at timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, signed_proposal_cid text NOT NULL, proposal_signature bytea NOT NULL, proposal jsonb NOT NULL, offline bool NOT NULL, verified bool NOT NULL, start_epoch int8 NOT NULL, end_epoch int8 NOT NULL, client_peer_id text NOT NULL, chain_deal_id int8 NULL, publish_cid text NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, fast_retrieval bool NOT NULL, announce_to_ipni bool NOT NULL, url text NULL, url_headers jsonb DEFAULT '{}'::jsonb NOT NULL, error text NULL, "label" bytea NULL, proposal_cid text NOT NULL, CONSTRAINT market_mk12_deals_pkey PRIMARY KEY (uuid, sp_id, piece_cid, signed_proposal_cid), CONSTRAINT market_mk12_deals_signed_proposal_cid_key UNIQUE (signed_proposal_cid), CONSTRAINT market_mk12_deals_uuid_key UNIQUE (uuid));
CREATE INDEX market_mk12_deals_proposal_cid_index ON curio.market_mk12_deals USING lsm (proposal_cid HASH);

-- Permissions

ALTER TABLE market_mk12_deals OWNER TO yugabyte;
GRANT ALL ON TABLE market_mk12_deals TO yugabyte;


-- curio.market_mk12_pricing_filters definition

-- Drop table

-- DROP TABLE market_mk12_pricing_filters;

CREATE TABLE market_mk12_pricing_filters ( "name" text NOT NULL, min_duration_days int4 DEFAULT 180 NOT NULL, max_duration_days int4 DEFAULT 1278 NOT NULL, min_size int8 DEFAULT 256 NOT NULL, max_size int8 DEFAULT '34359738368'::bigint NOT NULL, price int8 DEFAULT '11302806713'::bigint NOT NULL, verified bool DEFAULT false NOT NULL, CONSTRAINT market_mk12_pricing_filters_pkey PRIMARY KEY (name));

-- Table Triggers

create trigger enforce_name_convention_market_mk12_pricing_filters before
insert
    or
update
    on
    curio.market_mk12_pricing_filters for each row execute procedure curio.enforce_name_naming_convention();

-- Permissions

ALTER TABLE market_mk12_pricing_filters OWNER TO yugabyte;
GRANT ALL ON TABLE market_mk12_pricing_filters TO yugabyte;


-- curio.market_mk12_storage_ask definition

-- Drop table

-- DROP TABLE market_mk12_storage_ask;

CREATE TABLE market_mk12_storage_ask ( sp_id int8 NOT NULL, price int8 NOT NULL, verified_price int8 NOT NULL, min_size int8 NOT NULL, max_size int8 NOT NULL, created_at int8 NOT NULL, expiry int8 NOT NULL, "sequence" int8 NOT NULL, CONSTRAINT market_mk12_storage_ask_sp_id_key UNIQUE (sp_id));

-- Permissions

ALTER TABLE market_mk12_storage_ask OWNER TO yugabyte;
GRANT ALL ON TABLE market_mk12_storage_ask TO yugabyte;


-- curio.market_piece_deal definition

-- Drop table

-- DROP TABLE market_piece_deal;

CREATE TABLE market_piece_deal ( id text NOT NULL, piece_cid text NOT NULL, boost_deal bool NOT NULL, legacy_deal bool DEFAULT false NOT NULL, chain_deal_id int8 DEFAULT 0 NOT NULL, sp_id int8 NOT NULL, sector_num int8 NOT NULL, piece_offset int8 NOT NULL, piece_length int8 NOT NULL, raw_size int8 NOT NULL, CONSTRAINT market_piece_deal_identity_key UNIQUE (sp_id, id), CONSTRAINT market_piece_deal_pkey PRIMARY KEY (sp_id, piece_cid, id));
CREATE UNIQUE INDEX market_piece_deal_piece_cid_id_uindex ON curio.market_piece_deal USING lsm (piece_cid HASH, id ASC);

-- Permissions

ALTER TABLE market_piece_deal OWNER TO yugabyte;
GRANT ALL ON TABLE market_piece_deal TO yugabyte;


-- curio.market_piece_metadata definition

-- Drop table

-- DROP TABLE market_piece_metadata;

CREATE TABLE market_piece_metadata ( piece_cid text NOT NULL, piece_size int8 NOT NULL, "version" int4 DEFAULT 2 NOT NULL, created_at timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, indexed bool DEFAULT false NOT NULL, indexed_at timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, CONSTRAINT market_piece_meta_identity_key UNIQUE (piece_cid, piece_size), CONSTRAINT market_piece_metadata_pkey PRIMARY KEY (piece_cid));

-- Table Triggers

create trigger trigger_update_piece_summary after
insert
    or
update
    on
    curio.market_piece_metadata for each row execute procedure curio.update_piece_summary();

-- Permissions

ALTER TABLE market_piece_metadata OWNER TO yugabyte;
GRANT ALL ON TABLE market_piece_metadata TO yugabyte;


-- curio.message_send_eth_locks definition

-- Drop table

-- DROP TABLE message_send_eth_locks;

CREATE TABLE message_send_eth_locks ( from_address text NOT NULL, task_id int8 NOT NULL, claimed_at timestamp NOT NULL, CONSTRAINT message_send_eth_locks_pk PRIMARY KEY (from_address));

-- Permissions

ALTER TABLE message_send_eth_locks OWNER TO yugabyte;
GRANT ALL ON TABLE message_send_eth_locks TO yugabyte;


-- curio.message_send_locks definition

-- Drop table

-- DROP TABLE message_send_locks;

CREATE TABLE message_send_locks ( from_key text NOT NULL, task_id int8 NOT NULL, claimed_at timestamptz NOT NULL, CONSTRAINT message_send_locks_pk PRIMARY KEY (from_key));

-- Permissions

ALTER TABLE message_send_locks OWNER TO yugabyte;
GRANT ALL ON TABLE message_send_locks TO yugabyte;


-- curio.message_sends definition

-- Drop table

-- DROP TABLE message_sends;

CREATE TABLE message_sends ( from_key text NOT NULL, to_addr text NOT NULL, send_reason text NOT NULL, send_task_id int8 NOT NULL, unsigned_data bytea NOT NULL, unsigned_cid text NOT NULL, nonce int8 NULL, signed_data bytea NULL, signed_json jsonb NULL, signed_cid text NULL, send_time timestamptz NULL, send_success bool NULL, send_error text NULL, CONSTRAINT message_sends_pk PRIMARY KEY (send_task_id, from_key));
CREATE INDEX message_sends_signed_cid_index ON curio.message_sends USING lsm (signed_cid HASH);
CREATE UNIQUE INDEX message_sends_success_index ON curio.message_sends USING lsm (from_key HASH, nonce ASC) WHERE (send_success IS NOT FALSE);
COMMENT ON INDEX curio.message_sends_success_index IS 'message_sends_success_index enforces sender/nonce uniqueness, it is a conditional index that only indexes rows where send_success is not false. This allows us to have multiple rows with the same sender/nonce, as long as only one of them was successfully broadcasted (true) to the network or is in the process of being broadcasted (null).';

-- Column comments

COMMENT ON COLUMN curio.message_sends.from_key IS 'text f[1/3/4]... address';
COMMENT ON COLUMN curio.message_sends.to_addr IS 'text f[0/1/2/3/4]... address';
COMMENT ON COLUMN curio.message_sends.send_reason IS 'optional description of send reason';
COMMENT ON COLUMN curio.message_sends.send_task_id IS 'harmony task id of the send task';
COMMENT ON COLUMN curio.message_sends.unsigned_data IS 'unsigned message data';
COMMENT ON COLUMN curio.message_sends.unsigned_cid IS 'unsigned message cid';
COMMENT ON COLUMN curio.message_sends.nonce IS 'assigned message nonce, set while the send task is executing';
COMMENT ON COLUMN curio.message_sends.signed_data IS 'signed message data, set while the send task is executing';
COMMENT ON COLUMN curio.message_sends.signed_cid IS 'signed message cid, set while the send task is executing';
COMMENT ON COLUMN curio.message_sends.send_time IS 'time when the send task was executed, set after pushing the message to the network';
COMMENT ON COLUMN curio.message_sends.send_success IS 'whether this message was broadcasted to the network already, null if not yet attempted, true if successful, false if failed';
COMMENT ON COLUMN curio.message_sends.send_error IS 'error message if send_success is false';

-- Permissions

ALTER TABLE message_sends OWNER TO yugabyte;
GRANT ALL ON TABLE message_sends TO yugabyte;


-- curio.message_sends_eth definition

-- Drop table

-- DROP TABLE message_sends_eth;

CREATE TABLE message_sends_eth ( from_address text NOT NULL, to_address text NOT NULL, send_reason text NOT NULL, send_task_id serial4 NOT NULL, unsigned_tx bytea NOT NULL, unsigned_hash text NOT NULL, nonce int8 NULL, signed_tx bytea NULL, signed_hash text NULL, send_time timestamp NULL, send_success bool NULL, send_error text NULL, CONSTRAINT message_sends_eth_pkey PRIMARY KEY (send_task_id));
CREATE UNIQUE INDEX message_sends_eth_success_index ON curio.message_sends_eth USING lsm (from_address HASH, nonce ASC) WHERE (send_success IS NOT FALSE);
COMMENT ON INDEX curio.message_sends_eth_success_index IS 'message_sends_eth_success_index enforces sender/nonce uniqueness, it is a conditional index that only indexes rows where send_success is not false. This allows us to have multiple rows with the same sender/nonce, as long as only one of them was successfully broadcasted (true) to the network or is in the process of being broadcasted (null).';

-- Column comments

COMMENT ON COLUMN curio.message_sends_eth.from_address IS 'Ethereum 0x... address';
COMMENT ON COLUMN curio.message_sends_eth.to_address IS 'Ethereum 0x... address';
COMMENT ON COLUMN curio.message_sends_eth.send_reason IS 'Optional description of send reason';
COMMENT ON COLUMN curio.message_sends_eth.send_task_id IS 'Task ID of the send task';
COMMENT ON COLUMN curio.message_sends_eth.unsigned_tx IS 'Unsigned transaction data';
COMMENT ON COLUMN curio.message_sends_eth.unsigned_hash IS 'Hash of the unsigned transaction';
COMMENT ON COLUMN curio.message_sends_eth.nonce IS 'Assigned transaction nonce, set while the send task is executing';
COMMENT ON COLUMN curio.message_sends_eth.signed_tx IS 'Signed transaction data, set while the send task is executing';
COMMENT ON COLUMN curio.message_sends_eth.signed_hash IS 'Hash of the signed transaction';
COMMENT ON COLUMN curio.message_sends_eth.send_time IS 'Time when the send task was executed, set after pushing the transaction to the network';
COMMENT ON COLUMN curio.message_sends_eth.send_success IS 'Whether this transaction was broadcasted to the network already, NULL if not yet attempted, TRUE if successful, FALSE if failed';
COMMENT ON COLUMN curio.message_sends_eth.send_error IS 'Error message if send_success is FALSE';

-- Permissions

ALTER TABLE message_sends_eth OWNER TO yugabyte;
GRANT ALL ON TABLE message_sends_eth TO yugabyte;


-- curio.mining_tasks definition

-- Drop table

-- DROP TABLE mining_tasks;

CREATE TABLE mining_tasks ( task_id int8 NOT NULL, sp_id int8 NOT NULL, epoch int8 NOT NULL, base_compute_time timestamptz NOT NULL, won bool DEFAULT false NOT NULL, mined_cid text NULL, mined_header jsonb NULL, mined_at timestamptz NULL, submitted_at timestamptz NULL, included bool NULL, CONSTRAINT mining_tasks_pk PRIMARY KEY (task_id), CONSTRAINT mining_tasks_sp_epoch UNIQUE (sp_id, epoch));
CREATE INDEX mining_tasks_won_sp_id_base_compute_time_index ON curio.mining_tasks USING lsm (won ASC, sp_id ASC, base_compute_time DESC);

-- Permissions

ALTER TABLE mining_tasks OWNER TO yugabyte;
GRANT ALL ON TABLE mining_tasks TO yugabyte;


-- curio.open_sector_pieces definition

-- Drop table

-- DROP TABLE open_sector_pieces;

CREATE TABLE open_sector_pieces ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, piece_index int8 NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, data_url text NOT NULL, data_headers jsonb DEFAULT '{}'::jsonb NOT NULL, data_raw_size int8 NOT NULL, data_delete_on_finalize bool NOT NULL, f05_publish_cid text NULL, f05_deal_id int8 NULL, f05_deal_proposal jsonb NULL, f05_deal_start_epoch int8 NULL, f05_deal_end_epoch int8 NULL, direct_start_epoch int8 NULL, direct_end_epoch int8 NULL, direct_piece_activation_manifest jsonb NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, is_snap bool DEFAULT false NOT NULL, CONSTRAINT open_sector_pieces_pkey PRIMARY KEY (sp_id, sector_number, piece_index));

-- Permissions

ALTER TABLE open_sector_pieces OWNER TO yugabyte;
GRANT ALL ON TABLE open_sector_pieces TO yugabyte;


-- curio.parked_pieces definition

-- Drop table

-- DROP TABLE parked_pieces;

CREATE TABLE parked_pieces ( id bigserial NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, piece_cid text NOT NULL, piece_padded_size int8 NOT NULL, piece_raw_size int8 NOT NULL, complete bool DEFAULT false NOT NULL, task_id int8 NULL, cleanup_task_id int8 NULL, long_term bool DEFAULT false NOT NULL, CONSTRAINT parked_pieces_piece_cid_cleanup_task_id_key UNIQUE (piece_cid, piece_padded_size, long_term, cleanup_task_id), CONSTRAINT parked_pieces_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE parked_pieces OWNER TO yugabyte;
GRANT ALL ON TABLE parked_pieces TO yugabyte;


-- curio.pdp_piece_mh_to_commp definition

-- Drop table

-- DROP TABLE pdp_piece_mh_to_commp;

CREATE TABLE pdp_piece_mh_to_commp ( mhash bytea NOT NULL, "size" int8 NOT NULL, commp text NOT NULL, CONSTRAINT pdp_piece_mh_to_commp_pkey PRIMARY KEY (mhash));

-- Permissions

ALTER TABLE pdp_piece_mh_to_commp OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_piece_mh_to_commp TO yugabyte;


-- curio.pdp_services definition

-- Drop table

-- DROP TABLE pdp_services;

CREATE TABLE pdp_services ( id bigserial NOT NULL, pubkey bytea NOT NULL, service_label text NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT pdp_services_pkey PRIMARY KEY (id), CONSTRAINT pdp_services_pubkey_key UNIQUE (pubkey), CONSTRAINT pdp_services_service_label_key UNIQUE (service_label));

-- Permissions

ALTER TABLE pdp_services OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_services TO yugabyte;


-- curio.piece_summary definition

-- Drop table

-- DROP TABLE piece_summary;

CREATE TABLE piece_summary ( id bool DEFAULT true NOT NULL, total int8 DEFAULT 0 NOT NULL, indexed int8 DEFAULT 0 NOT NULL, announced int8 DEFAULT 0 NOT NULL, last_updated timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, CONSTRAINT piece_summary_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE piece_summary OWNER TO yugabyte;
GRANT ALL ON TABLE piece_summary TO yugabyte;


-- curio.proofshare_client_messages definition

-- Drop table

-- DROP TABLE proofshare_client_messages;

CREATE TABLE proofshare_client_messages ( started_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, signed_cid text NOT NULL, wallet int8 NOT NULL, "action" text NULL, success bool NULL, completed_at timestamptz NULL, CONSTRAINT proofshare_client_messages_pkey PRIMARY KEY (started_at, signed_cid));
CREATE INDEX proofshare_client_messages_signed_cid ON curio.proofshare_client_messages USING lsm (signed_cid HASH);

-- Permissions

ALTER TABLE proofshare_client_messages OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_client_messages TO yugabyte;


-- curio.proofshare_client_payments definition

-- Drop table

-- DROP TABLE proofshare_client_payments;

CREATE TABLE proofshare_client_payments ( wallet int8 NOT NULL, nonce int8 NOT NULL, cumulative_amount text NOT NULL, signature bytea NOT NULL, consumed bool DEFAULT false NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, consumed_at timestamptz NULL, CONSTRAINT proofshare_client_payments_pkey PRIMARY KEY (wallet, nonce));
CREATE INDEX idx_proofshare_client_payments_created_at ON curio.proofshare_client_payments USING lsm (created_at ASC);

-- Table Triggers

create trigger tr_set_consumed_at_ps_client_payments before
insert
    or
update
    on
    curio.proofshare_client_payments for each row execute procedure curio.trg_set_consumed_at_ps_client_payments();

-- Permissions

ALTER TABLE proofshare_client_payments OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_client_payments TO yugabyte;


-- curio.proofshare_client_requests definition

-- Drop table

-- DROP TABLE proofshare_client_requests;

CREATE TABLE proofshare_client_requests ( sp_id int8 NOT NULL, sector_num int8 NOT NULL, request_cid text NULL, request_uploaded bool DEFAULT false NOT NULL, request_partition_cost int4 DEFAULT 10 NOT NULL, payment_wallet int8 NULL, payment_nonce int8 NULL, request_sent bool DEFAULT false NOT NULL, response_data bytea NULL, done bool DEFAULT false NOT NULL, created_at timestamptz NOT NULL, done_at timestamptz NULL, request_type text DEFAULT 'porep'::text NOT NULL, task_id_upload int8 NULL, task_id_poll int8 NULL, CONSTRAINT proofshare_client_requests_pkey PRIMARY KEY (sp_id, sector_num, request_type));

-- Permissions

ALTER TABLE proofshare_client_requests OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_client_requests TO yugabyte;


-- curio.proofshare_client_settings definition

-- Drop table

-- DROP TABLE proofshare_client_settings;

CREATE TABLE proofshare_client_settings ( enabled bool DEFAULT false NOT NULL, sp_id int8 DEFAULT 0 NOT NULL, wallet text NULL, minimum_pending_seconds int8 DEFAULT 0 NOT NULL, do_porep bool DEFAULT false NOT NULL, do_snap bool DEFAULT false NOT NULL, pprice text DEFAULT '0'::text NOT NULL, CONSTRAINT proofshare_client_settings_pkey PRIMARY KEY (sp_id));

-- Column comments

COMMENT ON COLUMN curio.proofshare_client_settings.enabled IS 'Setting to TRUE indicates acceptance of client TOS in lib/proofsvc/tos/client.md and privacy.md';

-- Permissions

ALTER TABLE proofshare_client_settings OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_client_settings TO yugabyte;


-- curio.proofshare_client_wallets definition

-- Drop table

-- DROP TABLE proofshare_client_wallets;

CREATE TABLE proofshare_client_wallets ( wallet int8 NOT NULL, CONSTRAINT proofshare_client_wallets_pkey PRIMARY KEY (wallet));

-- Permissions

ALTER TABLE proofshare_client_wallets OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_client_wallets TO yugabyte;


-- curio.proofshare_meta definition

-- Drop table

-- DROP TABLE proofshare_meta;

CREATE TABLE proofshare_meta ( singleton bool DEFAULT true NOT NULL, enabled bool DEFAULT false NOT NULL, wallet text NULL, pprice text DEFAULT '0'::text NOT NULL, request_task_id int8 NULL, autosettle bool DEFAULT true NOT NULL, CONSTRAINT proofshare_meta_pkey PRIMARY KEY (singleton), CONSTRAINT proofshare_meta_singleton_check CHECK ((singleton = true)));

-- Column comments

COMMENT ON COLUMN curio.proofshare_meta.enabled IS 'Setting to TRUE indicates acceptance of provider TOS in lib/proofsvc/tos/provider.md and privacy.md';

-- Permissions

ALTER TABLE proofshare_meta OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_meta TO yugabyte;


-- curio.proofshare_provider_messages definition

-- Drop table

-- DROP TABLE proofshare_provider_messages;

CREATE TABLE proofshare_provider_messages ( started_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, signed_cid text NOT NULL, wallet int8 NOT NULL, "action" text NULL, success bool NULL, completed_at timestamptz NULL, CONSTRAINT proofshare_provider_messages_pkey PRIMARY KEY (started_at, signed_cid));
CREATE INDEX proofshare_provider_messages_signed_cid ON curio.proofshare_provider_messages USING lsm (signed_cid HASH);

-- Permissions

ALTER TABLE proofshare_provider_messages OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_provider_messages TO yugabyte;


-- curio.proofshare_provider_payments definition

-- Drop table

-- DROP TABLE proofshare_provider_payments;

CREATE TABLE proofshare_provider_payments ( provider_id int8 NOT NULL, request_cid text NOT NULL, payment_nonce int8 NOT NULL, payment_cumulative_amount text NOT NULL, payment_signature bytea NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT proofshare_provider_payments_pkey PRIMARY KEY (provider_id, payment_nonce));
CREATE INDEX proofshare_provider_payments_request_cid_index ON curio.proofshare_provider_payments USING lsm (request_cid HASH);

-- Permissions

ALTER TABLE proofshare_provider_payments OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_provider_payments TO yugabyte;


-- curio.proofshare_provider_payments_settlement definition

-- Drop table

-- DROP TABLE proofshare_provider_payments_settlement;

CREATE TABLE proofshare_provider_payments_settlement ( provider_id int8 NOT NULL, payment_nonce int8 NOT NULL, settled_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, settle_message_cid text NOT NULL, CONSTRAINT proofshare_provider_payments_settlement_pkey PRIMARY KEY (provider_id, payment_nonce));

-- Permissions

ALTER TABLE proofshare_provider_payments_settlement OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_provider_payments_settlement TO yugabyte;


-- curio.proofshare_queue definition

-- Drop table

-- DROP TABLE proofshare_queue;

CREATE TABLE proofshare_queue ( service_id int8 NOT NULL, obtained_at timestamptz NOT NULL, request_cid text NOT NULL, response_data bytea NULL, compute_task_id int8 NULL, compute_done bool DEFAULT false NOT NULL, submit_task_id int8 NULL, submit_done bool DEFAULT false NOT NULL, was_pow bool DEFAULT false NOT NULL, CONSTRAINT proofshare_queue_pkey PRIMARY KEY (service_id, obtained_at));
CREATE UNIQUE INDEX proofshare_queue_request_cid_uindex ON curio.proofshare_queue USING lsm (request_cid HASH);

-- Permissions

ALTER TABLE proofshare_queue OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_queue TO yugabyte;


-- curio.scrub_unseal_commd_check definition

-- Drop table

-- DROP TABLE scrub_unseal_commd_check;

CREATE TABLE scrub_unseal_commd_check ( check_id bigserial NOT NULL, sp_id int8 NOT NULL, sector_number int8 NOT NULL, create_time timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, task_id int8 NULL, expected_unsealed_cid text NOT NULL, ok bool NULL, actual_unsealed_cid text NULL, message text NULL, CONSTRAINT scrub_unseal_commd_check_pkey PRIMARY KEY (check_id), CONSTRAINT scrub_unseal_commd_check_sp_id_sector_number_create_time_key UNIQUE (sp_id, sector_number, create_time), CONSTRAINT scrub_unseal_commd_check_task_id_key UNIQUE (task_id));

-- Permissions

ALTER TABLE scrub_unseal_commd_check OWNER TO yugabyte;
GRANT ALL ON TABLE scrub_unseal_commd_check TO yugabyte;


-- curio.sector_location definition

-- Drop table

-- DROP TABLE sector_location;

CREATE TABLE sector_location ( miner_id int8 NOT NULL, sector_num int8 NOT NULL, sector_filetype int4 NOT NULL, storage_id varchar NOT NULL, is_primary bool NULL, read_ts timestamptz NULL, read_refs int4 DEFAULT 0 NOT NULL, write_ts timestamptz NULL, write_lock_owner varchar NULL, CONSTRAINT sectorlocation_pk PRIMARY KEY (miner_id, sector_num, sector_filetype, storage_id));

-- Permissions

ALTER TABLE sector_location OWNER TO yugabyte;
GRANT ALL ON TABLE sector_location TO yugabyte;


-- curio.sectors_allocated_numbers definition

-- Drop table

-- DROP TABLE sectors_allocated_numbers;

CREATE TABLE sectors_allocated_numbers ( sp_id int8 NOT NULL, allocated jsonb NOT NULL, CONSTRAINT sectors_allocated_numbers_pkey PRIMARY KEY (sp_id));

-- Permissions

ALTER TABLE sectors_allocated_numbers OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_allocated_numbers TO yugabyte;


-- curio.sectors_cc_scheduler definition

-- Drop table

-- DROP TABLE sectors_cc_scheduler;

CREATE TABLE sectors_cc_scheduler ( sp_id int8 NOT NULL, to_seal int8 NOT NULL, weight int8 DEFAULT 1000 NOT NULL, duration_days int8 DEFAULT 182 NOT NULL, enabled bool DEFAULT true NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT sectors_cc_scheduler_pkey PRIMARY KEY (sp_id));

-- Permissions

ALTER TABLE sectors_cc_scheduler OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_cc_scheduler TO yugabyte;


-- curio.sectors_cc_values definition

-- Drop table

-- DROP TABLE sectors_cc_values;

CREATE TABLE sectors_cc_values ( reg_seal_proof int4 NOT NULL, cur_unsealed_cid text NOT NULL, CONSTRAINT sectors_cc_values_pkey PRIMARY KEY (reg_seal_proof, cur_unsealed_cid));

-- Permissions

ALTER TABLE sectors_cc_values OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_cc_values TO yugabyte;


-- curio.sectors_meta definition

-- Drop table

-- DROP TABLE sectors_meta;

CREATE TABLE sectors_meta ( sp_id int8 NOT NULL, sector_num int8 NOT NULL, reg_seal_proof int4 NOT NULL, ticket_epoch int8 NOT NULL, ticket_value bytea NOT NULL, orig_sealed_cid text NOT NULL, orig_unsealed_cid text NOT NULL, cur_sealed_cid text NOT NULL, cur_unsealed_cid text NOT NULL, msg_cid_precommit text NULL, msg_cid_commit text NULL, msg_cid_update text NULL, seed_epoch int8 NOT NULL, seed_value bytea NOT NULL, expiration_epoch int8 NULL, is_cc bool NULL, deadline int8 NULL, "partition" int8 NULL, target_unseal_state bool NULL, CONSTRAINT sectors_meta_pkey PRIMARY KEY (sp_id, sector_num));
CREATE INDEX sectors_meta_deadline_partition_spid_sectornum_index ON curio.sectors_meta USING lsm (deadline HASH, partition ASC, sp_id ASC, sector_num ASC);

-- Table Triggers

create trigger insert_is_cc_trigger before
insert
    on
    curio.sectors_meta for each row execute procedure curio.update_is_cc();
create trigger update_is_cc_trigger before
update
    on
    curio.sectors_meta for each row execute procedure curio.update_is_cc();
create trigger trig_sectors_meta_update_materialized after
insert
    or
delete
    or
update
    on
    curio.sectors_meta for each row execute procedure curio.trig_sectors_meta_update_materialized();

-- Permissions

ALTER TABLE sectors_meta OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_meta TO yugabyte;


-- curio.sectors_pipeline_events definition

-- Drop table

-- DROP TABLE sectors_pipeline_events;

CREATE TABLE sectors_pipeline_events ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, task_history_id int8 NOT NULL, CONSTRAINT sectors_pipeline_events_pkey PRIMARY KEY (sp_id, sector_number, task_history_id));
CREATE UNIQUE INDEX sectors_pipeline_events_task_history_id_uindex ON curio.sectors_pipeline_events USING lsm (task_history_id HASH, sp_id ASC, sector_number ASC);

-- Permissions

ALTER TABLE sectors_pipeline_events OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_pipeline_events TO yugabyte;


-- curio.sectors_sdr_pipeline definition

-- Drop table

-- DROP TABLE sectors_sdr_pipeline;

CREATE TABLE sectors_sdr_pipeline ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, create_time timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, reg_seal_proof int4 NOT NULL, ticket_epoch int8 NULL, ticket_value bytea NULL, task_id_sdr int8 NULL, after_sdr bool DEFAULT false NOT NULL, tree_d_cid text NULL, task_id_tree_d int8 NULL, after_tree_d bool DEFAULT false NOT NULL, task_id_tree_c int8 NULL, after_tree_c bool DEFAULT false NOT NULL, tree_r_cid text NULL, task_id_tree_r int8 NULL, after_tree_r bool DEFAULT false NOT NULL, precommit_msg_cid text NULL, task_id_precommit_msg int8 NULL, after_precommit_msg bool DEFAULT false NOT NULL, seed_epoch int8 NULL, precommit_msg_tsk bytea NULL, after_precommit_msg_success bool DEFAULT false NOT NULL, seed_value bytea NULL, task_id_porep int8 NULL, porep_proof bytea NULL, after_porep bool DEFAULT false NOT NULL, task_id_finalize int8 NULL, after_finalize bool DEFAULT false NOT NULL, task_id_move_storage int8 NULL, after_move_storage bool DEFAULT false NOT NULL, commit_msg_cid text NULL, task_id_commit_msg int8 NULL, after_commit_msg bool DEFAULT false NOT NULL, commit_msg_tsk bytea NULL, after_commit_msg_success bool DEFAULT false NOT NULL, failed bool DEFAULT false NOT NULL, failed_at timestamptz NULL, failed_reason varchar(20) DEFAULT ''::character varying NOT NULL, failed_reason_msg text DEFAULT ''::text NOT NULL, task_id_synth int8 NULL, after_synth bool DEFAULT false NOT NULL, user_sector_duration_epochs int8 NULL, precommit_ready_at timestamptz NULL, commit_ready_at timestamptz NULL, start_epoch int8 NULL, CONSTRAINT sectors_sdr_pipeline_pkey PRIMARY KEY (sp_id, sector_number));

-- Table Triggers

create trigger update_precommit_ready_at after
insert
    or
delete
    or
update
    on
    curio.sectors_sdr_pipeline for each row execute procedure curio.set_precommit_ready_at();
create trigger update_commit_ready_at after
insert
    or
delete
    or
update
    on
    curio.sectors_sdr_pipeline for each row execute procedure curio.set_commit_ready_at();

-- Permissions

ALTER TABLE sectors_sdr_pipeline OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_sdr_pipeline TO yugabyte;


-- curio.sectors_unseal_pipeline definition

-- Drop table

-- DROP TABLE sectors_unseal_pipeline;

CREATE TABLE sectors_unseal_pipeline ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, reg_seal_proof int8 NOT NULL, create_time timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, task_id_unseal_sdr int8 NULL, after_unseal_sdr bool DEFAULT false NOT NULL, task_id_decode_sector int8 NULL, after_decode_sector bool DEFAULT false NOT NULL, CONSTRAINT sectors_unseal_pipeline_pkey PRIMARY KEY (sp_id, sector_number));

-- Permissions

ALTER TABLE sectors_unseal_pipeline OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_unseal_pipeline TO yugabyte;


-- curio.storage_gc_pins definition

-- Drop table

-- DROP TABLE storage_gc_pins;

CREATE TABLE storage_gc_pins ( sp_id int8 NOT NULL, sector_num int8 NOT NULL, CONSTRAINT storage_gc_pins_pkey PRIMARY KEY (sp_id, sector_num));

-- Permissions

ALTER TABLE storage_gc_pins OWNER TO yugabyte;
GRANT ALL ON TABLE storage_gc_pins TO yugabyte;


-- curio.storage_path definition

-- Drop table

-- DROP TABLE storage_path;

CREATE TABLE storage_path ( storage_id varchar NOT NULL, urls varchar NULL, weight int8 NULL, max_storage int8 NULL, can_seal bool NULL, can_store bool NULL, "groups" varchar NULL, allow_to varchar NULL, allow_types varchar NULL, deny_types varchar NULL, capacity int8 NULL, available int8 NULL, fs_available int8 NULL, reserved int8 NULL, used int8 NULL, last_heartbeat timestamptz NULL, heartbeat_err varchar NULL, allow_miners varchar DEFAULT ''::character varying NULL, deny_miners varchar DEFAULT ''::character varying NULL, CONSTRAINT storage_path_pkey PRIMARY KEY (storage_id));

-- Permissions

ALTER TABLE storage_path OWNER TO yugabyte;
GRANT ALL ON TABLE storage_path TO yugabyte;


-- curio.storage_removal_marks definition

-- Drop table

-- DROP TABLE storage_removal_marks;

CREATE TABLE storage_removal_marks ( sp_id int8 NOT NULL, sector_num int8 NOT NULL, sector_filetype int8 NOT NULL, storage_id text NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, approved bool DEFAULT false NOT NULL, approved_at timestamptz NULL, CONSTRAINT storage_removal_marks_pkey PRIMARY KEY (sp_id, sector_num, sector_filetype, storage_id));

-- Permissions

ALTER TABLE storage_removal_marks OWNER TO yugabyte;
GRANT ALL ON TABLE storage_removal_marks TO yugabyte;


-- curio.wallet_exporter_processing definition

-- Drop table

-- DROP TABLE wallet_exporter_processing;

CREATE TABLE wallet_exporter_processing ( singleton bool DEFAULT true NOT NULL, processed_until timestamptz DEFAULT now() NOT NULL, CONSTRAINT wallet_exporter_processing_pkey PRIMARY KEY (singleton), CONSTRAINT wallet_exporter_processing_singleton_check CHECK ((singleton = true)));

-- Permissions

ALTER TABLE wallet_exporter_processing OWNER TO yugabyte;
GRANT ALL ON TABLE wallet_exporter_processing TO yugabyte;


-- curio.wallet_names definition

-- Drop table

-- DROP TABLE wallet_names;

CREATE TABLE wallet_names ( wallet varchar NOT NULL, "name" varchar(60) NOT NULL, CONSTRAINT wallet_names_name_key UNIQUE (name), CONSTRAINT wallet_names_pkey PRIMARY KEY (wallet));

-- Permissions

ALTER TABLE wallet_names OWNER TO yugabyte;
GRANT ALL ON TABLE wallet_names TO yugabyte;


-- curio.wdpost_partition_tasks definition

-- Drop table

-- DROP TABLE wdpost_partition_tasks;

CREATE TABLE wdpost_partition_tasks ( task_id int8 NOT NULL, sp_id int8 NOT NULL, proving_period_start int8 NOT NULL, deadline_index int8 NOT NULL, partition_index int8 NOT NULL, CONSTRAINT wdpost_partition_tasks_identity_key UNIQUE (sp_id, proving_period_start, deadline_index, partition_index), CONSTRAINT wdpost_partition_tasks_pk PRIMARY KEY (task_id));

-- Column comments

COMMENT ON COLUMN curio.wdpost_partition_tasks.task_id IS 'harmonytask task ID';
COMMENT ON COLUMN curio.wdpost_partition_tasks.sp_id IS 'storage provider ID';
COMMENT ON COLUMN curio.wdpost_partition_tasks.proving_period_start IS 'proving period start';
COMMENT ON COLUMN curio.wdpost_partition_tasks.deadline_index IS 'deadline index within the proving period';
COMMENT ON COLUMN curio.wdpost_partition_tasks.partition_index IS 'partition index within the deadline';

-- Permissions

ALTER TABLE wdpost_partition_tasks OWNER TO yugabyte;
GRANT ALL ON TABLE wdpost_partition_tasks TO yugabyte;


-- curio.wdpost_proofs definition

-- Drop table

-- DROP TABLE wdpost_proofs;

CREATE TABLE wdpost_proofs ( sp_id int8 NOT NULL, proving_period_start int8 NOT NULL, deadline int8 NOT NULL, "partition" int8 NOT NULL, submit_at_epoch int8 NOT NULL, submit_by_epoch int8 NOT NULL, proof_params bytea NULL, submit_task_id int8 NULL, message_cid text NULL, test_task_id int8 NULL, CONSTRAINT wdpost_proofs_identity_key UNIQUE (sp_id, proving_period_start, deadline, partition));

-- Permissions

ALTER TABLE wdpost_proofs OWNER TO yugabyte;
GRANT ALL ON TABLE wdpost_proofs TO yugabyte;


-- curio.wdpost_recovery_tasks definition

-- Drop table

-- DROP TABLE wdpost_recovery_tasks;

CREATE TABLE wdpost_recovery_tasks ( task_id int8 NOT NULL, sp_id int8 NOT NULL, proving_period_start int8 NOT NULL, deadline_index int8 NOT NULL, partition_index int8 NOT NULL, CONSTRAINT wdpost_recovery_tasks_identity_key UNIQUE (sp_id, proving_period_start, deadline_index, partition_index), CONSTRAINT wdpost_recovery_tasks_pk PRIMARY KEY (task_id));

-- Permissions

ALTER TABLE wdpost_recovery_tasks OWNER TO yugabyte;
GRANT ALL ON TABLE wdpost_recovery_tasks TO yugabyte;


-- curio.batch_sector_refs definition

-- Drop table

-- DROP TABLE batch_sector_refs;

CREATE TABLE batch_sector_refs ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, machine_host_and_port text NOT NULL, pipeline_slot int8 NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT batch_sector_refs_pkey PRIMARY KEY (sp_id, sector_number, machine_host_and_port, pipeline_slot), CONSTRAINT batch_sector_refs_sp_id_fkey FOREIGN KEY (sp_id,sector_number) REFERENCES sectors_sdr_pipeline(sp_id,sector_number));

-- Permissions

ALTER TABLE batch_sector_refs OWNER TO yugabyte;
GRANT ALL ON TABLE batch_sector_refs TO yugabyte;


-- curio.harmony_machine_details definition

-- Drop table

-- DROP TABLE harmony_machine_details;

CREATE TABLE harmony_machine_details ( id serial4 NOT NULL, tasks text NULL, layers text NULL, startup_time timestamptz NULL, miners text NULL, machine_id int4 NULL, machine_name text NULL, CONSTRAINT harmony_machine_details_pkey PRIMARY KEY (id), CONSTRAINT harmony_machine_details_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES harmony_machines(id) ON DELETE CASCADE);
CREATE UNIQUE INDEX machine_details_machine_id ON curio.harmony_machine_details USING lsm (machine_id HASH);

-- Permissions

ALTER TABLE harmony_machine_details OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_machine_details TO yugabyte;


-- curio.harmony_task definition

-- Drop table

-- DROP TABLE harmony_task;

CREATE TABLE harmony_task ( id serial4 NOT NULL, initiated_by int4 NULL, update_time timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, posted_time timestamptz NOT NULL, owner_id int4 NULL, added_by int4 NOT NULL, previous_task int4 NULL, "name" varchar(16) NOT NULL, retries int8 DEFAULT 0 NOT NULL, CONSTRAINT harmony_task_pkey PRIMARY KEY (id), CONSTRAINT harmony_task_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES harmony_machines(id) ON DELETE SET NULL);

-- Column comments

COMMENT ON COLUMN curio.harmony_task.initiated_by IS 'The task ID whose completion occasioned this task.';
COMMENT ON COLUMN curio.harmony_task.update_time IS 'When it was last modified. not a heartbeat';
COMMENT ON COLUMN curio.harmony_task.owner_id IS 'may be null if between owners or not yet taken';
COMMENT ON COLUMN curio.harmony_task."name" IS 'The name of the task type.';

-- Permissions

ALTER TABLE harmony_task OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_task TO yugabyte;


-- curio.harmony_task_follow definition

-- Drop table

-- DROP TABLE harmony_task_follow;

CREATE TABLE harmony_task_follow ( id serial4 NOT NULL, owner_id int4 NOT NULL, to_type varchar(16) NOT NULL, from_type varchar(16) NOT NULL, CONSTRAINT harmony_task_follow_pkey PRIMARY KEY (id), CONSTRAINT harmony_task_follow_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES harmony_machines(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE harmony_task_follow OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_task_follow TO yugabyte;


-- curio.harmony_task_impl definition

-- Drop table

-- DROP TABLE harmony_task_impl;

CREATE TABLE harmony_task_impl ( id serial4 NOT NULL, owner_id int4 NOT NULL, "name" varchar(16) NOT NULL, CONSTRAINT harmony_task_impl_pkey PRIMARY KEY (id), CONSTRAINT harmony_task_impl_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES harmony_machines(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE harmony_task_impl OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_task_impl TO yugabyte;


-- curio.harmony_task_singletons definition

-- Drop table

-- DROP TABLE harmony_task_singletons;

CREATE TABLE harmony_task_singletons ( task_name varchar(255) NOT NULL, task_id int8 NULL, last_run_time timestamptz NULL, CONSTRAINT harmony_task_singletons_pkey PRIMARY KEY (task_name), CONSTRAINT harmony_task_singletons_task_id_fkey FOREIGN KEY (task_id) REFERENCES harmony_task(id) ON DELETE SET NULL);

-- Permissions

ALTER TABLE harmony_task_singletons OWNER TO yugabyte;
GRANT ALL ON TABLE harmony_task_singletons TO yugabyte;


-- curio.ipni_head definition

-- Drop table

-- DROP TABLE ipni_head;

CREATE TABLE ipni_head ( provider text NOT NULL, head text NOT NULL, CONSTRAINT ipni_head_pkey PRIMARY KEY (provider), CONSTRAINT ipni_head_head_fkey FOREIGN KEY (head) REFERENCES ipni(ad_cid) ON DELETE RESTRICT);

-- Permissions

ALTER TABLE ipni_head OWNER TO yugabyte;
GRANT ALL ON TABLE ipni_head TO yugabyte;


-- curio.market_offline_urls definition

-- Drop table

-- DROP TABLE market_offline_urls;

CREATE TABLE market_offline_urls ( "uuid" text NOT NULL, url text NOT NULL, headers jsonb DEFAULT '{}'::jsonb NOT NULL, raw_size int8 NOT NULL, CONSTRAINT market_offline_urls_uuid_unique UNIQUE (uuid), CONSTRAINT market_offline_urls_uuid_fk FOREIGN KEY ("uuid") REFERENCES market_mk12_deal_pipeline("uuid") ON DELETE CASCADE);

-- Permissions

ALTER TABLE market_offline_urls OWNER TO yugabyte;
GRANT ALL ON TABLE market_offline_urls TO yugabyte;


-- curio.message_waits definition

-- Drop table

-- DROP TABLE message_waits;

CREATE TABLE message_waits ( signed_message_cid text NOT NULL, waiter_machine_id int4 NULL, executed_tsk_cid text NULL, executed_tsk_epoch int8 NULL, executed_msg_cid text NULL, executed_msg_data jsonb NULL, executed_rcpt_exitcode int8 NULL, executed_rcpt_return bytea NULL, executed_rcpt_gas_used int8 NULL, created_at timestamptz DEFAULT timezone('UTC'::text, now()) NOT NULL, CONSTRAINT message_waits_pkey PRIMARY KEY (signed_message_cid), CONSTRAINT message_waits_waiter_machine_id_fkey FOREIGN KEY (waiter_machine_id) REFERENCES harmony_machines(id) ON DELETE SET NULL);
CREATE INDEX idx_message_waits_created_at_executed ON curio.message_waits USING lsm (created_at HASH) WHERE (executed_tsk_cid IS NOT NULL);
CREATE INDEX idx_message_waits_nulls ON curio.message_waits USING lsm (waiter_machine_id HASH) WHERE ((waiter_machine_id IS NULL) AND (executed_tsk_cid IS NULL));
CREATE INDEX message_waits_waiter_machine_id_index ON curio.message_waits USING lsm (waiter_machine_id HASH);

-- Table Triggers

create trigger tr_update_proofshare_client_messages after
update
    on
    curio.message_waits for each row
    when (((old.executed_tsk_epoch is null)
        and (new.executed_tsk_epoch is not null))) execute procedure curio.update_proofshare_client_messages_from_message_waits();
create trigger tr_update_proofshare_provider_messages after
update
    on
    curio.message_waits for each row
    when (((old.executed_tsk_epoch is null)
        and (new.executed_tsk_epoch is not null))) execute procedure curio.update_proofshare_provider_messages_from_message_waits();
create trigger tr_update_balance_manager_from_message_waits after
update
    on
    curio.message_waits for each row
    when (((old.executed_tsk_epoch is null)
        and (new.executed_tsk_epoch is not null))) execute procedure curio.update_balance_manager_from_message_waits();

-- Permissions

ALTER TABLE message_waits OWNER TO yugabyte;
GRANT ALL ON TABLE message_waits TO yugabyte;


-- curio.message_waits_eth definition

-- Drop table

-- DROP TABLE message_waits_eth;

CREATE TABLE message_waits_eth ( signed_tx_hash text NOT NULL, waiter_machine_id int4 NULL, confirmed_block_number int8 NULL, confirmed_tx_hash text NULL, confirmed_tx_data jsonb NULL, tx_status text NULL, tx_receipt jsonb NULL, tx_success bool NULL, CONSTRAINT message_waits_eth_pkey PRIMARY KEY (signed_tx_hash), CONSTRAINT message_waits_eth_waiter_machine_id_fkey FOREIGN KEY (waiter_machine_id) REFERENCES harmony_machines(id) ON DELETE SET NULL);
CREATE INDEX idx_message_waits_eth_pending ON curio.message_waits_eth USING lsm (waiter_machine_id HASH) WHERE ((waiter_machine_id IS NULL) AND (tx_status = 'pending'::text));

-- Table Triggers

create trigger pdp_proofset_create_message_status_change after
update
    of tx_status,
    tx_success on
    curio.message_waits_eth for each row execute procedure curio.update_pdp_proofset_creates();
create trigger pdp_proofset_add_message_status_change after
update
    of tx_status,
    tx_success on
    curio.message_waits_eth for each row execute procedure curio.update_pdp_proofset_roots();

-- Permissions

ALTER TABLE message_waits_eth OWNER TO yugabyte;
GRANT ALL ON TABLE message_waits_eth TO yugabyte;


-- curio.mining_base_block definition

-- Drop table

-- DROP TABLE mining_base_block;

CREATE TABLE mining_base_block ( id bigserial NOT NULL, task_id int8 NOT NULL, sp_id int8 NULL, block_cid text NOT NULL, no_win bool DEFAULT false NOT NULL, CONSTRAINT mining_base_block_pk PRIMARY KEY (id), CONSTRAINT mining_base_block_pk2 UNIQUE (sp_id, task_id, block_cid), CONSTRAINT mining_base_block_mining_tasks_task_id_fk FOREIGN KEY (task_id) REFERENCES mining_tasks(task_id) ON DELETE CASCADE);
CREATE UNIQUE INDEX mining_base_block_cid_k ON curio.mining_base_block USING lsm (sp_id HASH, block_cid ASC) WHERE (no_win = false);
CREATE INDEX mining_base_block_task_id_id_index ON curio.mining_base_block USING lsm (task_id HASH, id ASC);

-- Permissions

ALTER TABLE mining_base_block OWNER TO yugabyte;
GRANT ALL ON TABLE mining_base_block TO yugabyte;


-- curio.parked_piece_refs definition

-- Drop table

-- DROP TABLE parked_piece_refs;

CREATE TABLE parked_piece_refs ( ref_id bigserial NOT NULL, piece_id int8 NOT NULL, data_url text NULL, data_headers jsonb DEFAULT '{}'::jsonb NOT NULL, long_term bool DEFAULT false NOT NULL, CONSTRAINT parked_piece_refs_pkey PRIMARY KEY (ref_id), CONSTRAINT parked_piece_refs_piece_id_fkey FOREIGN KEY (piece_id) REFERENCES parked_pieces(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE parked_piece_refs OWNER TO yugabyte;
GRANT ALL ON TABLE parked_piece_refs TO yugabyte;


-- curio.pdp_piece_uploads definition

-- Drop table

-- DROP TABLE pdp_piece_uploads;

CREATE TABLE pdp_piece_uploads ( id uuid NOT NULL, service text NOT NULL, check_hash_codec text NOT NULL, check_hash bytea NOT NULL, check_size int8 NOT NULL, piece_cid text NULL, notify_url text NOT NULL, notify_task_id int8 NULL, piece_ref int8 NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT pdp_piece_uploads_pkey PRIMARY KEY (id), CONSTRAINT pdp_piece_uploads_piece_ref_fkey FOREIGN KEY (piece_ref) REFERENCES parked_piece_refs(ref_id) ON DELETE SET NULL, CONSTRAINT pdp_piece_uploads_service_fkey FOREIGN KEY (service) REFERENCES pdp_services(service_label) ON DELETE CASCADE);

-- Permissions

ALTER TABLE pdp_piece_uploads OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_piece_uploads TO yugabyte;


-- curio.pdp_piecerefs definition

-- Drop table

-- DROP TABLE pdp_piecerefs;

CREATE TABLE pdp_piecerefs ( id bigserial NOT NULL, service text NOT NULL, piece_cid text NOT NULL, piece_ref int8 NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, proofset_refcount int8 DEFAULT 0 NOT NULL, CONSTRAINT pdp_piecerefs_piece_ref_key UNIQUE (piece_ref), CONSTRAINT pdp_piecerefs_pkey PRIMARY KEY (id), CONSTRAINT pdp_piecerefs_piece_ref_fkey FOREIGN KEY (piece_ref) REFERENCES parked_piece_refs(ref_id) ON DELETE CASCADE, CONSTRAINT pdp_piecerefs_service_fkey FOREIGN KEY (service) REFERENCES pdp_services(service_label) ON DELETE CASCADE);
CREATE INDEX pdp_piecerefs_piece_cid_idx ON curio.pdp_piecerefs USING lsm (piece_cid HASH);

-- Permissions

ALTER TABLE pdp_piecerefs OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_piecerefs TO yugabyte;


-- curio.pdp_proof_sets definition

-- Drop table

-- DROP TABLE pdp_proof_sets;

CREATE TABLE pdp_proof_sets ( id int8 NOT NULL, prev_challenge_request_epoch int8 NULL, challenge_request_task_id int8 NULL, challenge_request_msg_hash text NULL, proving_period int8 NULL, challenge_window int8 NULL, prove_at_epoch int8 NULL, init_ready bool DEFAULT false NOT NULL, create_message_hash text NOT NULL, service text NOT NULL, CONSTRAINT pdp_proof_sets_pkey PRIMARY KEY (id), CONSTRAINT pdp_proof_sets_challenge_request_task_id_fkey FOREIGN KEY (challenge_request_task_id) REFERENCES harmony_task(id) ON DELETE SET NULL, CONSTRAINT pdp_proof_sets_service_fkey FOREIGN KEY (service) REFERENCES pdp_services(service_label) ON DELETE RESTRICT);

-- Permissions

ALTER TABLE pdp_proof_sets OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_proof_sets TO yugabyte;


-- curio.pdp_proofset_creates definition

-- Drop table

-- DROP TABLE pdp_proofset_creates;

CREATE TABLE pdp_proofset_creates ( create_message_hash text NOT NULL, ok bool NULL, proofset_created bool DEFAULT false NOT NULL, service text NOT NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT pdp_proofset_creates_pkey PRIMARY KEY (create_message_hash), CONSTRAINT pdp_proofset_creates_create_message_hash_fkey FOREIGN KEY (create_message_hash) REFERENCES message_waits_eth(signed_tx_hash) ON DELETE CASCADE, CONSTRAINT pdp_proofset_creates_service_fkey FOREIGN KEY (service) REFERENCES pdp_services(service_label) ON DELETE CASCADE);

-- Permissions

ALTER TABLE pdp_proofset_creates OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_proofset_creates TO yugabyte;


-- curio.pdp_proofset_root_adds definition

-- Drop table

-- DROP TABLE pdp_proofset_root_adds;

CREATE TABLE pdp_proofset_root_adds ( proofset int8 NOT NULL, root text NOT NULL, add_message_hash text NOT NULL, add_message_ok bool NULL, add_message_index int8 NOT NULL, subroot text NOT NULL, subroot_offset int8 NOT NULL, subroot_size int8 NOT NULL, pdp_pieceref int8 NOT NULL, roots_added bool DEFAULT false NOT NULL, CONSTRAINT pdp_proofset_root_adds_root_id_unique PRIMARY KEY (proofset, add_message_hash, subroot_offset), CONSTRAINT pdp_proofset_root_adds_add_message_hash_fkey FOREIGN KEY (add_message_hash) REFERENCES message_waits_eth(signed_tx_hash) ON DELETE CASCADE, CONSTRAINT pdp_proofset_root_adds_pdp_pieceref_fkey FOREIGN KEY (pdp_pieceref) REFERENCES pdp_piecerefs(id) ON DELETE SET NULL, CONSTRAINT pdp_proofset_root_adds_proofset_fkey FOREIGN KEY (proofset) REFERENCES pdp_proof_sets(id) ON DELETE CASCADE);
CREATE INDEX idx_pdp_proofset_root_adds_roots_added ON curio.pdp_proofset_root_adds USING lsm (roots_added HASH);

-- Permissions

ALTER TABLE pdp_proofset_root_adds OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_proofset_root_adds TO yugabyte;


-- curio.pdp_proofset_roots definition

-- Drop table

-- DROP TABLE pdp_proofset_roots;

CREATE TABLE pdp_proofset_roots ( proofset int8 NOT NULL, root text NOT NULL, add_message_hash text NOT NULL, add_message_index int8 NOT NULL, root_id int8 NOT NULL, subroot text NOT NULL, subroot_offset int8 NOT NULL, subroot_size int8 NOT NULL, pdp_pieceref int8 NOT NULL, CONSTRAINT pdp_proofset_roots_root_id_unique PRIMARY KEY (proofset, root_id, subroot_offset), CONSTRAINT pdp_proofset_roots_add_message_hash_fkey FOREIGN KEY (add_message_hash) REFERENCES message_waits_eth(signed_tx_hash) ON DELETE CASCADE, CONSTRAINT pdp_proofset_roots_pdp_pieceref_fkey FOREIGN KEY (pdp_pieceref) REFERENCES pdp_piecerefs(id) ON DELETE SET NULL, CONSTRAINT pdp_proofset_roots_proofset_fkey FOREIGN KEY (proofset) REFERENCES pdp_proof_sets(id) ON DELETE CASCADE);

-- Table Triggers

create trigger pdp_proofset_root_insert after
insert
    on
    curio.pdp_proofset_roots for each row
    when ((new.pdp_pieceref is not null)) execute procedure curio.increment_proofset_refcount();
create trigger pdp_proofset_root_delete after
delete
    on
    curio.pdp_proofset_roots for each row
    when ((old.pdp_pieceref is not null)) execute procedure curio.decrement_proofset_refcount();
create trigger pdp_proofset_root_update after
update
    on
    curio.pdp_proofset_roots for each row execute procedure curio.adjust_proofset_refcount_on_update();

-- Permissions

ALTER TABLE pdp_proofset_roots OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_proofset_roots TO yugabyte;


-- curio.pdp_prove_tasks definition

-- Drop table

-- DROP TABLE pdp_prove_tasks;

CREATE TABLE pdp_prove_tasks ( proofset int8 NOT NULL, task_id int8 NOT NULL, CONSTRAINT pdp_prove_tasks_pkey PRIMARY KEY (proofset, task_id), CONSTRAINT pdp_prove_tasks_proofset_fkey FOREIGN KEY (proofset) REFERENCES pdp_proof_sets(id) ON DELETE CASCADE, CONSTRAINT pdp_prove_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES harmony_task(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE pdp_prove_tasks OWNER TO yugabyte;
GRANT ALL ON TABLE pdp_prove_tasks TO yugabyte;


-- curio.proofshare_client_sender definition

-- Drop table

-- DROP TABLE proofshare_client_sender;

CREATE TABLE proofshare_client_sender ( wallet_id int8 NOT NULL, task_id int8 NULL, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT proofshare_client_sender_pkey PRIMARY KEY (wallet_id), CONSTRAINT proofshare_client_sender_task_id_fkey FOREIGN KEY (task_id) REFERENCES harmony_task(id) ON DELETE SET NULL);

-- Permissions

ALTER TABLE proofshare_client_sender OWNER TO yugabyte;
GRANT ALL ON TABLE proofshare_client_sender TO yugabyte;


-- curio.sector_path_url_liveness definition

-- Drop table

-- DROP TABLE sector_path_url_liveness;

CREATE TABLE sector_path_url_liveness ( storage_id text NOT NULL, url text NOT NULL, last_checked timestamptz NOT NULL, last_live timestamptz NULL, last_dead timestamptz NULL, last_dead_reason text NULL, CONSTRAINT sector_path_url_liveness_pkey PRIMARY KEY (storage_id, url), CONSTRAINT sector_path_url_liveness_storage_id_fkey FOREIGN KEY (storage_id) REFERENCES storage_path(storage_id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE sector_path_url_liveness OWNER TO yugabyte;
GRANT ALL ON TABLE sector_path_url_liveness TO yugabyte;


-- curio.sectors_meta_pieces definition

-- Drop table

-- DROP TABLE sectors_meta_pieces;

CREATE TABLE sectors_meta_pieces ( sp_id int8 NOT NULL, sector_num int8 NOT NULL, piece_num int8 NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, requested_keep_data bool NOT NULL, raw_data_size int8 NULL, start_epoch int8 NULL, orig_end_epoch int8 NULL, f05_deal_id int8 NULL, ddo_pam jsonb NULL, f05_deal_proposal jsonb NULL, CONSTRAINT sectors_meta_pieces_pkey PRIMARY KEY (sp_id, sector_num, piece_num), CONSTRAINT sectors_meta_pieces_sp_id_fkey FOREIGN KEY (sp_id,sector_num) REFERENCES sectors_meta(sp_id,sector_num) ON DELETE CASCADE);

-- Permissions

ALTER TABLE sectors_meta_pieces OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_meta_pieces TO yugabyte;


-- curio.sectors_sdr_initial_pieces definition

-- Drop table

-- DROP TABLE sectors_sdr_initial_pieces;

CREATE TABLE sectors_sdr_initial_pieces ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, piece_index int8 NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, data_url text NOT NULL, data_headers jsonb DEFAULT '{}'::jsonb NOT NULL, data_raw_size int8 NOT NULL, data_delete_on_finalize bool NOT NULL, f05_publish_cid text NULL, f05_deal_id int8 NULL, f05_deal_proposal jsonb NULL, f05_deal_start_epoch int8 NULL, f05_deal_end_epoch int8 NULL, direct_start_epoch int8 NULL, direct_end_epoch int8 NULL, direct_piece_activation_manifest jsonb NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT sectors_sdr_initial_pieces_pkey PRIMARY KEY (sp_id, sector_number, piece_index), CONSTRAINT sectors_sdr_initial_pieces_sp_id_fkey FOREIGN KEY (sp_id,sector_number) REFERENCES sectors_sdr_pipeline(sp_id,sector_number) ON DELETE CASCADE);

-- Column comments

COMMENT ON COLUMN curio.sectors_sdr_initial_pieces.piece_size IS 'padded size of the piece';

-- Permissions

ALTER TABLE sectors_sdr_initial_pieces OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_sdr_initial_pieces TO yugabyte;


-- curio.sectors_snap_pipeline definition

-- Drop table

-- DROP TABLE sectors_snap_pipeline;

CREATE TABLE sectors_snap_pipeline ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, start_time timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, upgrade_proof int4 NOT NULL, data_assigned bool DEFAULT true NOT NULL, update_unsealed_cid text NULL, update_sealed_cid text NULL, task_id_encode int8 NULL, after_encode bool DEFAULT false NOT NULL, proof bytea NULL, task_id_prove int8 NULL, after_prove bool DEFAULT false NOT NULL, prove_msg_cid text NULL, task_id_submit int8 NULL, after_submit bool DEFAULT false NOT NULL, after_prove_msg_success bool DEFAULT false NOT NULL, prove_msg_tsk bytea NULL, task_id_move_storage int8 NULL, after_move_storage bool DEFAULT false NOT NULL, failed bool DEFAULT false NOT NULL, failed_at timestamptz NULL, failed_reason varchar(20) DEFAULT ''::character varying NOT NULL, failed_reason_msg text DEFAULT ''::text NOT NULL, submit_after timestamptz NULL, update_ready_at timestamptz NULL, CONSTRAINT sectors_snap_pipeline_pkey PRIMARY KEY (sp_id, sector_number), CONSTRAINT sectors_snap_pipeline_sp_id_fkey FOREIGN KEY (sp_id,sector_number) REFERENCES sectors_meta(sp_id,sector_num));

-- Table Triggers

create trigger update_sectors_meta_is_cc_on_delete after
delete
    on
    curio.sectors_snap_pipeline for each row execute procedure curio.update_sectors_meta_is_cc();
create trigger update_sectors_meta_is_cc_on_insert after
insert
    on
    curio.sectors_snap_pipeline for each row execute procedure curio.update_sectors_meta_is_cc();
create trigger update_sectors_meta_is_cc_on_update after
update
    on
    curio.sectors_snap_pipeline for each row execute procedure curio.update_sectors_meta_is_cc();
create trigger update_update_ready_at after
insert
    or
delete
    or
update
    on
    curio.sectors_snap_pipeline for each row execute procedure curio.set_update_ready_at();

-- Permissions

ALTER TABLE sectors_snap_pipeline OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_snap_pipeline TO yugabyte;


-- curio.wallet_exporter_watched_msgs definition

-- Drop table

-- DROP TABLE wallet_exporter_watched_msgs;

CREATE TABLE wallet_exporter_watched_msgs ( msg_cid text NOT NULL, observed_landed bool DEFAULT false NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT wallet_exporter_watched_msgs_pkey PRIMARY KEY (msg_cid), CONSTRAINT wallet_exporter_watched_msgs_msg_cid_fkey FOREIGN KEY (msg_cid) REFERENCES message_waits(signed_message_cid) ON DELETE CASCADE);
CREATE INDEX wallet_exporter_watched_msgs_observed_landed ON curio.wallet_exporter_watched_msgs USING lsm (created_at ASC);
CREATE INDEX wallet_exporter_watched_msgs_observed_landed_idx ON curio.wallet_exporter_watched_msgs USING lsm (observed_landed HASH);

-- Permissions

ALTER TABLE wallet_exporter_watched_msgs OWNER TO yugabyte;
GRANT ALL ON TABLE wallet_exporter_watched_msgs TO yugabyte;


-- curio.f3_tasks definition

-- Drop table

-- DROP TABLE f3_tasks;

CREATE TABLE f3_tasks ( sp_id int8 NOT NULL, task_id int8 NULL, previous_ticket bytea NULL, CONSTRAINT f3_tasks_pkey PRIMARY KEY (sp_id), CONSTRAINT f3_tasks_task_id_key UNIQUE (task_id), CONSTRAINT f3_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES harmony_task(id) ON DELETE SET NULL);

-- Permissions

ALTER TABLE f3_tasks OWNER TO yugabyte;
GRANT ALL ON TABLE f3_tasks TO yugabyte;


-- curio.sectors_snap_initial_pieces definition

-- Drop table

-- DROP TABLE sectors_snap_initial_pieces;

CREATE TABLE sectors_snap_initial_pieces ( sp_id int8 NOT NULL, sector_number int8 NOT NULL, created_at timestamptz NOT NULL, piece_index int8 NOT NULL, piece_cid text NOT NULL, piece_size int8 NOT NULL, data_url text NOT NULL, data_headers jsonb DEFAULT '{}'::jsonb NOT NULL, data_raw_size int8 NOT NULL, data_delete_on_finalize bool NOT NULL, direct_start_epoch int8 NULL, direct_end_epoch int8 NULL, direct_piece_activation_manifest jsonb NULL, CONSTRAINT sectors_snap_initial_pieces_pkey PRIMARY KEY (sp_id, sector_number, piece_index), CONSTRAINT sectors_snap_initial_pieces_sp_id_fkey FOREIGN KEY (sp_id,sector_number) REFERENCES sectors_snap_pipeline(sp_id,sector_number) ON DELETE CASCADE);

-- Permissions

ALTER TABLE sectors_snap_initial_pieces OWNER TO yugabyte;
GRANT ALL ON TABLE sectors_snap_initial_pieces TO yugabyte;



-- DROP FUNCTION curio.adjust_proofset_refcount_on_update();

CREATE OR REPLACE FUNCTION curio.adjust_proofset_refcount_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.pdp_pieceref IS DISTINCT FROM NEW.pdp_pieceref THEN
        IF OLD.pdp_pieceref IS NOT NULL THEN
            UPDATE pdp_piecerefs
            SET proofset_refcount = proofset_refcount - 1
            WHERE id = OLD.pdp_pieceref;
        END IF;
        IF NEW.pdp_pieceref IS NOT NULL THEN
            UPDATE pdp_piecerefs
            SET proofset_refcount = proofset_refcount + 1
            WHERE id = NEW.pdp_pieceref;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.adjust_proofset_refcount_on_update() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.adjust_proofset_refcount_on_update() TO yugabyte;

-- DROP FUNCTION curio.append_sector_pipeline_events(int8, int8, int8);

CREATE OR REPLACE FUNCTION curio.append_sector_pipeline_events(sp_id_param bigint, sector_number_param bigint, task_history_id_param bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO sectors_pipeline_events (sp_id, sector_number, task_history_id)
    VALUES (sp_id_param, sector_number_param, task_history_id_param)
    ON CONFLICT (sp_id, sector_number, task_history_id) DO NOTHING;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.append_sector_pipeline_events(int8, int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.append_sector_pipeline_events(int8, int8, int8) TO yugabyte;

-- DROP FUNCTION curio.create_indexing_task(int8, text);

CREATE OR REPLACE FUNCTION curio.create_indexing_task(task_id bigint, sealing_table text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    query TEXT;   -- Holds the dynamic SQL query
    pms RECORD;   -- Holds each row returned by the query in the loop
BEGIN
    IF sealing_table = 'sectors_sdr_pipeline' THEN
        query := format(
                'SELECT
                    dp.uuid,
                    ssp.reg_seal_proof
                FROM
                    %I ssp
                JOIN
                    market_mk12_deal_pipeline dp ON ssp.sp_id = dp.sp_id AND ssp.sector_number = dp.sector
                WHERE
                    ssp.task_id_move_storage = $1', sealing_table);
    ELSIF sealing_table = 'sectors_snap_pipeline' THEN
        query := format(
                'SELECT
                    dp.uuid,
                    (SELECT reg_seal_proof FROM sectors_meta WHERE sp_id = ssp.sp_id AND sector_num = ssp.sector_number) AS reg_seal_proof
                FROM
                    %I ssp
                JOIN
                    market_mk12_deal_pipeline dp ON ssp.sp_id = dp.sp_id AND ssp.sector_number = dp.sector
                WHERE
                    ssp.task_id_move_storage = $1', sealing_table);
    ELSE
        RAISE EXCEPTION 'Invalid sealing_table name: %', sealing_table;
    END IF;
    FOR pms IN EXECUTE query USING task_id
        LOOP
            UPDATE market_mk12_deal_pipeline
            SET
                reg_seal_proof = pms.reg_seal_proof,
                indexing_created_at = NOW() AT TIME ZONE 'UTC'
            WHERE
                uuid = pms.uuid;
        END LOOP;
    RETURN;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create indexing task: %', SQLERRM;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.create_indexing_task(int8, text) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.create_indexing_task(int8, text) TO yugabyte;

-- DROP FUNCTION curio.decrement_proofset_refcount();

CREATE OR REPLACE FUNCTION curio.decrement_proofset_refcount()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE pdp_piecerefs
    SET proofset_refcount = proofset_refcount - 1
    WHERE id = OLD.pdp_pieceref;
    RETURN OLD;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.decrement_proofset_refcount() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.decrement_proofset_refcount() TO yugabyte;

-- DROP FUNCTION curio.enforce_name_naming_convention();

CREATE OR REPLACE FUNCTION curio.enforce_name_naming_convention()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.name !~ '^[A-Za-z0-9_-]+$' THEN
        RAISE EXCEPTION 'Invalid value for name: "%". Only letters, numbers, underscores, and hyphens are allowed.', NEW.name;
END IF;
RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.enforce_name_naming_convention() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.enforce_name_naming_convention() TO yugabyte;

-- DROP FUNCTION curio.enforce_unique_peers();

CREATE OR REPLACE FUNCTION curio.enforce_unique_peers()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (SELECT COUNT(*) FROM unnest(NEW.peer_ids) AS p GROUP BY p HAVING COUNT(*) > 1) > 0 THEN
        RAISE EXCEPTION 'peer_ids array contains duplicate values';
END IF;
RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.enforce_unique_peers() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.enforce_unique_peers() TO yugabyte;

-- DROP FUNCTION curio.enforce_unique_pricing_filters();

CREATE OR REPLACE FUNCTION curio.enforce_unique_pricing_filters()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (SELECT COUNT(*) FROM unnest(NEW.pricing_filters) AS pf GROUP BY pf HAVING COUNT(*) > 1) > 0 THEN
        RAISE EXCEPTION 'pricing_filters array contains duplicate values';
END IF;
RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.enforce_unique_pricing_filters() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.enforce_unique_pricing_filters() TO yugabyte;

-- DROP FUNCTION curio.enforce_unique_wallets();

CREATE OR REPLACE FUNCTION curio.enforce_unique_wallets()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (SELECT COUNT(*) FROM unnest(NEW.wallets) AS w GROUP BY w HAVING COUNT(*) > 1) > 0 THEN
        RAISE EXCEPTION 'wallets array contains duplicate values';
END IF;
RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.enforce_unique_wallets() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.enforce_unique_wallets() TO yugabyte;

-- DROP FUNCTION curio.get_ad_chain(text, text);

CREATE OR REPLACE FUNCTION curio.get_ad_chain(_provider text, _ad_cid text)
 RETURNS TABLE(ad_cid text, context_id bytea, is_rm boolean, previous text, provider text, addresses text, signature bytea, entries text, order_number bigint)
 LANGUAGE plpgsql
AS $function$
DECLARE
_order_number BIGINT;
BEGIN
    SELECT order_number INTO _order_number
    FROM ipni
    WHERE ad_cid = _ad_cid AND provider = _provider;
    RETURN QUERY
    SELECT ad_cid, context_id, is_rm, previous, provider, addresses, signature, entries, order_number
    FROM ipni
    WHERE provider = _provider AND order_number <= _order_number
    ORDER BY order_number ASC;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.get_ad_chain(text, text) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.get_ad_chain(text, text) TO yugabyte;

-- DROP FUNCTION curio.get_sdr_pipeline_tasks(int8, int8);

CREATE OR REPLACE FUNCTION curio.get_sdr_pipeline_tasks(sp_id_param bigint, sector_number_param bigint)
 RETURNS bigint[]
 LANGUAGE plpgsql
AS $function$
DECLARE
    task_ids bigint[];
BEGIN
    SELECT ARRAY_REMOVE(ARRAY[
                            task_id_sdr,
                            task_id_tree_d,
                            task_id_tree_c,
                            task_id_tree_r,
                            task_id_precommit_msg,
                            task_id_porep,
                            task_id_finalize,
                            task_id_move_storage,
                            task_id_commit_msg
                            ], NULL)
    INTO task_ids
    FROM sectors_sdr_pipeline
    WHERE sp_id = sp_id_param
      AND sector_number = sector_number_param;
    RETURN task_ids;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.get_sdr_pipeline_tasks(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.get_sdr_pipeline_tasks(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.get_snap_pipeline_tasks(int8, int8);

CREATE OR REPLACE FUNCTION curio.get_snap_pipeline_tasks(sp_id_param bigint, sector_number_param bigint)
 RETURNS bigint[]
 LANGUAGE plpgsql
AS $function$
DECLARE
    task_ids bigint[];
BEGIN
    SELECT ARRAY_REMOVE(ARRAY[
                            task_id_encode,
                            task_id_prove,
                            task_id_submit,
                            task_id_move_storage
                            ], NULL)
    INTO task_ids
    FROM sectors_snap_pipeline
    WHERE sp_id = sp_id_param
      AND sector_number = sector_number_param;
    RETURN task_ids;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.get_snap_pipeline_tasks(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.get_snap_pipeline_tasks(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.increment_proofset_refcount();

CREATE OR REPLACE FUNCTION curio.increment_proofset_refcount()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE pdp_piecerefs
    SET proofset_refcount = proofset_refcount + 1
    WHERE id = NEW.pdp_pieceref;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.increment_proofset_refcount() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.increment_proofset_refcount() TO yugabyte;

-- DROP FUNCTION curio.insert_ad_and_update_head(text, bytea, text, int8, bool, text, text, bytea, text);

CREATE OR REPLACE FUNCTION curio.insert_ad_and_update_head(_ad_cid text, _context_id bytea, _piece_cid text, _piece_size bigint, _is_rm boolean, _provider text, _addresses text, _signature bytea, _entries text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
_previous TEXT;
BEGIN
    SELECT head INTO _previous
    FROM ipni_head
    WHERE provider = _provider;
    INSERT INTO ipni (ad_cid, context_id, is_rm, previous, provider, addresses, signature, entries, piece_cid, piece_size)
    VALUES (_ad_cid, _context_id, _is_rm, _previous, _provider, _addresses, _signature, _entries, _piece_cid, _piece_size);
    INSERT INTO ipni_head (provider, head)
    VALUES (_provider, _ad_cid)
        ON CONFLICT (provider) DO UPDATE SET head = EXCLUDED.head;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.insert_ad_and_update_head(text, bytea, text, int8, bool, text, text, bytea, text) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.insert_ad_and_update_head(text, bytea, text, int8, bool, text, text, bytea, text) TO yugabyte;

-- DROP FUNCTION curio.insert_ipni_task(int8, int8, int4, int8, bytea, bool, text, int8);

CREATE OR REPLACE FUNCTION curio.insert_ipni_task(_sp_id bigint, _sector bigint, _reg_seal_proof integer, _sector_offset bigint, _context_id bytea, _is_rm boolean, _provider text, _task_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    _existing_is_rm BOOLEAN;
    _latest_is_rm BOOLEAN;
BEGIN
    SELECT is_rm INTO _existing_is_rm
    FROM ipni_task
    WHERE provider = _provider AND context_id = _context_id AND is_rm != _is_rm
        LIMIT 1;
    IF FOUND THEN
            INSERT INTO ipni_task (sp_id, sector, reg_seal_proof, sector_offset, provider, context_id, is_rm, created_at, task_id, complete)
            VALUES (_sp_id, _sector, _reg_seal_proof, _sector_offset, _provider, _context_id, _is_rm, TIMEZONE('UTC', NOW()), _task_id, FALSE);
            RETURN;
    END IF;
    SELECT is_rm INTO _latest_is_rm
    FROM ipni
    WHERE provider = _provider AND context_id = _context_id
    ORDER BY order_number DESC
        LIMIT 1;
    IF FOUND AND _latest_is_rm = _is_rm THEN
            RAISE EXCEPTION 'already published';
    END IF;
    INSERT INTO ipni_task (sp_id, sector, reg_seal_proof, sector_offset, provider, context_id, is_rm, created_at, task_id, complete)
    VALUES (_sp_id, _sector, _reg_seal_proof, _sector_offset, _provider, _context_id, _is_rm, TIMEZONE('UTC', NOW()), _task_id, FALSE);
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.insert_ipni_task(int8, int8, int4, int8, bytea, bool, text, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.insert_ipni_task(int8, int8, int4, int8, bytea, bool, text, int8) TO yugabyte;

-- DROP FUNCTION curio.insert_sector_ddo_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, int8, int8, jsonb);

CREATE OR REPLACE FUNCTION curio.insert_sector_ddo_piece(v_sp_id bigint, v_sector_number bigint, v_piece_index bigint, v_piece_cid text, v_piece_size bigint, v_data_url text, v_data_headers jsonb, v_data_raw_size bigint, v_data_delete_on_finalize boolean, v_direct_start_epoch bigint, v_direct_end_epoch bigint, v_direct_piece_activation_manifest jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
INSERT INTO open_sector_pieces (
    sp_id,
    sector_number,
    piece_index,
    created_at,
    piece_cid,
    piece_size,
    data_url,
    data_headers,
    data_raw_size,
    data_delete_on_finalize,
    direct_start_epoch,
    direct_end_epoch,
    direct_piece_activation_manifest
) VALUES (
             v_sp_id,
             v_sector_number,
             v_piece_index,
             NOW(),
             v_piece_cid,
             v_piece_size,
             v_data_url,
             v_data_headers,
             v_data_raw_size,
             v_data_delete_on_finalize,
             v_direct_start_epoch,
             v_direct_end_epoch,
             v_direct_piece_activation_manifest
         ) ON CONFLICT (sp_id, sector_number, piece_index) DO NOTHING;
IF NOT FOUND THEN
        RAISE EXCEPTION 'Conflict detected for piece_index %', v_piece_index;
END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.insert_sector_ddo_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, int8, int8, jsonb) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.insert_sector_ddo_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, int8, int8, jsonb) TO yugabyte;

-- DROP FUNCTION curio.insert_sector_market_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, text, int8, jsonb, int8, int8);

CREATE OR REPLACE FUNCTION curio.insert_sector_market_piece(v_sp_id bigint, v_sector_number bigint, v_piece_index bigint, v_piece_cid text, v_piece_size bigint, v_data_url text, v_data_headers jsonb, v_data_raw_size bigint, v_data_delete_on_finalize boolean, v_f05_publish_cid text, v_f05_deal_id bigint, v_f05_deal_proposal jsonb, v_f05_deal_start_epoch bigint, v_f05_deal_end_epoch bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
INSERT INTO open_sector_pieces (
    sp_id,
    sector_number,
    piece_index,
    created_at,
    piece_cid,
    piece_size,
    data_url,
    data_headers,
    data_raw_size,
    data_delete_on_finalize,
    f05_publish_cid,
    f05_deal_id,
    f05_deal_proposal,
    f05_deal_start_epoch,
    f05_deal_end_epoch
) VALUES (
             v_sp_id,
             v_sector_number,
             v_piece_index,
             NOW(),
             v_piece_cid,
             v_piece_size,
             v_data_url,
             v_data_headers,
             v_data_raw_size,
             v_data_delete_on_finalize,
             v_f05_publish_cid,
             v_f05_deal_id,
             v_f05_deal_proposal,
             v_f05_deal_start_epoch,
             v_f05_deal_end_epoch
         ) ON CONFLICT (sp_id, sector_number, piece_index) DO NOTHING;
IF NOT FOUND THEN
            RAISE EXCEPTION 'Conflict detected for piece_index %', v_piece_index;
END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.insert_sector_market_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, text, int8, jsonb, int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.insert_sector_market_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, text, int8, jsonb, int8, int8) TO yugabyte;

-- DROP FUNCTION curio.insert_snap_ddo_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, int8, int8, jsonb);

CREATE OR REPLACE FUNCTION curio.insert_snap_ddo_piece(v_sp_id bigint, v_sector_number bigint, v_piece_index bigint, v_piece_cid text, v_piece_size bigint, v_data_url text, v_data_headers jsonb, v_data_raw_size bigint, v_data_delete_on_finalize boolean, v_direct_start_epoch bigint, v_direct_end_epoch bigint, v_direct_piece_activation_manifest jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO open_sector_pieces (
        sp_id,
        sector_number,
        piece_index,
        created_at,
        piece_cid,
        piece_size,
        data_url,
        data_headers,
        data_raw_size,
        data_delete_on_finalize,
        direct_start_epoch,
        direct_end_epoch,
        direct_piece_activation_manifest,
        is_snap
    ) VALUES (
                 v_sp_id,
                 v_sector_number,
                 v_piece_index,
                 NOW(),
                 v_piece_cid,
                 v_piece_size,
                 v_data_url,
                 v_data_headers,
                 v_data_raw_size,
                 v_data_delete_on_finalize,
                 v_direct_start_epoch,
                 v_direct_end_epoch,
                 v_direct_piece_activation_manifest,
                 TRUE
             ) ON CONFLICT (sp_id, sector_number, piece_index) DO NOTHING;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conflict detected for piece_index %', v_piece_index;
    END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.insert_snap_ddo_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, int8, int8, jsonb) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.insert_snap_ddo_piece(int8, int8, int8, text, int8, text, jsonb, int8, bool, int8, int8, jsonb) TO yugabyte;

-- DROP FUNCTION curio.migrate_deal_pipeline_entries();

CREATE OR REPLACE FUNCTION curio.migrate_deal_pipeline_entries()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    num_entries_ready_for_indexing INTEGER;
    num_pending_ipni_tasks INTEGER;
    num_entries_needed INTEGER;
    num_entries_to_move INTEGER;
    cnt INTEGER;
    moved_rows RECORD;
    total_moved INTEGER := 0;  -- Initialize total moved count
BEGIN
    SELECT COUNT(*) INTO cnt FROM market_mk12_deal_pipeline_migration LIMIT 16;
    IF cnt = 0 THEN
            RETURN 0; -- Return 0 if no entries to migrate
    END IF;
    SELECT COUNT(*) INTO num_entries_ready_for_indexing
    FROM market_mk12_deal_pipeline
    WHERE sealed = TRUE AND should_index = TRUE AND indexed = FALSE LIMIT 16;
    SELECT COUNT(*) INTO num_pending_ipni_tasks
    FROM harmony_task
    WHERE name = 'IPNI' AND owner_id IS NULL LIMIT 16;
    num_entries_needed := 16 - num_entries_ready_for_indexing;
    IF num_entries_needed <= 0 THEN
        RETURN 0;
    END IF;
    num_entries_to_move := LEAST(num_entries_needed, 16 - num_pending_ipni_tasks);
    SELECT COUNT(*) INTO cnt FROM market_mk12_deal_pipeline_migration LIMIT 16;
    num_entries_to_move := LEAST(num_entries_to_move, cnt);
    IF num_entries_to_move <= 0 THEN
        RETURN 0;
    END IF;
    FOR moved_rows IN
    SELECT uuid, sp_id, piece_cid, piece_size, raw_size, sector, reg_seal_proof, sector_offset, should_announce
    FROM market_mk12_deal_pipeline_migration
             LIMIT num_entries_to_move
    LOOP
        INSERT INTO market_mk12_deal_pipeline (
            uuid, sp_id, started, piece_cid, piece_size, raw_size, offline,
            after_commp, after_psd, after_find_deal, sector, reg_seal_proof, sector_offset,
            sealed, should_index, indexing_created_at, announce
            ) VALUES (
            moved_rows.uuid, moved_rows.sp_id, TRUE, moved_rows.piece_cid, moved_rows.piece_size, moved_rows.raw_size, FALSE,
            TRUE, TRUE, TRUE, moved_rows.sector, moved_rows.reg_seal_proof, moved_rows.sector_offset,
            TRUE, TRUE, NOW() AT TIME ZONE 'UTC', moved_rows.should_announce
            ) ON CONFLICT (uuid) DO NOTHING;
        DELETE FROM market_mk12_deal_pipeline_migration WHERE uuid = moved_rows.uuid;
        total_moved := total_moved + 1;
    END LOOP;
    RETURN total_moved;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.migrate_deal_pipeline_entries() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.migrate_deal_pipeline_entries() TO yugabyte;

-- DROP FUNCTION curio.poll_start_batch_commit_msg(int8, int8, int4, int8, bool, int4);

CREATE OR REPLACE FUNCTION curio.poll_start_batch_commit_msg(p_slack_epoch bigint, p_current_height bigint, p_max_batch integer, p_new_task_id bigint, p_basefee_ok boolean, p_timeout_secs integer)
 RETURNS TABLE(updated_count bigint, reason text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    batch_rec RECORD;
    cond_slack   BOOLEAN;
    cond_timeout BOOLEAN;
    cond_fee     BOOLEAN;
BEGIN
    updated_count := 0;
    reason        := 'NONE';
    /*
      Single query logic:
        (1) Select the rows that need commit assignment.
        (2) Partition them by (sp_id, reg_seal_proof), using ROW_NUMBER() to break
            them into sub-batches of size p_max_batch.
        (3) GROUP those sub-batches to get:
            - batch_start_epoch = min(start_epoch)
            - earliest_ready_at = min(commit_ready_at)
            - sector_nums = array of sector_number
        (4) Loop over results, check conditions, update if found, return count.
        (5) If we finish the loop, return 0.
    */
    FOR batch_rec IN
        WITH locked AS (
            SELECT
                sp_id,
                sector_number,
                start_epoch,
                commit_ready_at,
                reg_seal_proof
            FROM sectors_sdr_pipeline
            WHERE after_porep        = TRUE
              AND porep_proof        IS NOT NULL
              AND task_id_commit_msg IS NULL
              AND after_commit_msg   = FALSE
              AND start_epoch        IS NOT NULL
            ORDER BY sp_id, reg_seal_proof, start_epoch
        ),
        numbered AS (
            SELECT
              l.*,
              ROW_NUMBER() OVER (
                PARTITION BY l.sp_id, l.reg_seal_proof
                ORDER BY l.commit_ready_at
              ) AS rn
            FROM locked l
        ),
        chunked AS (
            SELECT
              sp_id,
              reg_seal_proof,
              FLOOR((rn - 1)::NUMERIC / p_max_batch) AS batch_index,
              start_epoch,
              commit_ready_at,
              sector_number
            FROM numbered
        ),
        grouped AS (
            SELECT
              sp_id,
              reg_seal_proof,
              batch_index,
              MIN(start_epoch)               AS batch_start_epoch,
              MIN(commit_ready_at)           AS earliest_ready_at,
              ARRAY_AGG(sector_number)       AS sector_nums
            FROM chunked
            GROUP BY sp_id, reg_seal_proof, batch_index
            ORDER BY sp_id, reg_seal_proof, batch_index
        )
        SELECT
            sp_id,
            reg_seal_proof,
            sector_nums,
            batch_start_epoch,
            earliest_ready_at
        FROM grouped
    LOOP
        cond_slack   := ((batch_rec.batch_start_epoch - p_slack_epoch) <= p_current_height);
        cond_timeout := (NOW() >= (batch_rec.earliest_ready_at + MAKE_INTERVAL(secs => p_timeout_secs)));
        cond_fee     := p_basefee_ok;  -- user-supplied boolean
        IF (cond_slack OR cond_timeout OR cond_fee) THEN
            IF cond_slack THEN
                reason := 'SLACK (min start epoch: ' || batch_rec.batch_start_epoch || ')';
            ELSIF cond_timeout THEN
                reason := 'TIMEOUT (earliest_ready_at: ' || batch_rec.earliest_ready_at || ')';
            ELSIF cond_fee THEN
                reason := 'FEE';
            END IF;
            UPDATE sectors_sdr_pipeline t
                SET task_id_commit_msg = p_new_task_id
            WHERE t.sp_id         = batch_rec.sp_id
                AND t.reg_seal_proof = batch_rec.reg_seal_proof
                AND t.sector_number = ANY(batch_rec.sector_nums)
                AND t.after_porep = TRUE
                AND t.task_id_commit_msg IS NULL
                AND t.after_commit_msg = FALSE;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            RETURN NEXT;
            RETURN;  -- Return immediately with updated_count and reason
        END IF;
    END LOOP;
    RETURN NEXT;
    RETURN;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.poll_start_batch_commit_msg(int8, int8, int4, int8, bool, int4) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.poll_start_batch_commit_msg(int8, int8, int4, int8, bool, int4) TO yugabyte;

-- DROP FUNCTION curio.poll_start_batch_commit_msgs(int8, int8, int4, int8, int4);

CREATE OR REPLACE FUNCTION curio.poll_start_batch_commit_msgs(p_slack_epoch bigint, p_current_height bigint, p_max_batch integer, p_new_task_id bigint, p_timeout_secs integer)
 RETURNS TABLE(updated_count bigint, reason text)
 LANGUAGE plpgsql
AS $function$
DECLARE
batch_rec RECORD;
    cond_slack   BOOLEAN;
    cond_timeout BOOLEAN;
    cond_fee     BOOLEAN;
BEGIN
    updated_count := 0;
    reason        := 'NONE';
    /*
      Single query logic:
        (1) Select the rows that need commit assignment.
        (2) Partition them by (sp_id, reg_seal_proof), using ROW_NUMBER() to break
            them into sub-batches of size p_max_batch.
        (3) GROUP those sub-batches to get:
            - batch_start_epoch = min(start_epoch)
            - earliest_ready_at = min(commit_ready_at)
            - sector_nums = array of sector_number
        (4) Loop over results, check conditions, update if found, return count.
        (5) If we finish the loop, return 0.
    */
FOR batch_rec IN
        WITH initial AS (
            SELECT
                sp_id,
                sector_number,
                start_epoch,
                commit_ready_at,
                reg_seal_proof
            FROM sectors_sdr_pipeline
            WHERE after_porep        = TRUE
              AND porep_proof        IS NOT NULL
              AND task_id_commit_msg IS NULL
              AND after_commit_msg   = FALSE
              AND start_epoch        IS NOT NULL
            ORDER BY sp_id, reg_seal_proof, start_epoch
        ),
        numbered AS (
            SELECT
              l.*,
              ROW_NUMBER() OVER (
                PARTITION BY l.sp_id, l.reg_seal_proof
                ORDER BY l.commit_ready_at
              ) AS rn
            FROM initial l
        ),
        chunked AS (
            SELECT
              sp_id,
              reg_seal_proof,
              FLOOR((rn - 1)::NUMERIC / p_max_batch) AS batch_index,
              start_epoch,
              commit_ready_at,
              sector_number
            FROM numbered
        ),
        grouped AS (
            SELECT
              sp_id,
              reg_seal_proof,
              batch_index,
              MIN(start_epoch)               AS batch_start_epoch,
              MIN(commit_ready_at)           AS earliest_ready_at,
              ARRAY_AGG(sector_number)       AS sector_nums
            FROM chunked
            GROUP BY sp_id, reg_seal_proof, batch_index
            ORDER BY sp_id, reg_seal_proof, batch_index
        )
        SELECT
            sp_id,
            reg_seal_proof,
            sector_nums,
            batch_start_epoch,
            earliest_ready_at
        FROM grouped
        LOOP
            cond_slack   := ((batch_rec.batch_start_epoch - p_slack_epoch) <= p_current_height);
            cond_timeout := ((batch_rec.earliest_ready_at + MAKE_INTERVAL(secs => p_timeout_secs)) < NOW() AT TIME ZONE 'UTC');
            IF (cond_slack OR cond_timeout OR cond_fee) THEN
                IF cond_slack THEN
                    reason := 'SLACK (min start epoch: ' || batch_rec.batch_start_epoch || ')';
                ELSIF cond_timeout THEN
                    reason := 'TIMEOUT (earliest_ready_at: ' || batch_rec.earliest_ready_at || ')';
                END IF;
                UPDATE sectors_sdr_pipeline t
                SET task_id_commit_msg = p_new_task_id
                WHERE t.sp_id         = batch_rec.sp_id
                  AND t.reg_seal_proof = batch_rec.reg_seal_proof
                  AND t.sector_number = ANY(batch_rec.sector_nums)
                  AND t.after_porep = TRUE
                  AND t.task_id_commit_msg IS NULL
                  AND t.after_commit_msg = FALSE;
                GET DIAGNOSTICS updated_count = ROW_COUNT;
                RETURN NEXT;
                RETURN;  -- Return immediately with updated_count and reason
            END IF;
        END LOOP;
    RETURN NEXT;
    RETURN;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.poll_start_batch_commit_msgs(int8, int8, int4, int8, int4) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.poll_start_batch_commit_msgs(int8, int8, int4, int8, int4) TO yugabyte;

-- DROP FUNCTION curio.poll_start_batch_precommit_msg(int8, int8, int8, int4, int8, bool, int4);

CREATE OR REPLACE FUNCTION curio.poll_start_batch_precommit_msg(p_randomnesslookback bigint, p_slack_epoch bigint, p_current_height bigint, p_max_batch integer, p_new_task_id bigint, p_basefee_ok boolean, p_timeout_secs integer)
 RETURNS TABLE(updated_count bigint, reason text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    batch_rec RECORD;
    cond_slack   BOOLEAN;
    cond_timeout BOOLEAN;
    cond_fee     BOOLEAN;
BEGIN
    updated_count := 0;
    reason        := 'NONE';
    /*
      We'll do all logic in a single CTE chain, which:
        (1) Select relevant rows in "sectors_sdr_pipeline".
        (2) Computes each row's "start_epoch" by coalescing data from
            sectors_sdr_initial_pieces or fallback.
        (3) Numbers them per group, forming sub-batches of size p_max_batch.
        (4) Groups by (sp_id, reg_seal_proof, batch_index).
        (5) Finally selects sp_id, reg_seal_proof, an array of sector_numbers,
            plus the min start_epoch and earliest_ready for each batch.
      Then we loop over those grouped results in ascending order.
    */
    FOR batch_rec IN
        WITH locked AS (
            SELECT
              p.sp_id,
              p.sector_number,
              COALESCE(
                (
                  SELECT MIN(LEAST(s.f05_deal_start_epoch, s.direct_start_epoch))
                    FROM sectors_sdr_initial_pieces s
                   WHERE s.sp_id = p.sp_id
                     AND s.sector_number = p.sector_number
                ),
                p.ticket_epoch + p_randomnessLookBack
              ) AS start_epoch,
              p.precommit_ready_at,
              p.reg_seal_proof
            FROM sectors_sdr_pipeline p
            WHERE p.after_synth = TRUE
              AND p.task_id_precommit_msg IS NULL
              AND p.after_precommit_msg = FALSE
            ORDER BY p.sp_id, p.reg_seal_proof
        ),
        numbered AS (
            SELECT
              l.*,
              ROW_NUMBER() OVER (
                PARTITION BY l.sp_id, l.reg_seal_proof
                ORDER BY l.start_epoch
              ) AS rn
            FROM locked l
        ),
        chunked AS (
            SELECT
              sp_id,
              reg_seal_proof,
              FLOOR((rn - 1)::NUMERIC / p_max_batch) AS batch_index,
              start_epoch,
              precommit_ready_at,
              sector_number
            FROM numbered
        ),
        grouped AS (
            SELECT
              sp_id,
              reg_seal_proof,
              batch_index,
              MIN(start_epoch)               AS min_start_epoch,
              MIN(precommit_ready_at)        AS earliest_ready,
              ARRAY_AGG(sector_number)       AS sector_nums
            FROM chunked
            GROUP BY sp_id, reg_seal_proof, batch_index
            ORDER BY sp_id, reg_seal_proof, batch_index
        )
        SELECT
            sp_id,
            reg_seal_proof,
            sector_nums,
            min_start_epoch,
            earliest_ready
        FROM grouped
    LOOP
        cond_slack   := ((batch_rec.min_start_epoch - p_slack_epoch) <= p_current_height);
        cond_timeout := ((batch_rec.earliest_ready + MAKE_INTERVAL(secs => p_timeout_secs)) < NOW() AT TIME ZONE 'UTC');
        cond_fee     := p_basefee_ok;
        IF (cond_slack OR cond_timeout OR cond_fee) THEN
            IF cond_slack THEN
                reason := 'SLACK (min start epoch: ' || batch_rec.min_start_epoch || ')';
            ELSIF cond_timeout THEN
                reason := 'TIMEOUT (earliest_ready_at: ' || batch_rec.earliest_ready || ')';
            ELSIF cond_fee THEN
                reason := 'FEE';
            END IF;
            UPDATE sectors_sdr_pipeline t
                SET task_id_precommit_msg = p_new_task_id
            WHERE t.sp_id = batch_rec.sp_id
                AND t.reg_seal_proof = batch_rec.reg_seal_proof
                AND t.sector_number = ANY(batch_rec.sector_nums)
                AND t.after_synth           = TRUE
                AND t.task_id_precommit_msg IS NULL
                AND t.after_precommit_msg   = FALSE;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            RETURN NEXT;
            RETURN;  -- Return immediately with updated_count, reason
        END IF;
    END LOOP;
    RETURN NEXT;
    RETURN;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.poll_start_batch_precommit_msg(int8, int8, int8, int4, int8, bool, int4) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.poll_start_batch_precommit_msg(int8, int8, int8, int4, int8, bool, int4) TO yugabyte;

-- DROP FUNCTION curio.poll_start_batch_precommit_msgs(int8, int8, int8, int4, int8, int4);

CREATE OR REPLACE FUNCTION curio.poll_start_batch_precommit_msgs(p_randomnesslookback bigint, p_slack_epoch bigint, p_current_height bigint, p_max_batch integer, p_new_task_id bigint, p_timeout_secs integer)
 RETURNS TABLE(updated_count bigint, reason text)
 LANGUAGE plpgsql
AS $function$
DECLARE
batch_rec RECORD;
    cond_slack   BOOLEAN;
    cond_timeout BOOLEAN;
    cond_fee     BOOLEAN;
BEGIN
    updated_count := 0;
    reason        := 'NONE';
    /*
      We'll do all logic in a single CTE chain, which:
        (1) Select relevant rows in "sectors_sdr_pipeline".
        (2) Computes each row's "start_epoch" by coalescing data from
            sectors_sdr_initial_pieces or fallback.
        (3) Numbers them per group, forming sub-batches of size p_max_batch.
        (4) Groups by (sp_id, reg_seal_proof, batch_index).
        (5) Finally selects sp_id, reg_seal_proof, an array of sector_numbers,
            plus the min start_epoch and earliest_ready for each batch.
      Then we loop over those grouped results in ascending order.
    */
    FOR batch_rec IN
        WITH initial AS (
            SELECT
              p.sp_id,
              p.sector_number,
              COALESCE(
                (
                  SELECT MIN(LEAST(s.f05_deal_start_epoch, s.direct_start_epoch))
                    FROM sectors_sdr_initial_pieces s
                   WHERE s.sp_id = p.sp_id
                     AND s.sector_number = p.sector_number
                ),
                p.ticket_epoch + p_randomnessLookBack
              ) AS start_epoch,
              p.precommit_ready_at,
              p.reg_seal_proof
            FROM sectors_sdr_pipeline p
            WHERE p.after_synth = TRUE
              AND p.task_id_precommit_msg IS NULL
              AND p.after_precommit_msg = FALSE
            ORDER BY p.sp_id, p.reg_seal_proof
        ),
        numbered AS (
            SELECT
              l.*,
              ROW_NUMBER() OVER (
                PARTITION BY l.sp_id, l.reg_seal_proof
                ORDER BY l.start_epoch
              ) AS rn
            FROM initial l
        ),
        chunked AS (
            SELECT
              sp_id,
              reg_seal_proof,
              FLOOR((rn - 1)::NUMERIC / p_max_batch) AS batch_index,
              start_epoch,
              precommit_ready_at,
              sector_number
            FROM numbered
        ),
        grouped AS (
            SELECT
              sp_id,
              reg_seal_proof,
              batch_index,
              MIN(start_epoch)               AS min_start_epoch,
              MIN(precommit_ready_at)        AS earliest_ready,
              ARRAY_AGG(sector_number)       AS sector_nums
            FROM chunked
            GROUP BY sp_id, reg_seal_proof, batch_index
            ORDER BY sp_id, reg_seal_proof, batch_index
        )
        SELECT
            sp_id,
            reg_seal_proof,
            sector_nums,
            min_start_epoch,
            earliest_ready
        FROM grouped
        LOOP
            cond_slack   := ((batch_rec.min_start_epoch - p_slack_epoch) <= p_current_height);
            cond_timeout := ((batch_rec.earliest_ready + MAKE_INTERVAL(secs => p_timeout_secs)) < NOW() AT TIME ZONE 'UTC');
            IF (cond_slack OR cond_timeout OR cond_fee) THEN
            IF cond_slack THEN
                reason := 'SLACK (min start epoch: ' || batch_rec.min_start_epoch || ')';
            ELSIF cond_timeout THEN
                reason := 'TIMEOUT (earliest_ready_at: ' || batch_rec.earliest_ready || ')';
            END IF;
            UPDATE sectors_sdr_pipeline t
            SET task_id_precommit_msg = p_new_task_id
            WHERE t.sp_id = batch_rec.sp_id
              AND t.reg_seal_proof = batch_rec.reg_seal_proof
              AND t.sector_number = ANY(batch_rec.sector_nums)
              AND t.after_synth           = TRUE
              AND t.task_id_precommit_msg IS NULL
              AND t.after_precommit_msg   = FALSE;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            RETURN NEXT;
            RETURN;  -- Return immediately with updated_count, reason
        END IF;
    END LOOP;
    RETURN NEXT;
    RETURN;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.poll_start_batch_precommit_msgs(int8, int8, int8, int4, int8, int4) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.poll_start_batch_precommit_msgs(int8, int8, int8, int4, int8, int4) TO yugabyte;

-- DROP FUNCTION curio.prevent_duplicate_successful_mk12ddo_deals();

CREATE OR REPLACE FUNCTION curio.prevent_duplicate_successful_mk12ddo_deals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1 FROM market_direct_deals
        WHERE sp_id = NEW.sp_id
        AND allocation_id = NEW.allocation_id
        AND (error IS NULL OR error = '')
    ) THEN
        RAISE EXCEPTION 'A successful deal already exists for sp_id = %, allocation_id = %', NEW.sp_id, NEW.allocation_id;
END IF;
RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.prevent_duplicate_successful_mk12ddo_deals() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.prevent_duplicate_successful_mk12ddo_deals() TO yugabyte;

-- DROP FUNCTION curio.process_piece_deal(text, text, bool, int8, int8, int8, int8, int8, bool, bool, int8);

CREATE OR REPLACE FUNCTION curio.process_piece_deal(_id text, _piece_cid text, _boost_deal boolean, _sp_id bigint, _sector_num bigint, _piece_offset bigint, _piece_length bigint, _raw_size bigint, _indexed boolean, _legacy_deal boolean DEFAULT false, _chain_deal_id bigint DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO market_piece_metadata (piece_cid, piece_size, indexed)
    VALUES (_piece_cid, _piece_length, _indexed)
    ON CONFLICT (piece_cid) DO UPDATE SET
        indexed = CASE
                      WHEN market_piece_metadata.indexed = FALSE THEN EXCLUDED.indexed
                      ELSE market_piece_metadata.indexed
            END;
    INSERT INTO market_piece_deal (
        id, piece_cid, boost_deal, legacy_deal, chain_deal_id,
        sp_id, sector_num, piece_offset, piece_length, raw_size
    ) VALUES (
                 _id, _piece_cid, _boost_deal, _legacy_deal, _chain_deal_id,
                 _sp_id, _sector_num, _piece_offset, _piece_length, _raw_size
             ) ON CONFLICT (sp_id, piece_cid, id) DO NOTHING;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.process_piece_deal(text, text, bool, int8, int8, int8, int8, int8, bool, bool, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.process_piece_deal(text, text, bool, int8, int8, int8, int8, int8, bool, bool, int8) TO yugabyte;

-- DROP FUNCTION curio.remove_pricing_filter(text);

CREATE OR REPLACE FUNCTION curio.remove_pricing_filter(filter_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    filter_count INT;
    updated_filters BIGINT[];
BEGIN
    SELECT COUNT(*) INTO filter_count
    FROM market_mk12_client_filters
    WHERE filter_name = ANY(pricing_filters);
    IF filter_count = 0 THEN
            DELETE FROM market_mk12_pricing_filters WHERE name = filter_name;
            RETURN;
    END IF;
    FOR updated_filters IN
        SELECT array_remove(pricing_filters, filter_name)
        FROM market_mk12_client_filters
        WHERE filter_name = ANY(pricing_filters)
    LOOP
        IF array_length(updated_filters, 1) IS NULL OR array_length(updated_filters, 1) = 0 THEN
            RAISE EXCEPTION 'Operation denied: Removing filter % would leave pricing_filters empty for one or more clients.', filter_name;
         END IF;
    END LOOP;
    UPDATE market_mk12_client_filters
    SET pricing_filters = array_remove(pricing_filters, filter_name)
    WHERE filter_name = ANY(pricing_filters);
    DELETE FROM market_mk12_pricing_filters WHERE name = filter_name;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.remove_pricing_filter(text) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.remove_pricing_filter(text) TO yugabyte;

-- DROP FUNCTION curio.set_commit_ready_at();

CREATE OR REPLACE FUNCTION curio.set_commit_ready_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.after_porep = FALSE AND NEW.after_porep = TRUE THEN
        UPDATE sectors_sdr_pipeline SET commit_ready_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        WHERE sp_id = NEW.sp_id AND sector_number = NEW.sector_number;
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.set_commit_ready_at() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.set_commit_ready_at() TO yugabyte;

-- DROP FUNCTION curio.set_precommit_ready_at();

CREATE OR REPLACE FUNCTION curio.set_precommit_ready_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.after_tree_r = FALSE AND NEW.after_tree_r = TRUE THEN
        UPDATE sectors_sdr_pipeline SET precommit_ready_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        WHERE sp_id = NEW.sp_id AND sector_number = NEW.sector_number;
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.set_precommit_ready_at() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.set_precommit_ready_at() TO yugabyte;

-- DROP FUNCTION curio.set_update_ready_at();

CREATE OR REPLACE FUNCTION curio.set_update_ready_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.after_prove = FALSE AND NEW.after_prove = TRUE THEN
        UPDATE sectors_snap_pipeline SET update_ready_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        WHERE sp_id = NEW.sp_id AND sector_number = NEW.sector_number;
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.set_update_ready_at() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.set_update_ready_at() TO yugabyte;

-- DROP FUNCTION curio.transfer_and_delete_open_piece(int8, int8);

CREATE OR REPLACE FUNCTION curio.transfer_and_delete_open_piece(v_sp_id bigint, v_sector_number bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
INSERT INTO sectors_sdr_initial_pieces (
    sp_id,
    sector_number,
    piece_index,
    piece_cid,
    piece_size,
    data_url,
    data_headers,
    data_raw_size,
    data_delete_on_finalize,
    f05_publish_cid,
    f05_deal_id,
    f05_deal_proposal,
    f05_deal_start_epoch,
    f05_deal_end_epoch,
    direct_start_epoch,
    direct_end_epoch,
    direct_piece_activation_manifest,
    created_at
)
SELECT
    sp_id,
    sector_number,
    piece_index,
    piece_cid,
    piece_size,
    data_url,
    data_headers,
    data_raw_size,
    data_delete_on_finalize,
    f05_publish_cid,
    f05_deal_id,
    f05_deal_proposal,
    f05_deal_start_epoch,
    f05_deal_end_epoch,
    direct_start_epoch,
    direct_end_epoch,
    direct_piece_activation_manifest,
    created_at
FROM
    open_sector_pieces
WHERE
    sp_id = v_sp_id AND
    sector_number = v_sector_number;
IF FOUND THEN
DELETE FROM open_sector_pieces
WHERE sp_id = v_sp_id AND sector_number = v_sector_number;
ELSE
        RAISE EXCEPTION 'No data found to transfer for sp_id % and sector_number %', v_sp_id, v_sector_number;
END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.transfer_and_delete_open_piece(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.transfer_and_delete_open_piece(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.transfer_and_delete_open_piece_snap(int8, int8);

CREATE OR REPLACE FUNCTION curio.transfer_and_delete_open_piece_snap(v_sp_id bigint, v_sector_number bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM open_sector_pieces
        WHERE sp_id = v_sp_id AND sector_number = v_sector_number AND f05_deal_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot transfer open_sector_pieces with f05_deal_id not null for sp_id % and sector_number %', v_sp_id, v_sector_number;
    END IF;
    INSERT INTO sectors_snap_initial_pieces (
        sp_id,
        sector_number,
        piece_index,
        piece_cid,
        piece_size,
        data_url,
        data_headers,
        data_raw_size,
        data_delete_on_finalize,
        direct_start_epoch,
        direct_end_epoch,
        direct_piece_activation_manifest,
        created_at
    )
    SELECT
        sp_id,
        sector_number,
        piece_index,
        piece_cid,
        piece_size,
        data_url,
        data_headers,
        data_raw_size,
        data_delete_on_finalize,
        direct_start_epoch,
        direct_end_epoch,
        direct_piece_activation_manifest,
        created_at
    FROM
        open_sector_pieces
    WHERE
        sp_id = v_sp_id AND
        sector_number = v_sector_number;
    IF FOUND THEN
        DELETE FROM open_sector_pieces
        WHERE sp_id = v_sp_id AND sector_number = v_sector_number;
    ELSE
        RAISE EXCEPTION 'No data found to transfer for sp_id % and sector_number %', v_sp_id, v_sector_number;
    END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.transfer_and_delete_open_piece_snap(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.transfer_and_delete_open_piece_snap(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.transfer_and_delete_sorted_open_piece(int8, int8);

CREATE OR REPLACE FUNCTION curio.transfer_and_delete_sorted_open_piece(v_sp_id bigint, v_sector_number bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
sorted_pieces RECORD;
new_index INT := 0;
BEGIN
    FOR sorted_pieces IN
    SELECT piece_index AS old_index, piece_size, piece_cid, data_url, data_headers,
           data_raw_size, data_delete_on_finalize, f05_publish_cid, f05_deal_id,
           f05_deal_proposal, f05_deal_start_epoch, f05_deal_end_epoch, direct_start_epoch,
           direct_end_epoch, direct_piece_activation_manifest, created_at
    FROM open_sector_pieces
    WHERE sp_id = v_sp_id AND sector_number = v_sector_number
    ORDER BY piece_size DESC  -- Descending order for biggest size first
    LOOP
        INSERT INTO sectors_sdr_initial_pieces (
            sp_id,
            sector_number,
            piece_index,
            piece_cid,
            piece_size,
            data_url,
            data_headers,
            data_raw_size,
            data_delete_on_finalize,
            f05_publish_cid,
            f05_deal_id,
            f05_deal_proposal,
            f05_deal_start_epoch,
            f05_deal_end_epoch,
            direct_start_epoch,
            direct_end_epoch,
            direct_piece_activation_manifest,
            created_at
        )
        VALUES (
                   v_sp_id,
                   v_sector_number,
                   new_index,  -- Insert new_index as piece_index
                   sorted_pieces.piece_cid,
                   sorted_pieces.piece_size,
                   sorted_pieces.data_url,
                   sorted_pieces.data_headers,
                   sorted_pieces.data_raw_size,
                   sorted_pieces.data_delete_on_finalize,
                   sorted_pieces.f05_publish_cid,
                   sorted_pieces.f05_deal_id,
                   sorted_pieces.f05_deal_proposal,
                   sorted_pieces.f05_deal_start_epoch,
                   sorted_pieces.f05_deal_end_epoch,
                   sorted_pieces.direct_start_epoch,
                   sorted_pieces.direct_end_epoch,
                   sorted_pieces.direct_piece_activation_manifest,
                   sorted_pieces.created_at
               );
        new_index := new_index + 1;
    END LOOP;
    IF FOUND THEN
        DELETE FROM open_sector_pieces
        WHERE sp_id = v_sp_id AND sector_number = v_sector_number;
    ELSE
        RAISE EXCEPTION 'No data found to transfer for sp_id % and sector_number %', v_sp_id, v_sector_number;
    END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.transfer_and_delete_sorted_open_piece(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.transfer_and_delete_sorted_open_piece(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.transfer_and_delete_sorted_open_piece_snap(int8, int8);

CREATE OR REPLACE FUNCTION curio.transfer_and_delete_sorted_open_piece_snap(v_sp_id bigint, v_sector_number bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
sorted_pieces RECORD;
new_index INT := 0;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM open_sector_pieces
        WHERE sp_id = v_sp_id AND sector_number = v_sector_number AND f05_deal_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot transfer open_sector_pieces with f05_deal_id not null for sp_id % and sector_number %', v_sp_id, v_sector_number;
    END IF;
    FOR sorted_pieces IN
    SELECT piece_index AS old_index, piece_size, piece_cid, data_url, data_headers,
           data_raw_size, data_delete_on_finalize, direct_start_epoch,
           direct_end_epoch, direct_piece_activation_manifest, created_at
    FROM open_sector_pieces
    WHERE sp_id = v_sp_id AND sector_number = v_sector_number
    ORDER BY piece_size DESC  -- Descending order for biggest size first
    LOOP
        INSERT INTO sectors_snap_initial_pieces (
            sp_id,
            sector_number,
            piece_index,
            piece_cid,
            piece_size,
            data_url,
            data_headers,
            data_raw_size,
            data_delete_on_finalize,
            direct_start_epoch,
            direct_end_epoch,
            direct_piece_activation_manifest,
            created_at
        )
        VALUES (
                   v_sp_id,
                   v_sector_number,
                   new_index,  -- Insert new_index as piece_index
                   sorted_pieces.piece_cid,
                   sorted_pieces.piece_size,
                   sorted_pieces.data_url,
                   sorted_pieces.data_headers,
                   sorted_pieces.data_raw_size,
                   sorted_pieces.data_delete_on_finalize,
                   sorted_pieces.direct_start_epoch,
                   sorted_pieces.direct_end_epoch,
                   sorted_pieces.direct_piece_activation_manifest,
                   sorted_pieces.created_at
               );
        new_index := new_index + 1;
    END LOOP;
    IF FOUND THEN
        DELETE FROM open_sector_pieces
        WHERE sp_id = v_sp_id AND sector_number = v_sector_number;
    ELSE
        RAISE EXCEPTION 'No data found to transfer for sp_id % and sector_number %', v_sp_id, v_sector_number;
    END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.transfer_and_delete_sorted_open_piece_snap(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.transfer_and_delete_sorted_open_piece_snap(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.trg_set_consumed_at_ps_client_payments();

CREATE OR REPLACE FUNCTION curio.trg_set_consumed_at_ps_client_payments()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.consumed = TRUE AND NEW.consumed_at IS NULL THEN
            NEW.consumed_at := current_timestamp;
        END IF;
        RETURN NEW;
    END IF;
    IF (TG_OP = 'UPDATE') THEN
        IF NEW.consumed = TRUE AND (OLD.consumed IS DISTINCT FROM TRUE) THEN
            NEW.consumed_at := current_timestamp;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NEW; -- Fallback (should not reach here)
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.trg_set_consumed_at_ps_client_payments() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.trg_set_consumed_at_ps_client_payments() TO yugabyte;

-- DROP FUNCTION curio.trig_sectors_meta_update_materialized();

CREATE OR REPLACE FUNCTION curio.trig_sectors_meta_update_materialized()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_sectors_unseal_pipeline_materialized(NEW.sp_id, NEW.sector_num);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_sectors_unseal_pipeline_materialized(OLD.sp_id, OLD.sector_num);
    END IF;
    RETURN NULL;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.trig_sectors_meta_update_materialized() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.trig_sectors_meta_update_materialized() TO yugabyte;

-- DROP FUNCTION curio.unset_task_id(int8, int8);

CREATE OR REPLACE FUNCTION curio.unset_task_id(sp_id_param bigint, sector_number_param bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
column_name text;
    column_names text[] := ARRAY[
        'task_id_sdr',
        'task_id_tree_d',
        'task_id_tree_c',
        'task_id_tree_r',
        'task_id_precommit_msg',
        'task_id_porep',
        'task_id_finalize',
        'task_id_move_storage',
        'task_id_commit_msg'
        ];
    update_query text;
    task_ids bigint[];
    task_id bigint;
BEGIN
    task_ids := get_sdr_pipeline_tasks(sp_id_param, sector_number_param);
    IF task_ids IS NULL OR array_length(task_ids, 1) IS NULL THEN
        RETURN;
    END IF;
    FOREACH column_name IN ARRAY column_names LOOP
            FOREACH task_id IN ARRAY task_ids LOOP
                    update_query := format('UPDATE sectors_sdr_pipeline SET %I = NULL WHERE %I = $1 AND sp_id = $2 AND sector_number = $3', column_name, column_name);
                    EXECUTE update_query USING task_id, sp_id_param, sector_number_param;
            END LOOP;
    END LOOP;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.unset_task_id(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.unset_task_id(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.unset_task_id_snap(int8, int8);

CREATE OR REPLACE FUNCTION curio.unset_task_id_snap(sp_id_param bigint, sector_number_param bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
column_name text;
    column_names text[] := ARRAY[
        'task_id_encode',
        'task_id_prove',
        'task_id_submit',
        'task_id_move_storage'
        ];
    update_query text;
    task_ids bigint[];
    task_id bigint;
BEGIN
    task_ids := get_snap_pipeline_tasks(sp_id_param, sector_number_param);
    IF task_ids IS NULL OR array_length(task_ids, 1) IS NULL THEN
        RETURN;
    END IF;
    FOREACH column_name IN ARRAY column_names LOOP
            FOREACH task_id IN ARRAY task_ids LOOP
                    update_query := format('UPDATE sectors_snap_pipeline SET %I = NULL WHERE %I = $1 AND sp_id = $2 AND sector_number = $3', column_name, column_name);
                    EXECUTE update_query USING task_id, sp_id_param, sector_number_param;
            END LOOP;
    END LOOP;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.unset_task_id_snap(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.unset_task_id_snap(int8, int8) TO yugabyte;

-- DROP FUNCTION curio.update_balance_manager_from_message_waits();

CREATE OR REPLACE FUNCTION curio.update_balance_manager_from_message_waits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.executed_tsk_epoch IS NULL AND NEW.executed_tsk_epoch IS NOT NULL THEN
    UPDATE balance_manager_addresses
      SET last_msg_landed_at = current_timestamp
    WHERE last_msg_cid = NEW.signed_message_cid;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_balance_manager_from_message_waits() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_balance_manager_from_message_waits() TO yugabyte;

-- DROP FUNCTION curio.update_is_cc();

CREATE OR REPLACE FUNCTION curio.update_is_cc()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.is_cc := NOT EXISTS (
        SELECT 1
        FROM sectors_snap_pipeline
        WHERE sectors_snap_pipeline.sp_id = NEW.sp_id
          AND sectors_snap_pipeline.sector_number = NEW.sector_num
    ) AND EXISTS (
        SELECT 1
        FROM sectors_cc_values
        WHERE sectors_cc_values.reg_seal_proof = NEW.reg_seal_proof
          AND sectors_cc_values.cur_unsealed_cid = NEW.cur_unsealed_cid
    );
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_is_cc() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_is_cc() TO yugabyte;

-- DROP FUNCTION curio.update_libp2p_node(text, bytea, text);

CREATE OR REPLACE FUNCTION curio.update_libp2p_node(_running_on text, _maybe_priv_key bytea, _maybe_peerid text)
 RETURNS bytea
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_running_on TEXT;
    last_updated TIMESTAMPTZ;
    existing_priv_key BYTEA;
    existing_peer_id TEXT;
BEGIN
    SELECT priv_key, peer_id, running_on, updated_at
    INTO existing_priv_key, existing_peer_id, current_running_on, last_updated
    FROM libp2p
    LIMIT 1;
    IF existing_priv_key IS NULL THEN
        INSERT INTO libp2p (priv_key, peer_id, running_on, updated_at)
        VALUES (_maybe_priv_key, _maybe_peerid, _running_on, NOW() AT TIME ZONE 'UTC');
        RETURN _maybe_priv_key;
    ELSE
        IF current_running_on IS NOT NULL AND current_running_on != _running_on THEN
            IF last_updated < NOW() - INTERVAL '5 minutes' THEN
                UPDATE libp2p
                SET running_on = _running_on,
                    updated_at = NOW() AT TIME ZONE 'UTC'
                WHERE priv_key = existing_priv_key;
            ELSE
                RAISE EXCEPTION 'Libp2p node already running on "%"', current_running_on;
            END IF;
        ELSE
            UPDATE libp2p
            SET running_on = _running_on,
                updated_at = NOW() AT TIME ZONE 'UTC'
            WHERE priv_key = existing_priv_key;
        END IF;
        RETURN existing_priv_key;
    END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_libp2p_node(text, bytea, text) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_libp2p_node(text, bytea, text) TO yugabyte;

-- DROP FUNCTION curio.update_pdp_proofset_creates();

CREATE OR REPLACE FUNCTION curio.update_pdp_proofset_creates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.tx_status = 'pending' AND (NEW.tx_status = 'confirmed' OR NEW.tx_status = 'failed') THEN
        UPDATE pdp_proofset_creates
        SET ok = CASE
                     WHEN NEW.tx_status = 'failed' OR NEW.tx_success = FALSE THEN FALSE
                     WHEN NEW.tx_status = 'confirmed' AND NEW.tx_success = TRUE THEN TRUE
                     ELSE ok
            END
        WHERE create_message_hash = NEW.signed_tx_hash AND proofset_created = FALSE;
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_pdp_proofset_creates() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_pdp_proofset_creates() TO yugabyte;

-- DROP FUNCTION curio.update_pdp_proofset_roots();

CREATE OR REPLACE FUNCTION curio.update_pdp_proofset_roots()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.tx_status = 'pending' AND (NEW.tx_status = 'confirmed' OR NEW.tx_status = 'failed') THEN
        UPDATE pdp_proofset_root_adds
        SET add_message_ok = CASE
                                WHEN NEW.tx_status = 'failed' OR NEW.tx_success = FALSE THEN FALSE
                                WHEN NEW.tx_status = 'confirmed' AND NEW.tx_success = TRUE THEN TRUE
                                ELSE add_message_ok
                            END
        WHERE add_message_hash = NEW.signed_tx_hash;
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_pdp_proofset_roots() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_pdp_proofset_roots() TO yugabyte;

-- DROP FUNCTION curio.update_piece_summary();

CREATE OR REPLACE FUNCTION curio.update_piece_summary()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_count BIGINT;
    indexed_count BIGINT;
    announced_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO total_count FROM market_piece_metadata;
    SELECT COUNT(*) INTO indexed_count FROM market_piece_metadata WHERE indexed = TRUE;
    SELECT COUNT(*) INTO announced_count
    FROM market_piece_metadata mpm
             JOIN ipni i ON mpm.piece_cid = i.piece_cid AND mpm.piece_size = i.piece_size;
    UPDATE piece_summary
    SET
        total = total_count,
        indexed = indexed_count,
        announced = announced_count,
        last_updated = TIMEZONE('UTC', NOW());
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_piece_summary() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_piece_summary() TO yugabyte;

-- DROP FUNCTION curio.update_proofshare_client_messages_from_message_waits();

CREATE OR REPLACE FUNCTION curio.update_proofshare_client_messages_from_message_waits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.executed_tsk_epoch IS NULL AND NEW.executed_tsk_epoch IS NOT NULL THEN
    UPDATE proofshare_client_messages
      SET success = (NEW.executed_rcpt_exitcode = 0),
          completed_at = current_timestamp
    WHERE signed_cid = NEW.signed_message_cid;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_proofshare_client_messages_from_message_waits() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_proofshare_client_messages_from_message_waits() TO yugabyte;

-- DROP FUNCTION curio.update_proofshare_provider_messages_from_message_waits();

CREATE OR REPLACE FUNCTION curio.update_proofshare_provider_messages_from_message_waits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.executed_tsk_epoch IS NULL AND NEW.executed_tsk_epoch IS NOT NULL THEN
    UPDATE proofshare_provider_messages
      SET success = (NEW.executed_rcpt_exitcode = 0),
          completed_at = current_timestamp
    WHERE signed_cid = NEW.signed_message_cid;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_proofshare_provider_messages_from_message_waits() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_proofshare_provider_messages_from_message_waits() TO yugabyte;

-- DROP FUNCTION curio.update_sectors_meta_is_cc();

CREATE OR REPLACE FUNCTION curio.update_sectors_meta_is_cc()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE sectors_meta
    SET is_cc = NOT EXISTS (
        SELECT 1
        FROM sectors_snap_pipeline
        WHERE sectors_snap_pipeline.sp_id = sectors_meta.sp_id
          AND sectors_snap_pipeline.sector_number = sectors_meta.sector_num
    ) AND EXISTS (
        SELECT 1
        FROM sectors_cc_values
        WHERE sectors_cc_values.reg_seal_proof = sectors_meta.reg_seal_proof
          AND sectors_cc_values.cur_unsealed_cid = sectors_meta.cur_unsealed_cid
    )
    WHERE sp_id = NEW.sp_id AND sector_num = NEW.sector_number;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_sectors_meta_is_cc() OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_sectors_meta_is_cc() TO yugabyte;

-- DROP FUNCTION curio.update_sectors_unseal_pipeline_materialized(int8, int8);

CREATE OR REPLACE FUNCTION curio.update_sectors_unseal_pipeline_materialized(target_sp_id bigint, target_sector_num bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    should_be_added BOOLEAN;
    should_not_be_removed BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM sectors_meta sm
        WHERE sm.sp_id = target_sp_id
          AND sm.sector_num = target_sector_num
          AND sm.target_unseal_state = TRUE
          AND sm.is_cc = FALSE
          AND NOT EXISTS (
            SELECT 1 FROM sector_location sl
            WHERE sl.miner_id = sm.sp_id
              AND sl.sector_num = sm.sector_num
              AND sl.sector_filetype = 1 -- 1 is unsealed
        )
          AND NOT EXISTS (
            SELECT 1 FROM sectors_unseal_pipeline sup
            WHERE sup.sp_id = sm.sp_id
              AND sup.sector_number = sm.sector_num
        )
    ) INTO should_be_added;
    IF should_be_added THEN
        INSERT INTO sectors_unseal_pipeline (sp_id, sector_number, reg_seal_proof)
            SELECT sm.sp_id, sm.sector_num, sm.reg_seal_proof
            FROM sectors_meta sm
            WHERE sm.sp_id = target_sp_id AND sm.sector_num = target_sector_num
        ON CONFLICT (sp_id, sector_number) DO UPDATE
            SET reg_seal_proof = EXCLUDED.reg_seal_proof;
    END IF;
    SELECT EXISTS (
        SELECT 1
        FROM sectors_meta sm
        WHERE sm.sp_id = target_sp_id
          AND sm.sector_num = target_sector_num
          AND sm.target_unseal_state = TRUE
    ) INTO should_not_be_removed;
    IF should_not_be_removed THEN
        DELETE FROM storage_removal_marks
            WHERE sp_id = target_sp_id AND sector_num = target_sector_num AND sector_filetype = 1; -- 1 is unsealed
    END IF;
END;
$function$
;

-- Permissions

ALTER FUNCTION curio.update_sectors_unseal_pipeline_materialized(int8, int8) OWNER TO yugabyte;
GRANT ALL ON FUNCTION curio.update_sectors_unseal_pipeline_materialized(int8, int8) TO yugabyte;


-- Permissions

GRANT ALL ON SCHEMA curio TO yugabyte;