--
-- PostgreSQL database dump
--

-- Dumped from database version 12.3 (Ubuntu 12.3-1.pgdg18.04+1)
-- Dumped by pg_dump version 12.3 (Ubuntu 12.3-1.pgdg18.04+1)

-- Started on 2020-08-30 02:10:57 CEST

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
-- TOC entry 11 (class 2615 OID 17735)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 4103 (class 0 OID 0)
-- Dependencies: 11
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 3 (class 3079 OID 17736)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 4104 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 17773)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 4105 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- TOC entry 4 (class 3079 OID 18775)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 4106 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- TOC entry 252 (class 1255 OID 19133)
-- Name: checkinf(uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: nobis
--

CREATE FUNCTION public.checkinf(_personuuid uuid, _placeuuid uuid, _assumption boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE newlogid integer;
BEGIN
UPDATE public.place SET counter = counter+1 WHERE uuid = _placeuuid;
INSERT INTO log (is_in, timestamp, assumption) VALUES (true, NOW()::timestamp,_assumption) RETURNING log.id INTO newlogid;
INSERT INTO visit (place_uuid, log_id, person_uuid) VALUES (_placeuuid, newlogid, _personuuid);
END;
$$;


ALTER FUNCTION public.checkinf(_personuuid uuid, _placeuuid uuid, _assumption boolean) OWNER TO nobis;

--
-- TOC entry 253 (class 1255 OID 19132)
-- Name: checkoutf(uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: nobis
--

CREATE FUNCTION public.checkoutf(_personuuid uuid, _placeuuid uuid, _assumption boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE newlogid integer;
BEGIN
UPDATE public.place SET counter = counter-1 WHERE uuid = _placeuuid;
INSERT INTO log (is_in, timestamp, assumption) VALUES (false, NOW()::timestamp,_assumption) RETURNING log.id INTO newlogid;
INSERT INTO visit (place_uuid, log_id, person_uuid) VALUES (_placeuuid, newlogid, _personuuid);
END;
$$;


ALTER FUNCTION public.checkoutf(_personuuid uuid, _placeuuid uuid, _assumption boolean) OWNER TO nobis;

--
-- TOC entry 238 (class 1255 OID 19094)
-- Name: findpersonlastdetection(uuid); Type: FUNCTION; Schema: public; Owner: nobis
--

CREATE FUNCTION public.findpersonlastdetection(person_uuid_q uuid) RETURNS TABLE(place_uuid uuid, timelog timestamp without time zone, checkin boolean)
    LANGUAGE sql
    AS $$
	
SELECT 
visit.place_uuid,
log.timestamp AS timelog,
log.is_in AS checkin 
FROM public.visit
LEFT JOIN log
ON visit.log_id = log.id
--GROUP BY visit.person_uuid

WHERE visit.person_uuid = person_uuid_q
ORDER BY log.timestamp DESC
LIMIT 1
	
	$$;


ALTER FUNCTION public.findpersonlastdetection(person_uuid_q uuid) OWNER TO nobis;

--
-- TOC entry 251 (class 1255 OID 19096)
-- Name: findplacesfrompattern(text); Type: FUNCTION; Schema: public; Owner: nobis
--

CREATE FUNCTION public.findplacesfrompattern(_searchpattern text) RETURNS TABLE(puuid uuid, pname text, buildingname text, category text, geocoord text, occ numeric)
    LANGUAGE sql
    AS $$
	
SELECT place.uuid AS uuid,place.name,building.name AS building,category.name AS category,st_astext(place.geometry) AS geocoord , TRUNC((place.counter::decimal(3) / place.capacity),2) AS occ FROM place
LEFT JOIN building 
ON place.building_id = building.id
LEFT JOIN have
ON place.uuid = have.place_uuid
LEFT JOIN category
ON have.category_id = category.id
--WHERE st_intersects(st_makeenvelope(xmin,ymin,xmax,ymax,4326), place.geometry)
WHERE place.name ILIKE '%' || _searchpattern || '%' OR building.name ILIKE '%' || _searchpattern || '%'
ORDER BY occ DESC;
	
	$$;


ALTER FUNCTION public.findplacesfrompattern(_searchpattern text) OWNER TO nobis;

--
-- TOC entry 237 (class 1255 OID 19092)
-- Name: findplacesinbox(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: nobis
--

CREATE FUNCTION public.findplacesinbox(xmin numeric, ymin numeric, xmax numeric, ymax numeric) RETURNS TABLE(puuid uuid, pname text, buildingname text, category text, geocoord text, occ numeric)
    LANGUAGE sql
    AS $$
	
	SELECT place.uuid AS uuid,place.name,building.name AS building,category.name AS category,st_astext(place.geometry) AS geocoord , TRUNC((place.counter::decimal(3) / place.capacity),2) AS occ FROM place
LEFT JOIN building 
ON place.building_id = building.id
LEFT JOIN have
ON place.uuid = have.place_uuid
LEFT JOIN category
ON have.category_id = category.id
WHERE st_intersects(st_makeenvelope(xmin,ymin,xmax,ymax,4326), place.geometry)
ORDER BY occ DESC;
	
	$$;


ALTER FUNCTION public.findplacesinbox(xmin numeric, ymin numeric, xmax numeric, ymax numeric) OWNER TO nobis;

--
-- TOC entry 255 (class 1255 OID 19122)
-- Name: handlecheckin(uuid, uuid); Type: PROCEDURE; Schema: public; Owner: nobis
--

CREATE PROCEDURE public.handlecheckin(_personuuid uuid, _placeuuid uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE 
lastplace uuid;
mcheckin boolean;
casenumber smallint;
BEGIN
--SELECT place_uuid INTO lastplace FROM findpersonlastdetection(_personuuid);
SELECT place_uuid,checkin INTO lastplace,mcheckin FROM findpersonlastdetection(_personuuid);
IF NOT FOUND THEN
	raise notice 'lastplace: not found - %', lastplace;
ELSE
  raise notice 'lastplace: %', lastplace;
  raise notice 'currently in?: %', mcheckin;
END IF;

IF(mcheckin = false) THEN
	raise notice 'mcheckin: %', mcheckin;
	lastplace := NULL;
	raise notice 'so lastplace should be as mcheckin';
	raise notice 'lastplace: %', lastplace;
	raise notice 'mcheckin: %', mcheckin;
END IF;

IF (lastplace ISNULL) THEN
	casenumber := 0;
	raise notice 'caso A: ';
	raise notice 'lastplace does not exists';
	raise notice 'lastplace: %', lastplace;
	raise notice 'currentplace: %', _placeuuid;
	PERFORM checkinf(_personuuid,_placeuuid,false);
ELSIF (lastplace = _placeuuid) THEN
	casenumber := 5;
	raise notice 'caso F: ';
	raise notice 'currentplace == lastplace';
	raise notice 'lastplace: %', lastplace;
	raise notice 'currentplace: %', _placeuuid;
	PERFORM checkoutf(_personuuid,_placeuuid,true);
	SELECT pg_sleep(0.001);
	PERFORM checkinf(_personuuid,_placeuuid,false);
ELSIF ((lastplace IS NOT NULL) AND (lastplace <> _placeuuid)) THEN
	casenumber := 4;
	raise notice 'caso E: ';
	raise notice 'currentplace != lastplace';
	raise notice 'lastplace: %', lastplace;
	raise notice 'currentplace: %', _placeuuid;
	PERFORM checkoutf(_personuuid,lastplace,true);
	SELECT pg_sleep(0.001);
	PERFORM checkinf(_personuuid,_placeuuid,false);
END IF;
raise notice 'caso #%', casenumber;
COMMIT;
END;
$$;


ALTER PROCEDURE public.handlecheckin(_personuuid uuid, _placeuuid uuid) OWNER TO nobis;

--
-- TOC entry 254 (class 1255 OID 19123)
-- Name: handlecheckout(uuid, uuid); Type: PROCEDURE; Schema: public; Owner: nobis
--

CREATE PROCEDURE public.handlecheckout(_personuuid uuid, _placeuuid uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE 
lastplace uuid;
mcheckin boolean;
casenumber smallint;
BEGIN
--SELECT place_uuid INTO lastplace FROM findpersonlastdetection(_personuuid);
SELECT place_uuid,checkin INTO lastplace,mcheckin FROM findpersonlastdetection(_personuuid);
IF NOT FOUND THEN
	raise notice 'lastplace: not found - %', lastplace;
ELSE
  raise notice 'lastplace: %', lastplace;
  raise notice 'currently in?: %', mcheckin;
END IF;

IF(mcheckin = false) THEN
	raise notice 'mcheckin: %', mcheckin;
	lastplace := NULL;
	raise notice 'so lastplace should be as mcheckin';
	raise notice 'lastplace: %', lastplace;
	raise notice 'mcheckin: %', mcheckin;
END IF;

IF (lastplace ISNULL) THEN
	casenumber := 1;
	raise notice 'caso B: ';
	raise notice 'lastplace does not exists';
	raise notice 'lastplace: %', lastplace;
	raise notice 'currentplace: %', _placeuuid;
	PERFORM checkinf(_personuuid,_placeuuid,true);
	SELECT pg_sleep(0.001);
	PERFORM checkoutf(_personuuid,_placeuuid,false);
ELSIF (lastplace = _placeuuid) THEN
	casenumber := 2;
	raise notice 'caso C: ';
	raise notice 'currentplace == lastplace';
	raise notice 'lastplace: %', lastplace;
	raise notice 'currentplace: %', _placeuuid;
	PERFORM checkoutf(_personuuid,_placeuuid,false);
ELSIF ((lastplace IS NOT NULL) AND (lastplace <> _placeuuid)) THEN
	casenumber := 3;
	raise notice 'caso D: ';
	raise notice 'currentplace != lastplace';
	raise notice 'lastplace: %', lastplace;
	raise notice 'currentplace: %', _placeuuid;
	PERFORM checkoutf(_personuuid,lastplace,true);
	SELECT pg_sleep(0.001);
	PERFORM checkinf(_personuuid,_placeuuid,true);
	SELECT pg_sleep(0.001);
	PERFORM checkoutf(_personuuid,_placeuuid,false);
END IF;
raise notice 'caso #%', casenumber;
COMMIT;
END;
$$;


ALTER PROCEDURE public.handlecheckout(_personuuid uuid, _placeuuid uuid) OWNER TO nobis;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 18918)
-- Name: admin; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    firstname text NOT NULL,
    lastname text NOT NULL,
    email character varying(254) NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.admin OWNER TO nobis;

--
-- TOC entry 218 (class 1259 OID 18924)
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: nobis
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_id_seq OWNER TO nobis;

--
-- TOC entry 4107 (class 0 OID 0)
-- Dependencies: 218
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- TOC entry 219 (class 1259 OID 18926)
-- Name: building; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.building (
    id integer NOT NULL,
    name text NOT NULL,
    geometry public.geometry NOT NULL,
    address text NOT NULL,
    addr_num character varying(10) NOT NULL,
    city text NOT NULL
);


ALTER TABLE public.building OWNER TO nobis;

--
-- TOC entry 220 (class 1259 OID 18932)
-- Name: building_id_seq; Type: SEQUENCE; Schema: public; Owner: nobis
--

CREATE SEQUENCE public.building_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.building_id_seq OWNER TO nobis;

--
-- TOC entry 4108 (class 0 OID 0)
-- Dependencies: 220
-- Name: building_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.building_id_seq OWNED BY public.building.id;


--
-- TOC entry 221 (class 1259 OID 18934)
-- Name: category; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.category (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.category OWNER TO nobis;

--
-- TOC entry 222 (class 1259 OID 18940)
-- Name: category_id_seq; Type: SEQUENCE; Schema: public; Owner: nobis
--

CREATE SEQUENCE public.category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.category_id_seq OWNER TO nobis;

--
-- TOC entry 4109 (class 0 OID 0)
-- Dependencies: 222
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.category_id_seq OWNED BY public.category.id;


--
-- TOC entry 223 (class 1259 OID 18942)
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.feedback_id_seq OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 18944)
-- Name: feedback; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.feedback (
    id integer DEFAULT nextval('public.feedback_id_seq'::regclass) NOT NULL,
    rating integer NOT NULL,
    log_id integer NOT NULL
);


ALTER TABLE public.feedback OWNER TO nobis;

--
-- TOC entry 225 (class 1259 OID 18948)
-- Name: have; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.have (
    place_uuid uuid NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.have OWNER TO nobis;

--
-- TOC entry 226 (class 1259 OID 18951)
-- Name: log; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.log (
    id integer NOT NULL,
    is_in boolean NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    assumption boolean NOT NULL
);


ALTER TABLE public.log OWNER TO nobis;

--
-- TOC entry 227 (class 1259 OID 18954)
-- Name: log_id_seq; Type: SEQUENCE; Schema: public; Owner: nobis
--

CREATE SEQUENCE public.log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.log_id_seq OWNER TO nobis;

--
-- TOC entry 4111 (class 0 OID 0)
-- Dependencies: 227
-- Name: log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.log_id_seq OWNED BY public.log.id;


--
-- TOC entry 228 (class 1259 OID 18956)
-- Name: manage; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.manage (
    referent_id integer NOT NULL,
    place_uuid uuid NOT NULL
);


ALTER TABLE public.manage OWNER TO nobis;

--
-- TOC entry 229 (class 1259 OID 18959)
-- Name: person; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.person (
    uuid uuid NOT NULL
);


ALTER TABLE public.person OWNER TO nobis;

--
-- TOC entry 230 (class 1259 OID 18962)
-- Name: place; Type: TABLE; Schema: public; Owner: nobis
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


ALTER TABLE public.place OWNER TO nobis;

--
-- TOC entry 4112 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN place.visit_time; Type: COMMENT; Schema: public; Owner: nobis
--

COMMENT ON COLUMN public.place.visit_time IS '(Minutes)';


--
-- TOC entry 236 (class 1259 OID 19118)
-- Name: place_uuid; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.place_uuid (
    place_uuid uuid
);


ALTER TABLE public.place_uuid OWNER TO nobis;

--
-- TOC entry 231 (class 1259 OID 18970)
-- Name: referent; Type: TABLE; Schema: public; Owner: nobis
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


ALTER TABLE public.referent OWNER TO nobis;

--
-- TOC entry 232 (class 1259 OID 18978)
-- Name: referent_id_seq; Type: SEQUENCE; Schema: public; Owner: nobis
--

CREATE SEQUENCE public.referent_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.referent_id_seq OWNER TO nobis;

--
-- TOC entry 233 (class 1259 OID 18980)
-- Name: report; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.report (
    id integer NOT NULL,
    email character varying(254) NOT NULL,
    description text NOT NULL,
    place_uuid uuid NOT NULL,
    resolve boolean DEFAULT false NOT NULL
);


ALTER TABLE public.report OWNER TO nobis;

--
-- TOC entry 234 (class 1259 OID 18987)
-- Name: report_id_seq; Type: SEQUENCE; Schema: public; Owner: nobis
--

CREATE SEQUENCE public.report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_id_seq OWNER TO nobis;

--
-- TOC entry 4113 (class 0 OID 0)
-- Dependencies: 234
-- Name: report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.report_id_seq OWNED BY public.report.id;


--
-- TOC entry 235 (class 1259 OID 18989)
-- Name: visit; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.visit (
    place_uuid uuid NOT NULL,
    log_id integer NOT NULL,
    person_uuid uuid NOT NULL
);


ALTER TABLE public.visit OWNER TO nobis;

--
-- TOC entry 3891 (class 2604 OID 18992)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 3892 (class 2604 OID 18993)
-- Name: building id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.building ALTER COLUMN id SET DEFAULT nextval('public.building_id_seq'::regclass);


--
-- TOC entry 3893 (class 2604 OID 18994)
-- Name: category id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.category ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- TOC entry 3895 (class 2604 OID 18995)
-- Name: log id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.log ALTER COLUMN id SET DEFAULT nextval('public.log_id_seq'::regclass);


--
-- TOC entry 3901 (class 2604 OID 18996)
-- Name: report id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.report ALTER COLUMN id SET DEFAULT nextval('public.report_id_seq'::regclass);


--
-- TOC entry 4078 (class 0 OID 18918)
-- Dependencies: 217
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.admin (id, firstname, lastname, email, password) FROM stdin;
1	Mattia	Avanzi	m8.avanzi@gmail.com	$2a$06$PIaPdgtYY5fs4wLTuEPNFOgyJWJLcOEA928ow.u1JJWW0tNtQQ/ZS
2	Riccardo	Coniglio	riccardo.coniglio@gmail.com	$2a$04$BxUYcAXyHM89en6MIEdH0eIZAD1ZGQEAyKp6Y6uSpD/Rl5.qAuPze
\.


--
-- TOC entry 4080 (class 0 OID 18926)
-- Dependencies: 219
-- Data for Name: building; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.building (id, name, geometry, address, addr_num, city) FROM stdin;
1	DEI	0101000020E6100000B177352F3DB446400A7CEAFDEBC92740	Via Gradenigo	6b	Padova
6	Ca Borin	0101000020E6100000000000540EC22740A0A64355DDB34640	via del santo	6	Padova
38	Sede distaccata Astronomia	0101000020E610000000000002A2BC2740781C5CD57BB34640	vicolo dell'Osservatorio	6	Padova
39	Albergo Majestic Toscanelli	0101000020E6100000010000F631C0274091524614F1B34640	via dell' arco	23	Padova
\.


--
-- TOC entry 4082 (class 0 OID 18934)
-- Dependencies: 221
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.category (id, name) FROM stdin;
1	Aula Didattica
2	Edificio
3	Aula Studio
4	Laboratorio
5	Biblioteca
6	Mensa
\.


--
-- TOC entry 4085 (class 0 OID 18944)
-- Dependencies: 224
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.feedback (id, rating, log_id) FROM stdin;
3	3	26
4	2	27
\.


--
-- TOC entry 4086 (class 0 OID 18948)
-- Dependencies: 225
-- Data for Name: have; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.have (place_uuid, category_id) FROM stdin;
3dbfcddf-faf2-4fab-9813-480156d18e78	5
cd3afabf-9492-4d14-a043-bee26f95e27c	1
ee1d859b-9b0c-4338-92b9-aff1a8e9b962	3
d695c33e-8f66-4bb6-a754-407b39857216	3
73d64be0-0790-4495-a639-32c1d75c9a07	3
e46649d1-02d6-497d-a615-c69a62ca067a	1
82673a62-6241-40ff-bb5a-dff5de26f536	5
15e16b77-04ef-4de3-b839-0c0945641e34	2
5ea07576-a175-49df-bae4-580ec8af992a	2
\.


--
-- TOC entry 4087 (class 0 OID 18951)
-- Dependencies: 226
-- Data for Name: log; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.log (id, is_in, "timestamp", assumption) FROM stdin;
1	t	2020-08-13 15:50:38.384	f
2	t	2020-08-13 15:52:05.206	f
3	t	2020-08-13 15:55:18.22	f
4	t	2020-08-13 15:58:42.608	f
5	t	2020-08-13 15:59:13.612	f
6	t	2020-08-13 15:59:33.645	f
7	t	2020-08-13 15:59:35.152	f
8	t	2020-08-13 15:59:35.85	f
9	t	2020-08-13 16:00:10.818	f
10	t	2020-08-13 16:00:28.609	f
11	t	2020-08-13 16:00:29.478	f
12	t	2020-08-13 16:00:30.323	f
13	t	2020-08-13 16:00:31.137	f
14	t	2020-08-13 16:00:31.93	f
15	t	2020-08-13 16:00:32.925	f
16	t	2020-08-13 16:00:42.767	f
17	t	2020-08-13 16:46:47.384	f
18	t	2020-08-13 17:54:32.394	f
19	t	2020-08-20 16:27:00.548	f
20	f	2020-08-20 16:30:43.772	f
21	t	2020-08-20 16:31:42.792	f
22	f	2020-08-20 16:31:54.453	f
23	f	2020-08-20 16:39:43.121	f
24	f	2020-08-20 16:40:06.823	f
25	f	2020-08-20 16:47:14.744	f
26	f	2020-08-20 17:01:04.564	f
27	f	2020-08-20 17:02:32.994	f
33	t	2020-08-28 18:50:26.074184	t
34	t	2020-08-28 18:51:20.760068	f
35	t	2020-08-28 18:58:36.546087	t
36	t	2020-08-28 18:59:17.35802	t
38	t	2020-08-29 12:32:16.284566	f
41	t	2020-08-29 12:45:27.173396	f
43	t	2020-08-29 15:10:43.048924	t
44	t	2020-08-29 15:10:43.048924	f
46	t	2020-08-29 16:34:42.389963	f
47	t	2020-08-29 16:35:28.702641	f
48	t	2020-08-29 16:35:57.542241	t
49	t	2020-08-29 16:35:57.542241	f
50	t	2020-08-29 16:36:49.375828	t
51	t	2020-08-29 16:36:49.375828	t
52	t	2020-08-29 16:36:49.375828	f
53	f	2020-08-29 16:48:58.819139	t
54	t	2020-08-29 16:48:58.819139	f
55	t	2020-08-29 16:49:35.536082	t
56	f	2020-08-29 16:49:35.536082	f
57	f	2020-08-29 16:50:02.397396	t
58	t	2020-08-29 16:50:02.397396	f
59	t	2020-08-29 16:50:27.590304	t
60	f	2020-08-29 16:50:27.590304	f
61	f	2020-08-29 16:51:52.604298	t
62	t	2020-08-29 16:51:52.604298	t
63	f	2020-08-29 16:51:52.604298	f
64	t	2020-08-29 17:02:17.362755	f
65	f	2020-08-29 17:03:31.385401	t
66	t	2020-08-29 17:03:31.385401	t
67	f	2020-08-29 17:03:31.385401	f
68	t	2020-08-29 17:09:37.283117	f
69	f	2020-08-29 17:10:28.029388	f
70	t	2020-08-29 17:12:01.372142	f
71	f	2020-08-29 17:12:42.583775	t
72	t	2020-08-29 17:12:42.583775	t
73	f	2020-08-29 17:12:42.583775	f
\.


--
-- TOC entry 4089 (class 0 OID 18956)
-- Dependencies: 228
-- Data for Name: manage; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.manage (referent_id, place_uuid) FROM stdin;
6	3dbfcddf-faf2-4fab-9813-480156d18e78
6	cd3afabf-9492-4d14-a043-bee26f95e27c
7	ee1d859b-9b0c-4338-92b9-aff1a8e9b962
7	5ea07576-a175-49df-bae4-580ec8af992a
7	d695c33e-8f66-4bb6-a754-407b39857216
7	73d64be0-0790-4495-a639-32c1d75c9a07
7	e46649d1-02d6-497d-a615-c69a62ca067a
7	82673a62-6241-40ff-bb5a-dff5de26f536
7	15e16b77-04ef-4de3-b839-0c0945641e34
\.


--
-- TOC entry 4090 (class 0 OID 18959)
-- Dependencies: 229
-- Data for Name: person; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.person (uuid) FROM stdin;
7cbe2b82-49f5-4790-9447-56a7a083f6bf
e6dd1d45-6202-4e25-8421-a561b6ba25ed
afa5acfd-025a-4b08-a024-9038c65b5531
0f88919f-42a5-45b1-b3a5-5d68b3fe1e09
74f2252c-9a60-47c9-a8bd-246f487b585d
cb196e32-5b5b-4198-8b4d-acbe441ab3be
f9234788-49b0-49a5-bc7f-d16047d53035
74c7f8fb-c44b-4e11-a978-10a9b71ab872
b11a701b-632d-4525-abc3-af5fe24837da
2ba1fcbe-7ab3-4619-ae16-89b29f1c33ec
01bca5b8-44fa-4107-844a-c924f72cf4bd
942bfeaf-80d3-4dc7-a91c-432a6184644d
3637f10b-10e8-4698-aa83-81fa9dc826bb
20be89b1-9e19-456a-9ae4-1c7b1abf7f88
e5ec4b89-ab65-4936-a331-501ff0ebacb0
\.


--
-- TOC entry 4091 (class 0 OID 18962)
-- Dependencies: 230
-- Data for Name: place; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.place (uuid, name, geometry, capacity, visit_time, counter, building_id, enable) FROM stdin;
f30f9226-a949-4454-92d1-94a17a0dab05	Aula Je	0101000020E6100000000000406FCF2740CDA3F659EFB34640	100	160	2	1	t
cd3afabf-9492-4d14-a043-bee26f95e27c	abaco333	0101000020E61000000100000057BE27406EF02A902CB44640	22	2222	-5	1	t
ee1d859b-9b0c-4338-92b9-aff1a8e9b962	Zsdcd	0101000020E6100000010000FA0DC2274004381B78DCB34640	130	30	0	6	t
5ea07576-a175-49df-bae4-580ec8af992a	DEI/G	0101000020E61000000000000E1FCA2740EAF960035CB44640	1500	180	1	1	t
15e16b77-04ef-4de3-b839-0c0945641e34	Majestic Toscanelli	0101000020E61000000000009817C02740C0447653F1B34640	100	400	0	39	t
d695c33e-8f66-4bb6-a754-407b39857216	La Specola	0101000020E6100000010000F8BABC2740842BC4E875B34640	100	200	4	38	t
3dbfcddf-faf2-4fab-9813-480156d18e78	Biblioteca "Giovanni Someda"	0101000020E61000000100004013C22740315BAC0EA1B44640	120	230	20	1	t
82673a62-6241-40ff-bb5a-dff5de26f536	Biblioteca Someda	0101000020E61000000000009AFCC927402DEF40CB54B44640	80	180	3	1	t
73d64be0-0790-4495-a639-32c1d75c9a07	Je	0101000020E6100000010000DE21CA2740E8A970165BB44640	130	180	1	1	t
e46649d1-02d6-497d-a615-c69a62ca067a	Ke	0101000020E61000000100004209CA2740F94BE79647B44640	240	200	-3	1	t
\.


--
-- TOC entry 4097 (class 0 OID 19118)
-- Dependencies: 236
-- Data for Name: place_uuid; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.place_uuid (place_uuid) FROM stdin;
cd3afabf-9492-4d14-a043-bee26f95e27c
\.


--
-- TOC entry 4092 (class 0 OID 18970)
-- Dependencies: 231
-- Data for Name: referent; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.referent (id, firstname, lastname, email, password, enable, new, admin_id) FROM stdin;
3	vdffd	dvdd	vd	dvf	t	f	\N
5	Marco	Piovan	info@mattiavanzi.it	$2a$06$q5kPcS3QP5z7D3rCATItquUUFCCxgYvHVJ/gPJ2sc4q95eaTfGESi	f	f	\N
6	fvdscv	fvffffff	adshvcd@dcdcdc.dc	$2a$06$0gQIU/7SJyb/5uG.VVjsVuHFn4s68rTOWrifSxerDCXN.dkzqBcPu	t	f	\N
1	Mattia	Avanzi	m8.avanzi@gmail.com	dfvdafkvdnkvd	f	f	\N
7	riccardo	coniglio	riccardo.coniglio@gmail.com	$2a$06$VMS4jYQ6R3yQIdXV73R9buMQWzDdroxaTyVB8xdJfsNsUeZ1.1/UG	t	f	\N
\.


--
-- TOC entry 4094 (class 0 OID 18980)
-- Dependencies: 233
-- Data for Name: report; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.report (id, email, description, place_uuid, resolve) FROM stdin;
3	m8.avanzi@gmail.com	Prova	3dbfcddf-faf2-4fab-9813-480156d18e78	t
4	sd@sc.cd	cscssc	cd3afabf-9492-4d14-a043-bee26f95e27c	f
\.


--
-- TOC entry 3884 (class 0 OID 18078)
-- Dependencies: 207
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 4096 (class 0 OID 18989)
-- Dependencies: 235
-- Data for Name: visit; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.visit (place_uuid, log_id, person_uuid) FROM stdin;
3dbfcddf-faf2-4fab-9813-480156d18e78	9	0f88919f-42a5-45b1-b3a5-5d68b3fe1e09
3dbfcddf-faf2-4fab-9813-480156d18e78	10	74f2252c-9a60-47c9-a8bd-246f487b585d
3dbfcddf-faf2-4fab-9813-480156d18e78	11	cb196e32-5b5b-4198-8b4d-acbe441ab3be
3dbfcddf-faf2-4fab-9813-480156d18e78	12	f9234788-49b0-49a5-bc7f-d16047d53035
3dbfcddf-faf2-4fab-9813-480156d18e78	13	74c7f8fb-c44b-4e11-a978-10a9b71ab872
3dbfcddf-faf2-4fab-9813-480156d18e78	14	b11a701b-632d-4525-abc3-af5fe24837da
3dbfcddf-faf2-4fab-9813-480156d18e78	15	2ba1fcbe-7ab3-4619-ae16-89b29f1c33ec
3dbfcddf-faf2-4fab-9813-480156d18e78	16	01bca5b8-44fa-4107-844a-c924f72cf4bd
f30f9226-a949-4454-92d1-94a17a0dab05	17	01bca5b8-44fa-4107-844a-c924f72cf4bd
f30f9226-a949-4454-92d1-94a17a0dab05	18	01bca5b8-44fa-4107-844a-c924f72cf4bd
cd3afabf-9492-4d14-a043-bee26f95e27c	19	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	20	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	21	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	22	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	23	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	24	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	25	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	26	942bfeaf-80d3-4dc7-a91c-432a6184644d
cd3afabf-9492-4d14-a043-bee26f95e27c	27	942bfeaf-80d3-4dc7-a91c-432a6184644d
d695c33e-8f66-4bb6-a754-407b39857216	33	01bca5b8-44fa-4107-844a-c924f72cf4bd
d695c33e-8f66-4bb6-a754-407b39857216	34	01bca5b8-44fa-4107-844a-c924f72cf4bd
d695c33e-8f66-4bb6-a754-407b39857216	35	01bca5b8-44fa-4107-844a-c924f72cf4bd
d695c33e-8f66-4bb6-a754-407b39857216	36	01bca5b8-44fa-4107-844a-c924f72cf4bd
d695c33e-8f66-4bb6-a754-407b39857216	38	942bfeaf-80d3-4dc7-a91c-432a6184644d
d695c33e-8f66-4bb6-a754-407b39857216	41	20be89b1-9e19-456a-9ae4-1c7b1abf7f88
d695c33e-8f66-4bb6-a754-407b39857216	43	20be89b1-9e19-456a-9ae4-1c7b1abf7f88
d695c33e-8f66-4bb6-a754-407b39857216	44	20be89b1-9e19-456a-9ae4-1c7b1abf7f88
e46649d1-02d6-497d-a615-c69a62ca067a	46	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	47	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	48	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	49	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	50	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	51	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	52	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	53	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	54	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	55	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	56	e5ec4b89-ab65-4936-a331-501ff0ebacb0
e46649d1-02d6-497d-a615-c69a62ca067a	57	e5ec4b89-ab65-4936-a331-501ff0ebacb0
15e16b77-04ef-4de3-b839-0c0945641e34	58	e5ec4b89-ab65-4936-a331-501ff0ebacb0
15e16b77-04ef-4de3-b839-0c0945641e34	59	e5ec4b89-ab65-4936-a331-501ff0ebacb0
15e16b77-04ef-4de3-b839-0c0945641e34	60	e5ec4b89-ab65-4936-a331-501ff0ebacb0
15e16b77-04ef-4de3-b839-0c0945641e34	61	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	62	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	63	e5ec4b89-ab65-4936-a331-501ff0ebacb0
ee1d859b-9b0c-4338-92b9-aff1a8e9b962	64	e5ec4b89-ab65-4936-a331-501ff0ebacb0
ee1d859b-9b0c-4338-92b9-aff1a8e9b962	65	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	66	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	67	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	68	e5ec4b89-ab65-4936-a331-501ff0ebacb0
5ea07576-a175-49df-bae4-580ec8af992a	69	e5ec4b89-ab65-4936-a331-501ff0ebacb0
15e16b77-04ef-4de3-b839-0c0945641e34	70	e5ec4b89-ab65-4936-a331-501ff0ebacb0
15e16b77-04ef-4de3-b839-0c0945641e34	71	e5ec4b89-ab65-4936-a331-501ff0ebacb0
d695c33e-8f66-4bb6-a754-407b39857216	72	e5ec4b89-ab65-4936-a331-501ff0ebacb0
d695c33e-8f66-4bb6-a754-407b39857216	73	e5ec4b89-ab65-4936-a331-501ff0ebacb0
\.


--
-- TOC entry 3885 (class 0 OID 18778)
-- Dependencies: 212
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: nobis
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- TOC entry 3886 (class 0 OID 18791)
-- Dependencies: 213
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: nobis
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- TOC entry 4114 (class 0 OID 0)
-- Dependencies: 218
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.admin_id_seq', 1, true);


--
-- TOC entry 4115 (class 0 OID 0)
-- Dependencies: 220
-- Name: building_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.building_id_seq', 39, true);


--
-- TOC entry 4116 (class 0 OID 0)
-- Dependencies: 222
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.category_id_seq', 6, true);


--
-- TOC entry 4117 (class 0 OID 0)
-- Dependencies: 223
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feedback_id_seq', 5, true);


--
-- TOC entry 4118 (class 0 OID 0)
-- Dependencies: 227
-- Name: log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.log_id_seq', 73, true);


--
-- TOC entry 4119 (class 0 OID 0)
-- Dependencies: 232
-- Name: referent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.referent_id_seq', 7, true);


--
-- TOC entry 4120 (class 0 OID 0)
-- Dependencies: 234
-- Name: report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.report_id_seq', 4, true);


--
-- TOC entry 3913 (class 2606 OID 18998)
-- Name: admin admin_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pk PRIMARY KEY (id);


--
-- TOC entry 3915 (class 2606 OID 19000)
-- Name: building building_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.building
    ADD CONSTRAINT building_pk PRIMARY KEY (id);


--
-- TOC entry 3917 (class 2606 OID 19002)
-- Name: category category_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pk PRIMARY KEY (id);


--
-- TOC entry 3919 (class 2606 OID 19004)
-- Name: feedback feedback_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pk PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 19006)
-- Name: have have_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_pk PRIMARY KEY (place_uuid, category_id);


--
-- TOC entry 3923 (class 2606 OID 19008)
-- Name: log log_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_pk PRIMARY KEY (id);


--
-- TOC entry 3925 (class 2606 OID 19010)
-- Name: manage manage_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_pk PRIMARY KEY (referent_id, place_uuid);


--
-- TOC entry 3927 (class 2606 OID 19012)
-- Name: person person_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pk PRIMARY KEY (uuid);


--
-- TOC entry 3929 (class 2606 OID 19014)
-- Name: place place_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.place
    ADD CONSTRAINT place_pk PRIMARY KEY (uuid);


--
-- TOC entry 3931 (class 2606 OID 19016)
-- Name: referent referent_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.referent
    ADD CONSTRAINT referent_pk PRIMARY KEY (id);


--
-- TOC entry 3933 (class 2606 OID 19018)
-- Name: report report_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_pk PRIMARY KEY (id);


--
-- TOC entry 3935 (class 2606 OID 19020)
-- Name: visit visit_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_pk PRIMARY KEY (place_uuid, log_id, person_uuid);


--
-- TOC entry 3936 (class 2606 OID 19021)
-- Name: feedback feedback_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_fk FOREIGN KEY (log_id) REFERENCES public.log(id);


--
-- TOC entry 3937 (class 2606 OID 19026)
-- Name: have have_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_fk FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- TOC entry 3938 (class 2606 OID 19031)
-- Name: have have_fk_1; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_fk_1 FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- TOC entry 3939 (class 2606 OID 19036)
-- Name: manage manage_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_fk FOREIGN KEY (referent_id) REFERENCES public.referent(id);


--
-- TOC entry 3940 (class 2606 OID 19041)
-- Name: manage manage_fk_1; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_fk_1 FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- TOC entry 3941 (class 2606 OID 19046)
-- Name: place place_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.place
    ADD CONSTRAINT place_fk FOREIGN KEY (building_id) REFERENCES public.building(id);


--
-- TOC entry 3942 (class 2606 OID 19051)
-- Name: referent referent_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.referent
    ADD CONSTRAINT referent_fk FOREIGN KEY (admin_id) REFERENCES public.admin(id);


--
-- TOC entry 3943 (class 2606 OID 19056)
-- Name: report report_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_fk FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- TOC entry 3944 (class 2606 OID 19061)
-- Name: visit visit_fk_log; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_log FOREIGN KEY (log_id) REFERENCES public.log(id);


--
-- TOC entry 3945 (class 2606 OID 19066)
-- Name: visit visit_fk_person; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_person FOREIGN KEY (person_uuid) REFERENCES public.person(uuid);


--
-- TOC entry 3946 (class 2606 OID 19071)
-- Name: visit visit_fk_place; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_place FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- TOC entry 4110 (class 0 OID 0)
-- Dependencies: 223
-- Name: SEQUENCE feedback_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.feedback_id_seq TO nobis;


-- Completed on 2020-08-30 02:10:58 CEST

--
-- PostgreSQL database dump complete
--

