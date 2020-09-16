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
INSERT INTO log (is_in, timestamp, assumption) VALUES (true, clock_timestamp(),_assumption) RETURNING log.id INTO newlogid;
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
INSERT INTO log (is_in, timestamp, assumption) VALUES (false, clock_timestamp(),_assumption) RETURNING log.id INTO newlogid;
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

PERFORM * FROM person where person.uuid=_personuuid;
IF NOT FOUND THEN
 raise notice 'person does not exists';
 INSERT INTO person (uuid) VALUES (_personuuid);
 raise notice 'person created';
ELSE
 raise notice 'person exists';
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
 --PERFORM pg_sleep(0.001);
 PERFORM checkinf(_personuuid,_placeuuid,false);
ELSIF ((lastplace IS NOT NULL) AND (lastplace <> _placeuuid)) THEN
 casenumber := 4;
 raise notice 'caso E: ';
 raise notice 'currentplace != lastplace';
 raise notice 'lastplace: %', lastplace;
 raise notice 'currentplace: %', _placeuuid;
 PERFORM checkoutf(_personuuid,lastplace,true);
 --PERFORM pg_sleep(0.001);
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

PERFORM * FROM person where person.uuid=_personuuid;
IF NOT FOUND THEN
 raise notice 'person does not exists';
 INSERT INTO person (uuid) VALUES (_personuuid);
 raise notice 'person created';
ELSE
 raise notice 'person exists';
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
 --PERFORM pg_sleep(0.001);
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
 --PERFORM pg_sleep(0.001);
 PERFORM checkinf(_personuuid,_placeuuid,true);
 --PERFORM pg_sleep(0.001);
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
4	1	41
5	1	92
7	1	125
8	3	127
9	1	130
10	1	139
11	1	142
12	3	143
13	1	145
14	1	148
17	1	153
19	2	173
20	1	184
21	1	187
22	2	207
\.


