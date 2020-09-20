let mapProperties = {
    "latitude": 45.408,
    "longitude": 11.894,
    "zooming": 16,
    "placeZooming": 18
}


let map = L.map('interactive_map').setView([mapProperties.latitude, mapProperties.longitude], mapProperties.zooming);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

//let initialMarker = L.marker([mapProperties.latitude, mapProperties.longitude]);
// Sorry Buddy production calls
//initialMarker.addTo(map).bindPopup('DEI caput mundi.');
//markerLayer.addLayer(initialMarker);


map.on("moveend", function () {
    if (map.getZoom() > 15) {
        inSurroundings();
        $("#searchsurr-btn").fadeOut(500);
    } else {
        $("#searchsurr-btn").fadeIn(500);
    }
});


let currentMapMarkers = new Set();
let setBoundCoord = new Set();

function mapCurrentBounds() {
    return map.getBounds();
}

let isPointInBounds = (LatLngPoint, LatLngBounds) => {
    return LatLngBounds.contains(LatLngPoint);
}

const toGeoCoordArray = (geoCoordString) => {
    const searchTerm = ' ';
    const indexOfFirst = geoCoordString.indexOf(searchTerm);

    const x = geoCoordString.slice(6, indexOfFirst);
    const y = geoCoordString.slice(indexOfFirst + 1, -1);

    return [y, x];
}

function removeCurrentMapMarkers() {
    [...currentMapMarkers].forEach(element => {
        element.removeFrom(map);
    });
    currentMapMarkers.clear();

    return;
}


async function showMarkersOnMap(placesJSONArray) {
    let places = placesJSONArray;

    places.forEach(place => {

        place.geocoord = toGeoCoordArray(place.geocoord);
        // Add the place coordinates to the array of bounds
        setBoundCoord.add(place.geocoord);

        // Add the place marker to the map
        let marker = L.marker(place.geocoord);
        currentMapMarkers.add(marker);
        marker.addTo(map).bindPopup(`<strong>${place.pname}</strong> (${place.buildingname})`);

    });

    // Show the map with all the results in it
    map.flyToBounds([...setBoundCoord]);
}



async function zoomOnPlace(placesJSONArray, placeuuid) {
    // read JSON of results
    let places = placesJSONArray;

    let found = places.find(place => {
        return place.puuid == placeuuid;
    });

    //console.log(`placefound? ${found}`);

    if (found !== undefined) {
        map.flyTo(found.geocoord, mapProperties.placeZooming);
    }


}
