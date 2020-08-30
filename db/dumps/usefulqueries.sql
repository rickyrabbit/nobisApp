-- verificare ordine checkin e checkout

select place.name AS posto,visit.person_uuid AS persona,log.is_in AS èdentroStanza,
--assumption AS dedotto,
timestamp AS istante from visit
left join log 
on log.id = visit.log_id
left join place
on place.uuid = visit.place_uuid
group by posto,persona,istante,èdentroStanza
--,dedotto
--where assumption = false

order by timestamp desc;
