-- PROCEDURE: public.handlecheckin(uuid, uuid)

-- DROP PROCEDURE public.handlecheckin(uuid, uuid);

CREATE OR REPLACE PROCEDURE public.handlecheckin(
	_personuuid uuid,
	_placeuuid uuid)
LANGUAGE 'plpgsql'
AS $BODY$
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
$BODY$;


-- PROCEDURE: public.handlecheckout(uuid, uuid)

-- DROP PROCEDURE public.handlecheckout(uuid, uuid);

CREATE OR REPLACE PROCEDURE public.handlecheckout(
	_personuuid uuid,
	_placeuuid uuid)
LANGUAGE 'plpgsql'
AS $BODY$
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
$BODY$;