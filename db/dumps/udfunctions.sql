/*
-- DOPO MODIFICA DELLA TABELLA LOG CON NUOVO ATTRIBUTO assumption SI RUNNA

update public.log
set assumption = false
where assumption ISNULL;

*/
CREATE FUNCTION public.findplacesinbox(IN xmin numeric, IN ymin numeric, IN xmax numeric, IN ymax numeric) RETURNS TABLE(puuid uuid, pname text,buildingname text, category text,geocoord text,occ decimal, highFeedback bigint, mediumFeedback bigint, lowFeedback bigint) AS $$

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

$$ LANGUAGE SQL VOLATILE; -- END FUNCTION


CREATE FUNCTION public.getfeedbackbyplace(IN placeuuid uuid, IN rating numeric) RETURNS TABLE(feedback bigint) AS $$

SELECT COUNT(*) FROM visit
LEFT JOIN log
ON log.id = visit.log_id
LEFT JOIN feedback
ON feedback.log_id = log.id
WHERE place_uuid = placeuuid AND log.timestamp >= NOW() - interval '2 hours' AND feedback.rating = feedback;

$$ LANGUAGE SQL VOLATILE; -- END FUNCTION


CREATE FUNCTION public.findPersonlastDetection(IN person_uuid_q uuid) RETURNS TABLE(place_uuid uuid,
                                                                                    timelog TIMESTAMP,
                                                                                            checkin BOOLEAN) AS $$

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

	$$ LANGUAGE SQL; -- END FUNCTION

-- FUNCTION: public.findplacesfrompattern(text)
 -- DROP FUNCTION public.findplacesfrompattern(text);

CREATE OR REPLACE FUNCTION public.findplacesfrompattern(_searchpattern text) RETURNS TABLE(puuid uuid, pname text, buildingname text, category text, geocoord text, occ numeric) LANGUAGE 'sql' COST 100 VOLATILE ROWS 1000 AS $BODY$
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
$BODY$;


ALTER FUNCTION public.findplacesfrompattern(text) OWNER TO nobis;


-- FUNCTION: public.checkinf(uuid, uuid, boolean)

-- DROP FUNCTION public.checkinf(uuid, uuid, boolean);

CREATE OR REPLACE FUNCTION public.checkinf(
	_personuuid uuid,
	_placeuuid uuid,
	_assumption boolean)
    RETURNS void
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
    
AS $BODY$
DECLARE newlogid integer;
BEGIN
UPDATE public.place SET counter = counter+1 WHERE uuid = _placeuuid;
INSERT INTO log (is_in, timestamp, assumption) VALUES (true, NOW()::timestamp,_assumption) RETURNING log.id INTO newlogid;
INSERT INTO visit (place_uuid, log_id, person_uuid) VALUES (_placeuuid, newlogid, _personuuid);
END;
$BODY$;

ALTER FUNCTION public.checkinf(uuid, uuid, boolean)
    OWNER TO nobis;


-- FUNCTION: public.checkoutf(uuid, uuid, boolean)

-- DROP FUNCTION public.checkoutf(uuid, uuid, boolean);

CREATE OR REPLACE FUNCTION public.checkoutf(
	_personuuid uuid,
	_placeuuid uuid,
	_assumption boolean)
    RETURNS void
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
    
AS $BODY$
DECLARE newlogid integer;
BEGIN
UPDATE public.place SET counter = counter-1 WHERE uuid = _placeuuid;
INSERT INTO log (is_in, timestamp, assumption) VALUES (false, NOW()::timestamp,_assumption) RETURNING log.id INTO newlogid;
INSERT INTO visit (place_uuid, log_id, person_uuid) VALUES (_placeuuid, newlogid, _personuuid);
END;
$BODY$;

ALTER FUNCTION public.checkoutf(uuid, uuid, boolean)
    OWNER TO nobis;




/*
SELECT place.uuid AS uuid,place.name,building.name AS building,category.name AS category,st_asgeojson(place.geometry, 9, 0) AS geocoord , TRUNC((place.counter::decimal(3) / place.capacity),2) AS occ FROM place
LEFT JOIN building
ON place.building_id = building.id
LEFT JOIN have
ON place.uuid = have.place_uuid
LEFT JOIN category
ON have.category_id = category.id
WHERE st_intersects(st_makeenvelope(11.785583,45.361795,12.001190,45.493834,4326), place.geometry)
ORDER BY occ DESC;

SELECT place.uuid AS uuid,place.name,building.name AS building,category.id AS category,place.capacity AS capacity,place.visit_time,place.counter, st_asgeojson(place.geometry, 9, 0) AS geocoord , (place.counter::decimal / place.capacity) AS occ FROM place
LEFT JOIN building
ON place.building_id = building.id
LEFT JOIN have
ON place.uuid = have.place_uuid
LEFT JOIN category
ON have.category_id = category.id
--WHERE st_intersects(st_makeenvelope(xmin,ymin,xmax,ymax,4326), place.geometry)
WHERE st_intersects(st_makeenvelope(11.785583,45.361795,12.001190,45.493834,4326), place.geometry)
--WHERE st_asgeojson(place.geometry, 9, 0);
ORDER BY occ DESC;
*/