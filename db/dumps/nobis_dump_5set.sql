--
-- PostgreSQL database dump
--

-- Dumped from database version 12.4 (Ubuntu 12.4-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.4 (Ubuntu 12.4-0ubuntu0.20.04.1)

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
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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


--
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
-- Name: findplacesinbox(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: nobis
--

CREATE FUNCTION public.findplacesinbox(xmin numeric, ymin numeric, xmax numeric, ymax numeric) RETURNS TABLE(puuid uuid, pname text, buildingname text, category text, geocoord text, occ numeric, highfeedback bigint, mediumfeedback bigint, lowfeedback bigint)
    LANGUAGE sql
    AS $$

SELECT place.uuid AS uuid,
place.name,
building.name AS building,
category.name AS category,
st_astext(place.geometry) AS geocoord,
TRUNC((place.counter::decimal(3) / place.capacity),2) AS occ,
getfeedbackbyplace(place.uuid, 3) AS highFeedback,
getfeedbackbyplace(place.uuid, 2) AS mediumFeedback,
getfeedbackbyplace(place.uuid, 1) AS lowFeedback
FROM place
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
-- Name: getfeedbackbyplace(uuid, numeric); Type: FUNCTION; Schema: public; Owner: nobis
--

CREATE FUNCTION public.getfeedbackbyplace(placeuuid uuid, placerating numeric) RETURNS TABLE(feedback bigint)
    LANGUAGE sql
    AS $$

SELECT COUNT(*) AS feedback FROM visit
LEFT JOIN log
ON log.id = visit.log_id
LEFT JOIN feedback
ON feedback.log_id = log.id
WHERE place_uuid = placeuuid AND log.timestamp >= NOW() - interval '2 hours' AND feedback.rating = placerating;

$$;


ALTER FUNCTION public.getfeedbackbyplace(placeuuid uuid, placerating numeric) OWNER TO nobis;

--
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
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
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
-- Name: building_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.building_id_seq OWNED BY public.building.id;


--
-- Name: category; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.category (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.category OWNER TO nobis;

--
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
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.category_id_seq OWNED BY public.category.id;


--
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
-- Name: feedback; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.feedback (
    id integer DEFAULT nextval('public.feedback_id_seq'::regclass) NOT NULL,
    rating integer NOT NULL,
    log_id integer NOT NULL
);


ALTER TABLE public.feedback OWNER TO nobis;

--
-- Name: have; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.have (
    place_uuid uuid NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.have OWNER TO nobis;

--
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
-- Name: log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.log_id_seq OWNED BY public.log.id;


--
-- Name: manage; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.manage (
    referent_id integer NOT NULL,
    place_uuid uuid NOT NULL
);


ALTER TABLE public.manage OWNER TO nobis;

--
-- Name: person; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.person (
    uuid uuid NOT NULL
);


ALTER TABLE public.person OWNER TO nobis;

--
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
-- Name: COLUMN place.visit_time; Type: COMMENT; Schema: public; Owner: nobis
--

COMMENT ON COLUMN public.place.visit_time IS '(Minutes)';


--
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
-- Name: report; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.report (
    id integer NOT NULL,
    description text NOT NULL,
    place_uuid uuid NOT NULL,
    resolve boolean DEFAULT false NOT NULL
);


ALTER TABLE public.report OWNER TO nobis;

--
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
-- Name: report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nobis
--

ALTER SEQUENCE public.report_id_seq OWNED BY public.report.id;


--
-- Name: visit; Type: TABLE; Schema: public; Owner: nobis
--

CREATE TABLE public.visit (
    place_uuid uuid NOT NULL,
    log_id integer NOT NULL,
    person_uuid uuid NOT NULL
);


ALTER TABLE public.visit OWNER TO nobis;

--
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- Name: building id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.building ALTER COLUMN id SET DEFAULT nextval('public.building_id_seq'::regclass);


--
-- Name: category id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.category ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- Name: log id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.log ALTER COLUMN id SET DEFAULT nextval('public.log_id_seq'::regclass);


--
-- Name: report id; Type: DEFAULT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.report ALTER COLUMN id SET DEFAULT nextval('public.report_id_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.admin (id, firstname, lastname, email, password) FROM stdin;
1	Mattia	Avanzi	m8.avanzi@gmail.com	$2a$06$PIaPdgtYY5fs4wLTuEPNFOgyJWJLcOEA928ow.u1JJWW0tNtQQ/ZS
2	Riccardo	Coniglio	riccardo.coniglio@gmail.com	$2a$04$BxUYcAXyHM89en6MIEdH0eIZAD1ZGQEAyKp6Y6uSpD/Rl5.qAuPze
\.


--
-- Data for Name: building; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.building (id, name, geometry, address, addr_num, city) FROM stdin;
1	Complesso DEI	0101000020E610000001000058E4C92740211BF24330B44640	via Gradenigo	6B	Padova
\.


--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.category (id, name) FROM stdin;
1	Aula Didattica
2	Edificio
3	Aula Studio
4	Laboratorio
5	Biblioteca
6	Mensa
7	Aula Magna
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.feedback (id, rating, log_id) FROM stdin;
1	1	7
2	1	6
\.


--
-- Data for Name: have; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.have (place_uuid, category_id) FROM stdin;
7e1029c0-87e7-4a21-9635-a91039030ced	2
\.


--
-- Data for Name: log; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.log (id, is_in, "timestamp", assumption) FROM stdin;
1	t	2020-09-03 11:32:42.817732	f
2	t	2020-09-03 11:34:00.304357	f
5	t	2020-09-03 11:39:43.307605	f
6	f	2020-09-03 11:41:56.760478	f
7	f	2020-09-03 11:42:00.110757	f
8	f	2020-09-03 11:42:00.672988	f
10	t	2020-09-03 11:43:57.162022	f
11	t	2020-09-03 11:44:03.507906	f
12	t	2020-09-03 11:44:07.472908	f
13	t	2020-09-03 11:44:29.719925	f
15	f	2020-09-03 14:05:57.050886	f
16	t	2020-09-03 14:06:56.768127	f
\.


--
-- Data for Name: manage; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.manage (referent_id, place_uuid) FROM stdin;
3	7e1029c0-87e7-4a21-9635-a91039030ced
\.


--
-- Data for Name: person; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.person (uuid) FROM stdin;
715757e7-254a-40c5-a3b3-92ebc1d55229
fb7b99e6-c5a2-4c69-8e3e-b8284ed8ce6f
fe55154c-c838-44bc-a816-ad3dd18dafc0
50ef9fe1-c51d-4543-8c8f-0601f8e7847c
\.


--
-- Data for Name: place; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.place (uuid, name, geometry, capacity, visit_time, counter, building_id, enable) FROM stdin;
7e1029c0-87e7-4a21-9635-a91039030ced	DEI/A	0101000020E610000001000090E8C9274063C7921F40B44640	3	1000	0	1	t
\.


--
-- Data for Name: referent; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.referent (id, firstname, lastname, email, password, enable, new, admin_id) FROM stdin;
1	Mattia	Avanzi	m8.avanzi@gmail.com	$2a$06$LfeCZTbk6e3e8CGomPUFje7DCf//V8U8S0VRe9AwsI2jfdzvoSGES	t	f	\N
2	Riccardo	Coniglio	riccardo.coniglio@gmail.com	$2a$06$cDW5dV3k.w2.nLzow6P9G.OUNyMDB0fhbpOcjVtHl2YGVZV3EfvVe	t	f	\N
3	Marco	Giordani	marco.giordani@unipd.it	$2a$06$z7Ytz2P07QjRsc1iWNdFyOCzvXj/4V2w0EMzklPTVlvK4fH4TBOAO	t	f	\N
4	Giulia	Cisotto	giulia.cisotto.1@unipd.it	$2a$06$haQF/14GAH763/xH7PQa8uNIrwIb6QcV1EfTY1Olw3AXWq.NJp0YS	t	f	\N
\.


--
-- Data for Name: report; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.report (id, description, place_uuid, resolve) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: visit; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.visit (place_uuid, log_id, person_uuid) FROM stdin;
7e1029c0-87e7-4a21-9635-a91039030ced	1	715757e7-254a-40c5-a3b3-92ebc1d55229
7e1029c0-87e7-4a21-9635-a91039030ced	2	fb7b99e6-c5a2-4c69-8e3e-b8284ed8ce6f
7e1029c0-87e7-4a21-9635-a91039030ced	5	50ef9fe1-c51d-4543-8c8f-0601f8e7847c
7e1029c0-87e7-4a21-9635-a91039030ced	6	715757e7-254a-40c5-a3b3-92ebc1d55229
7e1029c0-87e7-4a21-9635-a91039030ced	7	fb7b99e6-c5a2-4c69-8e3e-b8284ed8ce6f
7e1029c0-87e7-4a21-9635-a91039030ced	8	50ef9fe1-c51d-4543-8c8f-0601f8e7847c
7e1029c0-87e7-4a21-9635-a91039030ced	10	715757e7-254a-40c5-a3b3-92ebc1d55229
7e1029c0-87e7-4a21-9635-a91039030ced	11	fb7b99e6-c5a2-4c69-8e3e-b8284ed8ce6f
7e1029c0-87e7-4a21-9635-a91039030ced	12	50ef9fe1-c51d-4543-8c8f-0601f8e7847c
7e1029c0-87e7-4a21-9635-a91039030ced	13	fe55154c-c838-44bc-a816-ad3dd18dafc0
7e1029c0-87e7-4a21-9635-a91039030ced	15	fb7b99e6-c5a2-4c69-8e3e-b8284ed8ce6f
7e1029c0-87e7-4a21-9635-a91039030ced	16	fb7b99e6-c5a2-4c69-8e3e-b8284ed8ce6f
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: nobis
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: nobis
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.admin_id_seq', 1, true);


--
-- Name: building_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.building_id_seq', 1, true);


--
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.category_id_seq', 1, false);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feedback_id_seq', 3, true);


--
-- Name: log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.log_id_seq', 16, true);


--
-- Name: referent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.referent_id_seq', 4, true);


--
-- Name: report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.report_id_seq', 1, false);


--
-- Name: admin admin_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pk PRIMARY KEY (id);


--
-- Name: building building_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.building
    ADD CONSTRAINT building_pk PRIMARY KEY (id);


--
-- Name: category category_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pk PRIMARY KEY (id);


--
-- Name: feedback feedback_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pk PRIMARY KEY (id);


--
-- Name: have have_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_pk PRIMARY KEY (place_uuid, category_id);


--
-- Name: log log_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_pk PRIMARY KEY (id);


--
-- Name: manage manage_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_pk PRIMARY KEY (referent_id, place_uuid);


--
-- Name: person person_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pk PRIMARY KEY (uuid);


--
-- Name: place place_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.place
    ADD CONSTRAINT place_pk PRIMARY KEY (uuid);


--
-- Name: referent referent_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.referent
    ADD CONSTRAINT referent_pk PRIMARY KEY (id);


--
-- Name: report report_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_pk PRIMARY KEY (id);


--
-- Name: visit visit_pk; Type: CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_pk PRIMARY KEY (place_uuid, log_id, person_uuid);


--
-- Name: feedback feedback_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_fk FOREIGN KEY (log_id) REFERENCES public.log(id);


--
-- Name: have have_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_fk FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- Name: have have_fk_1; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.have
    ADD CONSTRAINT have_fk_1 FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- Name: manage manage_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_fk FOREIGN KEY (referent_id) REFERENCES public.referent(id);


--
-- Name: manage manage_fk_1; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.manage
    ADD CONSTRAINT manage_fk_1 FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- Name: place place_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.place
    ADD CONSTRAINT place_fk FOREIGN KEY (building_id) REFERENCES public.building(id);


--
-- Name: referent referent_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.referent
    ADD CONSTRAINT referent_fk FOREIGN KEY (admin_id) REFERENCES public.admin(id);


--
-- Name: report report_fk; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.report
    ADD CONSTRAINT report_fk FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- Name: visit visit_fk_log; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_log FOREIGN KEY (log_id) REFERENCES public.log(id);


--
-- Name: visit visit_fk_person; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_person FOREIGN KEY (person_uuid) REFERENCES public.person(uuid);


--
-- Name: visit visit_fk_place; Type: FK CONSTRAINT; Schema: public; Owner: nobis
--

ALTER TABLE ONLY public.visit
    ADD CONSTRAINT visit_fk_place FOREIGN KEY (place_uuid) REFERENCES public.place(uuid);


--
-- Name: SEQUENCE feedback_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.feedback_id_seq TO nobis;


--
-- PostgreSQL database dump complete
--

