--
-- PostgreSQL database dump
--

-- Dumped from database version 12.3
-- Dumped by pg_dump version 12.3

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

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: jarvis
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO jarvis;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: jarvis
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    firstname text NOT NULL,
    lastname text NOT NULL,
    email character varying(254) NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.admin OWNER TO nobisusr;

--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: nobisusr
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_id_seq OWNER TO nobisusr;

--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobisusr
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- Name: building; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.building (
    id integer NOT NULL,
    name text NOT NULL,
    geometry public.geometry NOT NULL,
    address text NOT NULL,
    addr_num character varying(10) NOT NULL,
    city text NOT NULL
);


ALTER TABLE public.building OWNER TO nobisusr;

--
-- Name: building_id_seq; Type: SEQUENCE; Schema: public; Owner: nobisusr
--

CREATE SEQUENCE public.building_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.building_id_seq OWNER TO nobisusr;

--
-- Name: building_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobisusr
--

ALTER SEQUENCE public.building_id_seq OWNED BY public.building.id;


--
-- Name: category; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.category (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.category OWNER TO nobisusr;

--
-- Name: category_id_seq; Type: SEQUENCE; Schema: public; Owner: nobisusr
--

CREATE SEQUENCE public.category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.category_id_seq OWNER TO nobisusr;

--
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobisusr
--

ALTER SEQUENCE public.category_id_seq OWNED BY public.category.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    rating integer NOT NULL,
    log_id integer NOT NULL
);


ALTER TABLE public.feedback OWNER TO nobisusr;

