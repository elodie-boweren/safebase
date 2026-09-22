--
-- PostgreSQL database dump
--

\restrict hOQdvXiy59B55UYjamMWBcuoaG7iApCzyvN5XmX9SSbZTTTRSS44DahIsGi58XB

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: safebase
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    nom character varying(100),
    email character varying(100)
);


ALTER TABLE public.clients OWNER TO safebase;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: safebase
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO safebase;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: safebase
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: safebase
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: safebase
--

COPY public.clients (id, nom, email) FROM stdin;
1	Alice Martin	alice@example.com
2	Bob Dupont	bob@example.com
3	Chloe Bernard	chloe@example.com
\.


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: safebase
--

SELECT pg_catalog.setval('public.clients_id_seq', 3, true);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: safebase
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict hOQdvXiy59B55UYjamMWBcuoaG7iApCzyvN5XmX9SSbZTTTRSS44DahIsGi58XB