--
-- Data for Name: have; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.have (place_uuid, category_id) FROM stdin;
7e1029c0-87e7-4a21-9635-a91039030ced	2
d165cea3-6f90-4174-9ead-cdcbd0787fee	4
dc7fe111-a66d-4d19-942b-33cd9214cd43	4
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
17	t	2020-09-10 05:52:20.340799	f
18	t	2020-09-10 06:16:30.710412	f
20	t	2020-09-10 06:25:52.115269	f
125	f	2020-09-10 10:17:27.216223	f
23	t	2020-09-10 06:28:42.236939	f
24	t	2020-09-10 06:32:27.731115	f
25	t	2020-09-10 06:35:24.580645	f
127	f	2020-09-10 10:19:57.05422	f
27	t	2020-09-10 06:56:46.488398	f
28	t	2020-09-10 06:57:52.394167	f
29	f	2020-09-10 07:01:59.806927	f
30	t	2020-09-10 07:03:47.117063	f
31	t	2020-09-10 07:31:35.956309	f
32	t	2020-09-10 07:34:50.136187	f
33	t	2020-09-10 07:42:28.90537	f
34	t	2020-09-10 07:42:44.430126	f
35	t	2020-09-10 07:44:01.194531	f
36	t	2020-09-10 08:11:14.980834	f
37	t	2020-09-10 08:12:01.188468	f
38	t	2020-09-10 08:38:40.292039	f
39	t	2020-09-10 09:04:03.02267	f
40	t	2020-09-10 09:04:58.288897	f
41	f	2020-09-10 09:40:22.716971	f
42	t	2020-09-10 09:56:51.350584	f
128	f	2020-09-10 10:35:07.205388	f
44	t	2020-09-10 10:09:19.572621	f
45	t	2020-09-10 10:09:28.823966	f
129	f	2020-09-10 10:35:36.991517	f
47	t	2020-09-10 10:09:30.770091	f
130	f	2020-09-10 10:35:39.93208	f
49	t	2020-09-10 10:09:33.411511	f
131	f	2020-09-10 10:36:08.355725	f
51	t	2020-09-10 10:09:41.670585	f
132	t	2020-09-10 10:58:26.188882	f
53	t	2020-09-10 10:09:42.93336	f
133	t	2020-09-10 11:03:05.032382	f
55	t	2020-09-10 10:09:46.174947	f
134	t	2020-09-10 11:04:22.985651	f
57	t	2020-09-10 10:09:51.214831	f
135	t	2020-09-10 11:04:31.276459	f
59	t	2020-09-10 10:09:58.594838	f
136	t	2020-09-10 11:15:56.83869	f
138	t	2020-09-10 11:51:34.303416	f
139	f	2020-09-10 12:03:05.652637	f
140	t	2020-09-10 12:24:29.955301	f
141	t	2020-09-10 13:35:47.3646	f
142	f	2020-09-10 15:50:42.180639	f
143	f	2020-09-10 16:01:17.451652	f
145	t	2020-09-10 16:03:34.411269	f
146	f	2020-09-10 16:04:10.798968	f
147	f	2020-09-10 16:04:14.873887	f
148	f	2020-09-10 16:04:47.383178	f
151	t	2020-09-10 16:32:34.648335	f
153	f	2020-09-10 17:18:06.472122	f
80	f	2020-09-10 10:11:20.802219	f
156	t	2020-09-10 20:29:16.879835	f
157	f	2020-09-10 20:29:35.117757	f
158	t	2020-09-11 06:04:30.723731	f
159	t	2020-09-11 06:16:37.151826	f
160	t	2020-09-11 06:32:29.265627	f
161	t	2020-09-11 07:09:36.3617	f
162	t	2020-09-11 07:47:23.040473	f
163	t	2020-09-11 08:37:58.713388	f
90	t	2020-09-10 10:12:20.361413	f
91	f	2020-09-10 10:12:26.263888	f
92	f	2020-09-10 10:13:13.139308	f
165	t	2020-09-11 10:05:37.094006	f
170	t	2020-09-11 11:31:29.1262	f
171	f	2020-09-11 12:16:08.091524	f
172	f	2020-09-11 15:28:26.076453	f
173	f	2020-09-11 15:30:48.438701	f
174	f	2020-09-11 16:35:50.995951	f
176	t	2020-09-13 10:03:25.751987	f
177	t	2020-09-14 06:17:52.2053	f
178	t	2020-09-14 06:18:15.733827	f
179	f	2020-09-14 06:19:03.243868	t
180	t	2020-09-14 06:19:03.244765	f
181	t	2020-09-14 06:22:25.054975	f
182	t	2020-09-14 08:54:56.567468	f
183	f	2020-09-14 10:17:14.562341	f
184	f	2020-09-14 10:58:59.834857	f
185	t	2020-09-14 12:03:39.365498	f
186	t	2020-09-14 12:26:42.149364	f
187	f	2020-09-14 16:40:06.81079	f
188	f	2020-09-14 16:59:03.671686	f
189	t	2020-09-15 06:12:10.65843	f
190	t	2020-09-15 06:12:59.070986	f
191	t	2020-09-15 06:16:14.312983	f
192	t	2020-09-15 06:48:50.121118	f
193	f	2020-09-15 06:49:51.848319	t
194	t	2020-09-15 06:49:51.84941	f
195	t	2020-09-15 06:56:42.518411	f
196	f	2020-09-15 06:57:34.960203	t
197	t	2020-09-15 06:57:34.961092	f
198	t	2020-09-15 07:01:56.520608	f
199	t	2020-09-15 07:03:56.317833	f
200	t	2020-09-15 07:11:47.332203	f
201	t	2020-09-15 08:18:15.246876	f
202	t	2020-09-15 08:27:27.044916	f
203	t	2020-09-15 08:41:54.146757	f
204	t	2020-09-15 09:07:10.926264	f
205	f	2020-09-15 10:17:54.325685	f
206	f	2020-09-15 10:18:04.614636	f
207	f	2020-09-15 10:18:46.216726	f
208	f	2020-09-15 10:21:27.999471	f
209	f	2020-09-15 10:21:34.422544	t
210	t	2020-09-15 10:21:34.423092	t
211	f	2020-09-15 10:21:34.423598	f
212	f	2020-09-15 10:22:19.530705	f
213	t	2020-09-15 10:23:06.04452	f
214	f	2020-09-15 10:23:28.457987	t
215	t	2020-09-15 10:23:28.459054	f
216	f	2020-09-15 10:23:28.475217	t
217	t	2020-09-15 10:23:28.476362	f
218	t	2020-09-15 10:23:39.703681	f
219	t	2020-09-15 10:42:59.451037	f
220	f	2020-09-15 10:44:19.966419	t
221	t	2020-09-15 10:44:19.967581	t
222	f	2020-09-15 10:44:19.968302	f
223	t	2020-09-15 10:47:24.573203	f
224	f	2020-09-15 10:47:47.313059	f
225	f	2020-09-15 10:57:57.8712	f
226	t	2020-09-15 10:58:33.705604	f
227	t	2020-09-15 11:00:16.873579	f
228	t	2020-09-15 11:00:26.40871	f
229	t	2020-09-15 12:12:04.410132	f
230	t	2020-09-15 12:12:13.720207	f
231	t	2020-09-15 13:51:33.578358	f
\.


