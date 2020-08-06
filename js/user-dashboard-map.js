let mapProperties = {
    "latitude": 45.408,
    "longitude": 11.894,
    "zooming": 16,
    "placeZooming": 18
}


let map = L.map('interactive_map').setView([mapProperties.latitude, mapProperties.longitude], mapProperties.zooming);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let initialMarker = L.marker([mapProperties.latitude, mapProperties.longitude]);
initialMarker.addTo(map).bindPopup('DEI caput mundi.');
//markerLayer.addLayer(initialMarker);

let currentMapMarkers = new Set();
let setBoundCoord = new Set();

function mapCurrentBounds() {
    return map.getBounds();
}

let isPointInBounds = (LatLngPoint, LatLngBounds) => {
    return LatLngBounds.contains(LatLngPoint);
}

function removeCurrentMapMarkers() {
    [...currentMapMarkers].forEach(element => {
        element.removeFrom(map);
    });
    currentMapMarkers.clear();

    console.log(`bau`);
    return;
}

async function showMarkersOnMap(resultsjson) {
    // read JSON of results
    let response = await fetch(resultsjson);
    let objs = await response.json();
    let places = objs.places;
    let buildings = objs.buildings;


    places.forEach(place => {
        // finds the building of the current place
        let placeBuilding = buildings.find(be => {
            return be.id == place.building;
        });

        // Add the place coordinates to the array of bounds
        setBoundCoord.add(place.geometry);

        // Add the place marker to the map
        let marker = L.marker(place.geometry);
        currentMapMarkers.add(marker);
        marker.addTo(map).bindPopup(`<strong>${place.name}</strong> of: ${placeBuilding.name}`);

    });

    buildings.forEach(building => {
        // Add the place coordinates to the array of bounds
        setBoundCoord.add(building.geometry);

        // Add the building marker to the map
        let marker = L.marker(building.geometry);
        currentMapMarkers.add(marker);
        marker.addTo(map).bindPopup(`${building.name}`);


    });

    // Show the map with all the results in it
    map.flyToBounds([...setBoundCoord]);


}



async function zoomOnPlace(resultsjson, placeuuid) {
    // read JSON of results
    let response = await fetch(resultsjson);
    let objs = await response.json();
    let places = objs.places;

    let found = places.find(pl => {
        return pl.placeuuid == placeuuid;
    });

    console.log(`placefound? ${found}`);

    if (found !== undefined) {
        map.flyTo(found.geometry, mapProperties.placeZooming);
    }


}

async function zoomOnBuilding(resultsjson, buildingid) {
    // read JSON of results
    let response = await fetch(resultsjson);
    let objs = await response.json();
    let buildings = objs.buildings;


    let found = buildings.find(bl => {
        return bl.id == buildingid;
    });

    if (found === undefined) return;

    let places = objs.places;

    let placesOfBuilding = places.filter((p) => {
        return p.building == buildingid;
    });

    if (placesOfBuilding.length === 0) return;

    let setBound = new Set();
    placesOfBuilding.forEach((p) => {
        setBound.add(p.geometry);
    });

    map.flyToBounds([...setBound]);

}
