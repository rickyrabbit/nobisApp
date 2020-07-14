let map;
let lat;
let lon;

$( document ).ready(function() {

	lat = 45.4090842;
	lon = 11.8946683;

	map = L.map('place-modal-map').setView([lat, lon], 15);

	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYXZhOGMiLCJhIjoiY2s5MXJ3eDNkMDBwMzNmb3lod3EzbTYzYiJ9.ZztuSpL_L1iy10DaeODVhQ', {
	    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	    maxZoom: 18,
	    id: 'mapbox/streets-v11',
	    tileSize: 512,
	    zoomOffset: -1,
	}).addTo(map);

	map.on('click', onMapClick);

	userPosMarker = L.marker([lat, lon]).addTo(map);

	// Fix
	$('#edit-place').on('show.bs.modal', function(){
	  setTimeout(function() {
	    map.invalidateSize();
	  }, 400);
	});

	$("button").click(function(e) {
		
	})

});

function onMapClick(e) {
	lat = e.latlng.lat;
	lon = e.latlng.lng;
	$("#place-latitude").val(lat);
	$("#place-longitude").val(lon);
	if (userPosMarker != undefined) {
		map.removeLayer(userPosMarker);
	}
	userPosMarker = L.marker([lat, lon]);
	map.addLayer(userPosMarker);
}