--
-- Data for Name: manage; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.manage (referent_id, place_uuid) FROM stdin;
3	7e1029c0-87e7-4a21-9635-a91039030ced
4	dc7fe111-a66d-4d19-942b-33cd9214cd43
3	d165cea3-6f90-4174-9ead-cdcbd0787fee
\.


--
-- Data for Name: person; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.person (uuid) FROM stdin;
715757e7-254a-40c5-a3b3-92ebc1d55229
fb7b99e6-c5a2-4c69-8e3e-b8284ed8ce6f
fe55154c-c838-44bc-a816-ad3dd18dafc0
50ef9fe1-c51d-4543-8c8f-0601f8e7847c
2bfa12ed-6de1-4b90-a0c8-d9d33012e576
7aa1dc33-db16-4408-b3af-a16a31803378
fe511d9d-962f-4855-a18e-8e1da4c8dc22
eb7201ca-1a9d-4046-bcb8-72b61e9ce434
c90695e6-09c5-4172-8d91-30fb8661663e
c05d7229-a98b-4791-aac4-83ccab706881
cafa0d72-fc97-4885-915c-1ee7c219e583
c5452447-3fdc-4783-a80e-e9cc7fbbcd43
c77e652e-46a7-4e84-85c6-ff81b74ccb30
5fb67239-4bad-4cbc-9a1e-45c45ae676a8
a2e22204-d6a7-47eb-8465-d191fadfcb0c
e08b38d0-c4cd-4a00-b445-e48e90d3280f
5af12d4b-b59a-4f0e-8899-5e46fe3d2279
c86e9fdc-f36e-437f-9d83-5aa3263a305f
011d772a-d2a9-4325-8a14-1017cedb2c63
984131b6-4c3e-4860-9369-72c64bf87c3e
60014343-2f4a-4eb6-ab8b-85c94e46641b
7ce308eb-7204-45f0-b969-288417bd1fa0
1ca07ccd-8c7e-4649-a1ba-620331e00a08
d9488993-70e7-4b41-9513-2add77d3c22c
524bb96d-a0f5-4099-807d-ccb4e94b5740
d70bfbbf-04d8-43fe-ba6e-afb80b33122e
f790a53f-4b06-4537-9ee1-d7ece39ceb67
d56387eb-abaa-4103-b76c-a5928b275606
da58c9fd-d488-4abb-8279-e4caf54f5139
a0a2c53e-39c2-4c2e-a971-c4c45ea3b09b
c0642686-d7ea-4ec7-a0d6-64131e8a9533
b0ace149-4940-4542-bb74-d116ddb8f03f
954ce32e-25c5-4b61-9b91-90365aefddc6
0548e19c-a22f-4327-9310-0cafe2e6e50c
bec18d72-54f1-4324-a3e3-cf46aae63448
ccb8736c-bdc4-468a-8849-b32caf6790ba
30b1bb6e-334a-4989-b5db-cc8006ae6c42
7ca680ca-b322-4608-b81e-11dfa7a333b7
6980ea78-db4d-45a2-9de1-6502f6ab97a6
80fcc969-4a64-4ede-b206-9e1ac2e2d2bc
0bcd304c-6c18-4fb6-a413-1f7c61270dad
2f7c38f1-e241-4219-a66a-82b300ecd179
263721cd-b11f-4b70-ba7e-447a810ae826
a9a1b044-49f3-4c4a-a292-e6588cd60640
1b4e3393-dd93-44f6-8861-04a49d1c64e4
7971ec82-4569-482f-bdcd-26bd6d78a2cf
1fd8291e-d29a-42f4-a67f-25b5f9a9c4b1
978eeb1d-a4c1-46b6-b24e-737a6c77e989
8d8a8d8e-8354-4d0c-b25f-0e30a717feaf
2f8a3296-52d5-4fee-b031-183f414c4c6e
02fcf875-bec5-4b40-9b39-3c263412f127
28bd49e6-0a4f-4673-8d30-7ce672962ddb
d52e7774-fcf2-400d-b5d8-283ce9ec18d9
de9b7cd8-c281-4c7e-ac86-fe40a5a8bde3
ebb071f3-9d74-42a1-ba69-7b54e3352c8f
f455851a-6152-40d0-b59b-63e960f97695
ea2a6ded-609f-4383-af72-e9c91eda5d95
a6256cc8-ded9-457f-bb44-0ea1767b7878
5e15beb8-82b8-43ba-8b7e-16f0465cd29d
4935f849-f3be-4c9e-a551-65e49046c2a8
bafb265e-7baa-46de-8b40-c508260a30e4
2e8b0e33-ed33-45d8-a34e-e4a824f4a2fb
66561529-5a9a-4022-9ee6-ca38bc26bc57
d90bdd0b-c5be-4425-b2b9-01580dc4a44a
2bccf2ce-eff1-418c-b100-753edccc66a4
084593d1-4836-453d-9780-55b5a9068a2c
b0d861c5-14b1-4ef7-a720-e53b2c759999
5deb11aa-d39d-419e-8272-47268085926f
b12d4b24-63e4-49bf-bf01-6df827337973
41fc7d52-7d99-4444-9423-4fb780718997
39ccea6f-1124-4b68-93a9-5a752b464846
f0aeddd1-5d7e-4223-8c49-a43a00a2250d
b473976a-6342-431f-9df6-dcafb660dec6
9a784803-1f86-42a6-a6c9-88c580cb1697
e0054d3f-8a66-4efb-add8-7b9a17398652
b6d7a071-32e0-4051-9eaa-90509210af6c
c8ec6b0f-9627-4402-84bd-e9fdc5ea9cfa
c6b0f468-a132-40f9-8481-9a40488e4a43
74a99b22-97cf-4b4e-861d-aff91137e924
e0ecddc9-d8bb-46da-a58a-dcc8d51f810a
3963a18e-7960-48ba-b3b6-16e672fa8011
5ebb112c-7924-4e39-b0a7-80edb36074e7
a176e8a4-26ba-4e0c-9dc8-a8db2ffc9dc6
769d512f-44db-4d72-957d-60214a90b354
aa38e819-ad3d-41fa-b8f3-8c0899d7c5a2
3a55d180-3bac-4bfb-b0c4-a62e829de9d3
58ae4dca-a6ba-454c-b412-5e17c8b767ec
1c303965-93f0-42b1-9349-44eb09ff7b10
34f41559-6abe-4485-bf7f-3b6573ad6253
63bc7e1a-ecf4-4acb-a314-7670adb15458
35dac558-9813-49df-9a74-d47feeef9551
dd8ddbbf-8096-4483-8c6d-ff59161bcfd1
619c4b52-f6da-4ba2-bc87-174a413877fa
81df8350-1e20-4b63-86f5-db07d86fc19d
37458a31-99f7-4088-8e65-8809722a782d
c785d78a-a5ed-4b31-b77b-f3c1e639940e
2b3d1bc1-b238-40f1-941e-4a5fc0c61e7a
9eaffe34-a736-4ded-a6d8-629ec4ac8692
e347029f-41aa-43a2-863a-750b63cf9ef7
352f7bf1-72ce-4091-86c5-07d9e2682a98
e7af5eef-f11c-42f5-a3e6-41f45a82d799
8d49d716-7db5-4263-a884-5a85c6445782
0d0cb38f-cc83-4b7d-8ac7-ae8cd6740092
2f3c7ed6-9207-48c8-a1b8-1f818db8e8bc
b7957c72-1a3f-4462-8499-180dceba3a76
a63e4c51-c5a6-4ab0-8e47-6924a558d009
2d3416ae-cd26-44c2-bf1e-0e498a6c033a
ed8e4723-2d19-47fd-b0f0-4e1e475f2ac5
f02721b9-31c0-44f0-856e-859667d012ec
6d983093-e77c-45a6-a4f3-d027f3b3c235
5dd74b2f-38d1-42c7-b825-7e9ad93e8454
2af2c8fd-9cfc-4bf2-80c8-b293980b1af5
3a7fc520-9b6a-4c11-9da7-1943170e2635
73352f8f-3911-4585-bf79-d783d32e1d2b
770647cd-29f6-4cc3-9db6-4b8ffe3bab83
ec5e2097-99c0-4296-b72e-d068494a978b
fe76b3e5-200d-4b75-a975-47ba25b6785b
7efc2d48-ceb1-46a9-ad71-120da0e0d6eb
31d18ed4-b0b6-4949-a47b-edb84fec811a
5da6abf8-7f81-4111-9ff0-b452838f2256
4eeba1fa-a704-474b-8289-a3f7e5907855
7da7d0a5-98c4-4db4-aec0-6ea26a989d6b
55ab6175-95f7-4f8a-8518-dfa45c6b706e
1db2c613-330e-40ec-986b-d0baa731d949
0a3d3251-5241-4442-8a0e-fb7c436182ba
e9aca88e-bd61-4a05-abfc-4de980cb080f
8e4e0ed2-4ad4-4a6d-9b74-d4c613b99fa7
c6f6d152-34c7-4c06-be9c-db64b0df16bf
ef026036-6a4b-4cee-bb91-130cc7692093
4379cfa2-0578-4ba7-8017-26f45420dbf2
8959b830-2a41-4611-a1e7-0c3daa3778af
865d461f-71b9-416c-9598-154a79964f1a
e08469c9-df41-4227-bcfd-2890f38126f0
92b2de07-f20e-42d2-98ec-fad0437607bc
b57c92a2-4692-4223-b584-c78119be98e7
\.


