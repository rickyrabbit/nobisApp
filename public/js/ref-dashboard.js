let map;
let lat;
let lon;

$(document).ready(function () {

	$('.toast').toast({
		delay: 2000
	})

	$('.toggle-auth').change(function () {
		$("#successToast").toast("hide");
		let uuid = $(this).closest('tr').attr("place-uuid");
		let action;
		if ($(this).is(':checked') == false) {
			$("#successToast .toast-body span").text("disabilitato");
			action = "disable";
		} else {
			$("#successToast .toast-body span").text("abilitato");
			action = "enable";
		}

		$.ajax({
			url: `/place/${uuid}/${action}`,
			method: "POST",
			statusCode: {
				200: function() {
					$("#successToast").toast("show");
				}
			  }
		});
		setTimeout(function () {
			$("#successToast").hide();
		}, 2000);
	})

	lat = 45.4090842;
	lon = 11.8946683;

	map = L.map('place-modal-map').setView([lat, lon], 15);
	mapCreate = L.map('place-modal-map-create').setView([lat, lon], 15);

	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYXZhOGMiLCJhIjoiY2s5MXJ3eDNkMDBwMzNmb3lod3EzbTYzYiJ9.ZztuSpL_L1iy10DaeODVhQ', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1,
	}).addTo(map);

	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYXZhOGMiLCJhIjoiY2s5MXJ3eDNkMDBwMzNmb3lod3EzbTYzYiJ9.ZztuSpL_L1iy10DaeODVhQ', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1,
	}).addTo(mapCreate);

	map.on('click', onMapClick);

	mapCreate.on('click', onMapCreateClick);

	userPosMarker = L.marker([lat, lon]).addTo(map);

	userPosMarkerCreate = L.marker([lat, lon]).addTo(mapCreate);

	// Fix for Leaflet inside Bootstrap Modal
	$('#edit-place').on('show.bs.modal', function () {
		setTimeout(function () {
			map.invalidateSize();
		}, 400);
	});

	// Open Delete Building modal
	$(".openDeleteBuildingModal").click(function () {
		let buildingId = $(this).attr("data-building-id");
		// Copy building id to modal
		$('#deleteBuildingModal').attr("data-building-id", buildingId);
		$('#deleteBuildingModal').modal('show');

	});

	$("#openCreatePlaceModal").click(function () {
		$('#create-place').modal('show');
	})

	$("#create-place-button").click(function() {
		let placeName = $("#place-name-create").val();
		let placeBuilding = $("#place-building-create option:selected").attr('building-id');
		let placeLatitude = $("#place-latitude-create").val();
		let placeLongitude = $("#place-longitude-create").val();
		let placeCapacity = $("#place-capacity-create").val();
		let placeVisitTime = $("#place-visit-time-create").val();
		let placeCategory = $("#place-category-create option:selected").attr('category-id');
		$.ajax({
			url: `/place/create`,
			method: "POST",
			data:{
				placeName: placeName,
				placeBuilding: placeBuilding,
				placeLatitude: placeLatitude,
				placeLongitude: placeLongitude,
				placeCapacity: placeCapacity,
				placeVisitTime: placeVisitTime,
				placeCategory: placeCategory
			},
			statusCode: {
				200: function() {
					$('#create-place').modal('hide');
				}
			  }
		});
	})

	$(".deleteBuilding").click(function () {
		$('#deleteBuildingModal').modal('hide');

		let buildingIdToDelete = $('#deleteBuildingModal').attr("data-building-id")
		console.log(buildingIdToDelete);
		// Add Building Delete
		$('#deleteBuildingModal').modal('hide');
	})

	$(".openResolveProblemModal").click(function () {
		$('#resolveProblemModal').modal('show');
		//take id from table row and put it inside modal
	})

	$("#resolveProblem").click(function () {
		//take id from modal and resolve
		$('#deleteBuildingModal').modal('hide');
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

function onMapCreateClick(e) {
	lat = e.latlng.lat;
	lon = e.latlng.lng;
	$("#place-latitude-create").val(lat);
	$("#place-longitude-create").val(lon);
	if (userPosMarkerCreate != undefined) {
		mapCreate.removeLayer(userPosMarkerCreate);
	}
	userPosMarkerCreate = L.marker([lat, lon]);
	mapCreate.addLayer(userPosMarkerCreate);
}