--
-- Name: have; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.have (
    place_uuid uuid NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.have OWNER TO nobisusr;

--
-- Name: log; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.log (
    id integer NOT NULL,
    is_in boolean NOT NULL,
    "timestamp" timestamp without time zone NOT NULL
);


ALTER TABLE public.log OWNER TO nobisusr;

--
-- Name: log_id_seq; Type: SEQUENCE; Schema: public; Owner: nobisusr
--

CREATE SEQUENCE public.log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.log_id_seq OWNER TO nobisusr;

--
-- Name: log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobisusr
--

ALTER SEQUENCE public.log_id_seq OWNED BY public.log.id;


--
-- Name: manage; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.manage (
    referent_id integer NOT NULL,
    place_uuid uuid NOT NULL
);


ALTER TABLE public.manage OWNER TO nobisusr;

--
-- Name: person; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.person (
    uuid uuid NOT NULL
);


ALTER TABLE public.person OWNER TO nobisusr;

--
-- Name: place; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.place (
    uuid uuid NOT NULL,
    name text NOT NULL,
    geometry public.geometry NOT NULL,
    capacity integer NOT NULL,
    visit_time integer NOT NULL,
    counter integer DEFAULT 0 NOT NULL,
    building_id integer NOT NULL,
    enable boolean DEFAULT true NOT NULL
);


ALTER TABLE public.place OWNER TO nobisusr;

--
-- Name: COLUMN place.visit_time; Type: COMMENT; Schema: public; Owner: nobisusr
--

COMMENT ON COLUMN public.place.visit_time IS '(Minutes)';


--
-- Name: referent; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.referent (
    id integer NOT NULL,
    firstname text NOT NULL,
    lastname text NOT NULL,
    email character varying(254) NOT NULL,
    password text NOT NULL,
    enable boolean DEFAULT false NOT NULL,
    new boolean DEFAULT true NOT NULL,
    admin_id integer
);


ALTER TABLE public.referent OWNER TO nobisusr;

--
-- Name: referent_id_seq; Type: SEQUENCE; Schema: public; Owner: nobisusr
--

CREATE SEQUENCE public.referent_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.referent_id_seq OWNER TO nobisusr;

--
-- Name: report; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.report (
    id integer NOT NULL,
    email character varying(254) NOT NULL,
    description text NOT NULL,
    place_uuid uuid NOT NULL,
    resolve boolean DEFAULT false NOT NULL
);


ALTER TABLE public.report OWNER TO nobisusr;

--
-- Name: report_id_seq; Type: SEQUENCE; Schema: public; Owner: nobisusr
--

CREATE SEQUENCE public.report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_id_seq OWNER TO nobisusr;

--
-- Name: report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobisusr
--

ALTER SEQUENCE public.report_id_seq OWNED BY public.report.id;


--
-- Name: visit; Type: TABLE; Schema: public; Owner: nobisusr
--

CREATE TABLE public.visit (
    place_uuid uuid NOT NULL,
    log_id integer NOT NULL,
    person_uuid uuid NOT NULL
);


ALTER TABLE public.visit OWNER TO nobisusr;

--
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- Name: building id; Type: DEFAULT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.building ALTER COLUMN id SET DEFAULT nextval('public.building_id_seq'::regclass);


--
-- Name: category id; Type: DEFAULT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.category ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- Name: log id; Type: DEFAULT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.log ALTER COLUMN id SET DEFAULT nextval('public.log_id_seq'::regclass);


--
-- Name: report id; Type: DEFAULT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.report ALTER COLUMN id SET DEFAULT nextval('public.report_id_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.admin (id, firstname, lastname, email, password) FROM stdin;
\.


--
-- Data for Name: building; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.building (id, name, geometry, address, addr_num, city) FROM stdin;
\.


--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.category (id, name) FROM stdin;
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.feedback (id, rating, log_id) FROM stdin;
\.


--
-- Data for Name: have; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.have (place_uuid, category_id) FROM stdin;
\.


--
-- Data for Name: log; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.log (id, is_in, "timestamp") FROM stdin;
\.


--
-- Data for Name: manage; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.manage (referent_id, place_uuid) FROM stdin;
\.


--
-- Data for Name: person; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.person (uuid) FROM stdin;
\.


--
-- Data for Name: place; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.place (uuid, name, geometry, capacity, visit_time, counter, building_id, enable) FROM stdin;
\.


--
-- Data for Name: referent; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.referent (id, firstname, lastname, email, password, enable, new, admin_id) FROM stdin;
1	Mattia	Avanzi	m8.avanzi@gmail.com	dfvdafkvdnkvd	t	t	\N
\.


--
-- Data for Name: report; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.report (id, email, description, place_uuid, resolve) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: jarvis
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: visit; Type: TABLE DATA; Schema: public; Owner: nobisusr
--

COPY public.visit (place_uuid, log_id, person_uuid) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: jarvis
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: jarvis
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobisusr
--

SELECT pg_catalog.setval('public.admin_id_seq', 1, false);


--
-- Name: building_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobisusr
--

SELECT pg_catalog.setval('public.building_id_seq', 1, false);


--
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobisusr
--

SELECT pg_catalog.setval('public.category_id_seq', 1, false);


--
-- Name: log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobisusr
--

SELECT pg_catalog.setval('public.log_id_seq', 1, false);


--
-- Name: referent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobisusr
--

SELECT pg_catalog.setval('public.referent_id_seq', 1, true);


--
-- Name: report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobisusr
--

SELECT pg_catalog.setval('public.report_id_seq', 1, false);


--
-- Name: admin admin_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pk PRIMARY KEY (id);


--
-- Name: building building_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.building
    ADD CONSTRAINT building_pk PRIMARY KEY (id);


--
-- Name: category category_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pk PRIMARY KEY (id);


--
-- Name: feedback feedback_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pk PRIMARY KEY (id);


--
-- Name: have have_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_pk PRIMARY KEY (place_uuid, category_id);


--
-- Name: log log_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_pk PRIMARY KEY (id);


--
-- Name: manage manage_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_pk PRIMARY KEY (referent_id, place_uuid);


--
-- Name: person person_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pk PRIMARY KEY (uuid);


--
-- Name: place place_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.place
    ADD CONSTRAINT place_pk PRIMARY KEY (uuid);


--
-- Name: referent referent_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.referent
    ADD CONSTRAINT referent_pk PRIMARY KEY (id);


--
-- Name: report report_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_pk PRIMARY KEY (id);


--
-- Name: visit visit_pk; Type: CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_pk PRIMARY KEY (place_uuid, log_id, person_uuid);


--
-- Name: feedback feedback_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_fk FOREIGN KEY (log_id) REFERENCES public.log(id);


--
-- Name: have have_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_fk FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- Name: have have_fk_1; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_fk_1 FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- Name: manage manage_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_fk FOREIGN KEY (referent_id) REFERENCES public.referent(id);


--
-- Name: manage manage_fk_1; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_fk_1 FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- Name: place place_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.place
    ADD CONSTRAINT place_fk FOREIGN KEY (building_id) REFERENCES public.building(id);


--
-- Name: referent referent_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.referent
    ADD CONSTRAINT referent_fk FOREIGN KEY (admin_id) REFERENCES public.admin(id);


--
-- Name: report report_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_fk FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- Name: visit visit_fk_log; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_log FOREIGN KEY (log_id) REFERENCES public.log(id);


--
-- Name: visit visit_fk_person; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_person FOREIGN KEY (person_uuid) REFERENCES public.person(uuid);


--
-- Name: visit visit_fk_place; Type: FK CONSTRAINT; Schema: public; Owner: nobisusr
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_place FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- PostgreSQL database dump complete
--