--
-- Data for Name: place; Type: TABLE DATA; Schema: public; Owner: nobis
--

COPY public.place (uuid, name, geometry, capacity, visit_time, counter, building_id, enable) FROM stdin;
dc7fe111-a66d-4d19-942b-33cd9214cd43	Settore TLC-reti	0101000020E6100000010000F8E9C92740A49CFBA52FB44640	15	1000	4	1	t
7e1029c0-87e7-4a21-9635-a91039030ced	DEI/A	0101000020E610000001000090E8C9274063C7921F40B44640	1000	1000	6	1	t
d165cea3-6f90-4174-9ead-cdcbd0787fee	SIGNET	0101000020E6100000000000A0F6C92740A2C31CF456B44640	6	1000	3	1	t
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
7e1029c0-87e7-4a21-9635-a91039030ced	17	2bfa12ed-6de1-4b90-a0c8-d9d33012e576
7e1029c0-87e7-4a21-9635-a91039030ced	18	7aa1dc33-db16-4408-b3af-a16a31803378
7e1029c0-87e7-4a21-9635-a91039030ced	20	eb7201ca-1a9d-4046-bcb8-72b61e9ce434
7e1029c0-87e7-4a21-9635-a91039030ced	125	eb7201ca-1a9d-4046-bcb8-72b61e9ce434
d165cea3-6f90-4174-9ead-cdcbd0787fee	23	fe511d9d-962f-4855-a18e-8e1da4c8dc22
7e1029c0-87e7-4a21-9635-a91039030ced	24	c90695e6-09c5-4172-8d91-30fb8661663e
7e1029c0-87e7-4a21-9635-a91039030ced	25	c05d7229-a98b-4791-aac4-83ccab706881
d165cea3-6f90-4174-9ead-cdcbd0787fee	127	fe511d9d-962f-4855-a18e-8e1da4c8dc22
7e1029c0-87e7-4a21-9635-a91039030ced	27	cafa0d72-fc97-4885-915c-1ee7c219e583
7e1029c0-87e7-4a21-9635-a91039030ced	28	c5452447-3fdc-4783-a80e-e9cc7fbbcd43
7e1029c0-87e7-4a21-9635-a91039030ced	29	7aa1dc33-db16-4408-b3af-a16a31803378
d165cea3-6f90-4174-9ead-cdcbd0787fee	30	c77e652e-46a7-4e84-85c6-ff81b74ccb30
dc7fe111-a66d-4d19-942b-33cd9214cd43	31	5fb67239-4bad-4cbc-9a1e-45c45ae676a8
d165cea3-6f90-4174-9ead-cdcbd0787fee	32	a2e22204-d6a7-47eb-8465-d191fadfcb0c
7e1029c0-87e7-4a21-9635-a91039030ced	33	e08b38d0-c4cd-4a00-b445-e48e90d3280f
dc7fe111-a66d-4d19-942b-33cd9214cd43	34	5af12d4b-b59a-4f0e-8899-5e46fe3d2279
dc7fe111-a66d-4d19-942b-33cd9214cd43	35	c86e9fdc-f36e-437f-9d83-5aa3263a305f
d165cea3-6f90-4174-9ead-cdcbd0787fee	36	011d772a-d2a9-4325-8a14-1017cedb2c63
d165cea3-6f90-4174-9ead-cdcbd0787fee	37	984131b6-4c3e-4860-9369-72c64bf87c3e
7e1029c0-87e7-4a21-9635-a91039030ced	38	7aa1dc33-db16-4408-b3af-a16a31803378
dc7fe111-a66d-4d19-942b-33cd9214cd43	39	60014343-2f4a-4eb6-ab8b-85c94e46641b
dc7fe111-a66d-4d19-942b-33cd9214cd43	40	7ce308eb-7204-45f0-b969-288417bd1fa0
7e1029c0-87e7-4a21-9635-a91039030ced	41	c90695e6-09c5-4172-8d91-30fb8661663e
dc7fe111-a66d-4d19-942b-33cd9214cd43	42	1ca07ccd-8c7e-4649-a1ba-620331e00a08
7e1029c0-87e7-4a21-9635-a91039030ced	128	7aa1dc33-db16-4408-b3af-a16a31803378
dc7fe111-a66d-4d19-942b-33cd9214cd43	44	d9488993-70e7-4b41-9513-2add77d3c22c
dc7fe111-a66d-4d19-942b-33cd9214cd43	45	524bb96d-a0f5-4099-807d-ccb4e94b5740
7e1029c0-87e7-4a21-9635-a91039030ced	129	2bfa12ed-6de1-4b90-a0c8-d9d33012e576
dc7fe111-a66d-4d19-942b-33cd9214cd43	47	f790a53f-4b06-4537-9ee1-d7ece39ceb67
d165cea3-6f90-4174-9ead-cdcbd0787fee	130	984131b6-4c3e-4860-9369-72c64bf87c3e
dc7fe111-a66d-4d19-942b-33cd9214cd43	49	da58c9fd-d488-4abb-8279-e4caf54f5139
d165cea3-6f90-4174-9ead-cdcbd0787fee	131	a2e22204-d6a7-47eb-8465-d191fadfcb0c
dc7fe111-a66d-4d19-942b-33cd9214cd43	51	c0642686-d7ea-4ec7-a0d6-64131e8a9533
7e1029c0-87e7-4a21-9635-a91039030ced	132	7aa1dc33-db16-4408-b3af-a16a31803378
dc7fe111-a66d-4d19-942b-33cd9214cd43	53	954ce32e-25c5-4b61-9b91-90365aefddc6
d165cea3-6f90-4174-9ead-cdcbd0787fee	133	fe511d9d-962f-4855-a18e-8e1da4c8dc22
dc7fe111-a66d-4d19-942b-33cd9214cd43	55	bec18d72-54f1-4324-a3e3-cf46aae63448
d165cea3-6f90-4174-9ead-cdcbd0787fee	134	a2e22204-d6a7-47eb-8465-d191fadfcb0c
dc7fe111-a66d-4d19-942b-33cd9214cd43	57	30b1bb6e-334a-4989-b5db-cc8006ae6c42
d165cea3-6f90-4174-9ead-cdcbd0787fee	135	984131b6-4c3e-4860-9369-72c64bf87c3e
dc7fe111-a66d-4d19-942b-33cd9214cd43	59	6980ea78-db4d-45a2-9de1-6502f6ab97a6
7e1029c0-87e7-4a21-9635-a91039030ced	136	eb7201ca-1a9d-4046-bcb8-72b61e9ce434
dc7fe111-a66d-4d19-942b-33cd9214cd43	138	352f7bf1-72ce-4091-86c5-07d9e2682a98
dc7fe111-a66d-4d19-942b-33cd9214cd43	139	c86e9fdc-f36e-437f-9d83-5aa3263a305f
d165cea3-6f90-4174-9ead-cdcbd0787fee	140	e7af5eef-f11c-42f5-a3e6-41f45a82d799
7e1029c0-87e7-4a21-9635-a91039030ced	141	8d49d716-7db5-4263-a884-5a85c6445782
7e1029c0-87e7-4a21-9635-a91039030ced	142	e08b38d0-c4cd-4a00-b445-e48e90d3280f
d165cea3-6f90-4174-9ead-cdcbd0787fee	143	e7af5eef-f11c-42f5-a3e6-41f45a82d799
d165cea3-6f90-4174-9ead-cdcbd0787fee	145	0d0cb38f-cc83-4b7d-8ac7-ae8cd6740092
7e1029c0-87e7-4a21-9635-a91039030ced	146	7aa1dc33-db16-4408-b3af-a16a31803378
d165cea3-6f90-4174-9ead-cdcbd0787fee	147	fe511d9d-962f-4855-a18e-8e1da4c8dc22
d165cea3-6f90-4174-9ead-cdcbd0787fee	148	0d0cb38f-cc83-4b7d-8ac7-ae8cd6740092
7e1029c0-87e7-4a21-9635-a91039030ced	151	2f3c7ed6-9207-48c8-a1b8-1f818db8e8bc
7e1029c0-87e7-4a21-9635-a91039030ced	153	eb7201ca-1a9d-4046-bcb8-72b61e9ce434
dc7fe111-a66d-4d19-942b-33cd9214cd43	80	60014343-2f4a-4eb6-ab8b-85c94e46641b
7e1029c0-87e7-4a21-9635-a91039030ced	156	7aa1dc33-db16-4408-b3af-a16a31803378
7e1029c0-87e7-4a21-9635-a91039030ced	157	7aa1dc33-db16-4408-b3af-a16a31803378
dc7fe111-a66d-4d19-942b-33cd9214cd43	158	b7957c72-1a3f-4462-8499-180dceba3a76
d165cea3-6f90-4174-9ead-cdcbd0787fee	159	a63e4c51-c5a6-4ab0-8e47-6924a558d009
d165cea3-6f90-4174-9ead-cdcbd0787fee	160	2d3416ae-cd26-44c2-bf1e-0e498a6c033a
d165cea3-6f90-4174-9ead-cdcbd0787fee	161	ed8e4723-2d19-47fd-b0f0-4e1e475f2ac5
7e1029c0-87e7-4a21-9635-a91039030ced	162	f02721b9-31c0-44f0-856e-859667d012ec
7e1029c0-87e7-4a21-9635-a91039030ced	163	6d983093-e77c-45a6-a4f3-d027f3b3c235
7e1029c0-87e7-4a21-9635-a91039030ced	90	4935f849-f3be-4c9e-a551-65e49046c2a8
dc7fe111-a66d-4d19-942b-33cd9214cd43	91	7ce308eb-7204-45f0-b969-288417bd1fa0
dc7fe111-a66d-4d19-942b-33cd9214cd43	92	1ca07ccd-8c7e-4649-a1ba-620331e00a08
7e1029c0-87e7-4a21-9635-a91039030ced	165	5dd74b2f-38d1-42c7-b825-7e9ad93e8454
7e1029c0-87e7-4a21-9635-a91039030ced	170	73352f8f-3911-4585-bf79-d783d32e1d2b
d165cea3-6f90-4174-9ead-cdcbd0787fee	171	a63e4c51-c5a6-4ab0-8e47-6924a558d009
d165cea3-6f90-4174-9ead-cdcbd0787fee	172	ed8e4723-2d19-47fd-b0f0-4e1e475f2ac5
d165cea3-6f90-4174-9ead-cdcbd0787fee	173	2d3416ae-cd26-44c2-bf1e-0e498a6c033a
7e1029c0-87e7-4a21-9635-a91039030ced	174	f02721b9-31c0-44f0-856e-859667d012ec
7e1029c0-87e7-4a21-9635-a91039030ced	176	770647cd-29f6-4cc3-9db6-4b8ffe3bab83
d165cea3-6f90-4174-9ead-cdcbd0787fee	177	ec5e2097-99c0-4296-b72e-d068494a978b
7e1029c0-87e7-4a21-9635-a91039030ced	178	fe76b3e5-200d-4b75-a975-47ba25b6785b
7e1029c0-87e7-4a21-9635-a91039030ced	179	fe76b3e5-200d-4b75-a975-47ba25b6785b
dc7fe111-a66d-4d19-942b-33cd9214cd43	180	fe76b3e5-200d-4b75-a975-47ba25b6785b
7e1029c0-87e7-4a21-9635-a91039030ced	181	7efc2d48-ceb1-46a9-ad71-120da0e0d6eb
7e1029c0-87e7-4a21-9635-a91039030ced	182	31d18ed4-b0b6-4949-a47b-edb84fec811a
d165cea3-6f90-4174-9ead-cdcbd0787fee	183	ec5e2097-99c0-4296-b72e-d068494a978b
dc7fe111-a66d-4d19-942b-33cd9214cd43	184	fe76b3e5-200d-4b75-a975-47ba25b6785b
7e1029c0-87e7-4a21-9635-a91039030ced	185	fe76b3e5-200d-4b75-a975-47ba25b6785b
d165cea3-6f90-4174-9ead-cdcbd0787fee	186	ec5e2097-99c0-4296-b72e-d068494a978b
7e1029c0-87e7-4a21-9635-a91039030ced	187	7efc2d48-ceb1-46a9-ad71-120da0e0d6eb
7e1029c0-87e7-4a21-9635-a91039030ced	188	31d18ed4-b0b6-4949-a47b-edb84fec811a
d165cea3-6f90-4174-9ead-cdcbd0787fee	189	5da6abf8-7f81-4111-9ff0-b452838f2256
dc7fe111-a66d-4d19-942b-33cd9214cd43	190	4eeba1fa-a704-474b-8289-a3f7e5907855
7e1029c0-87e7-4a21-9635-a91039030ced	191	7da7d0a5-98c4-4db4-aec0-6ea26a989d6b
7e1029c0-87e7-4a21-9635-a91039030ced	192	55ab6175-95f7-4f8a-8518-dfa45c6b706e
7e1029c0-87e7-4a21-9635-a91039030ced	193	55ab6175-95f7-4f8a-8518-dfa45c6b706e
dc7fe111-a66d-4d19-942b-33cd9214cd43	194	55ab6175-95f7-4f8a-8518-dfa45c6b706e
7e1029c0-87e7-4a21-9635-a91039030ced	195	1db2c613-330e-40ec-986b-d0baa731d949
7e1029c0-87e7-4a21-9635-a91039030ced	196	1db2c613-330e-40ec-986b-d0baa731d949
dc7fe111-a66d-4d19-942b-33cd9214cd43	197	1db2c613-330e-40ec-986b-d0baa731d949
7e1029c0-87e7-4a21-9635-a91039030ced	198	0a3d3251-5241-4442-8a0e-fb7c436182ba
d165cea3-6f90-4174-9ead-cdcbd0787fee	199	e9aca88e-bd61-4a05-abfc-4de980cb080f
d165cea3-6f90-4174-9ead-cdcbd0787fee	200	8e4e0ed2-4ad4-4a6d-9b74-d4c613b99fa7
7e1029c0-87e7-4a21-9635-a91039030ced	201	c6f6d152-34c7-4c06-be9c-db64b0df16bf
dc7fe111-a66d-4d19-942b-33cd9214cd43	202	ef026036-6a4b-4cee-bb91-130cc7692093
d165cea3-6f90-4174-9ead-cdcbd0787fee	203	4379cfa2-0578-4ba7-8017-26f45420dbf2
7e1029c0-87e7-4a21-9635-a91039030ced	204	8959b830-2a41-4611-a1e7-0c3daa3778af
d165cea3-6f90-4174-9ead-cdcbd0787fee	205	4379cfa2-0578-4ba7-8017-26f45420dbf2
d165cea3-6f90-4174-9ead-cdcbd0787fee	206	8e4e0ed2-4ad4-4a6d-9b74-d4c613b99fa7
dc7fe111-a66d-4d19-942b-33cd9214cd43	207	55ab6175-95f7-4f8a-8518-dfa45c6b706e
d165cea3-6f90-4174-9ead-cdcbd0787fee	208	5da6abf8-7f81-4111-9ff0-b452838f2256
dc7fe111-a66d-4d19-942b-33cd9214cd43	209	4eeba1fa-a704-474b-8289-a3f7e5907855
7e1029c0-87e7-4a21-9635-a91039030ced	210	4eeba1fa-a704-474b-8289-a3f7e5907855
7e1029c0-87e7-4a21-9635-a91039030ced	211	4eeba1fa-a704-474b-8289-a3f7e5907855
7e1029c0-87e7-4a21-9635-a91039030ced	212	0a3d3251-5241-4442-8a0e-fb7c436182ba
7e1029c0-87e7-4a21-9635-a91039030ced	213	865d461f-71b9-416c-9598-154a79964f1a
7e1029c0-87e7-4a21-9635-a91039030ced	214	865d461f-71b9-416c-9598-154a79964f1a
7e1029c0-87e7-4a21-9635-a91039030ced	215	865d461f-71b9-416c-9598-154a79964f1a
7e1029c0-87e7-4a21-9635-a91039030ced	216	865d461f-71b9-416c-9598-154a79964f1a
7e1029c0-87e7-4a21-9635-a91039030ced	217	865d461f-71b9-416c-9598-154a79964f1a
7e1029c0-87e7-4a21-9635-a91039030ced	218	0a3d3251-5241-4442-8a0e-fb7c436182ba
7e1029c0-87e7-4a21-9635-a91039030ced	219	55ab6175-95f7-4f8a-8518-dfa45c6b706e
7e1029c0-87e7-4a21-9635-a91039030ced	220	55ab6175-95f7-4f8a-8518-dfa45c6b706e
dc7fe111-a66d-4d19-942b-33cd9214cd43	221	55ab6175-95f7-4f8a-8518-dfa45c6b706e
dc7fe111-a66d-4d19-942b-33cd9214cd43	222	55ab6175-95f7-4f8a-8518-dfa45c6b706e
dc7fe111-a66d-4d19-942b-33cd9214cd43	223	55ab6175-95f7-4f8a-8518-dfa45c6b706e
dc7fe111-a66d-4d19-942b-33cd9214cd43	224	ef026036-6a4b-4cee-bb91-130cc7692093
d165cea3-6f90-4174-9ead-cdcbd0787fee	225	e9aca88e-bd61-4a05-abfc-4de980cb080f
d165cea3-6f90-4174-9ead-cdcbd0787fee	226	8e4e0ed2-4ad4-4a6d-9b74-d4c613b99fa7
d165cea3-6f90-4174-9ead-cdcbd0787fee	227	4379cfa2-0578-4ba7-8017-26f45420dbf2
d165cea3-6f90-4174-9ead-cdcbd0787fee	228	e08469c9-df41-4227-bcfd-2890f38126f0
dc7fe111-a66d-4d19-942b-33cd9214cd43	229	ef026036-6a4b-4cee-bb91-130cc7692093
dc7fe111-a66d-4d19-942b-33cd9214cd43	230	92b2de07-f20e-42d2-98ec-fad0437607bc
7e1029c0-87e7-4a21-9635-a91039030ced	231	b57c92a2-4692-4223-b584-c78119be98e7
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

SELECT pg_catalog.setval('public.feedback_id_seq', 22, true);


--
-- Name: log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nobis
--

SELECT pg_catalog.setval('public.log_id_seq', 231, true);


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

