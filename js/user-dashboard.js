let jsondataURI = './js/fakejsonmapdata.json';

let occupancyThreshold = {
    "medium": 40,
    "high": 80
}

async function clearResults() {
    // empty current list
    $("#groupSearchResults").empty();
    // remove markers from map
    removeCurrentMapMarkers();

}

async function inSurroundings(resultsjson) {
    // read JSON of results
    let response = await fetch(resultsjson);
    let objs = await response.json();
    let places = objs.places;
    let buildings = objs.buildings;

    let mcb = mapCurrentBounds();

    let filteredPlaces = [];
    let filteredBuildings = [];
    // leave places that are in the current view
    for (const key in places) {
        let pl = places[key];
        let plcoor = L.latLng(pl.geometry);
        if (isPointInBounds(plcoor, mcb)) {
            filteredPlaces.push(pl);
        }
    }

    //console.log(`markerLayers: ${markerLayer.getLayers()}`);

    // leave buildings that are in the current view
    for (const key in buildings) {
        let bl = buildings[key];
        let blcoor = L.latLng(bl.geometry);
        if (isPointInBounds(blcoor, mcb)) {
            filteredBuildings.push(bl);
        }
    }

    // populate list
    for (const key in filteredPlaces) {
        let pl = filteredPlaces[key];
        let pb = findPlaceBuilding(buildings, pl.building);
        addToList(pl, key, pb);
    }

    // setOnclick for result items
    $(".result-item").on("click", function (event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        // get item id
        let rid = this.id;
        //console.log(this);
        // get index result from result set
        let n_item = parseInt(rid.substr(9));
        console.log(`index n:${n_item}`);
        // remove active class from everyone
        // add class active to that item
        $(".active").removeClass("active");
        $(this).addClass("active");
        // fly to location in the map
        zoomOnPlace(jsondataURI, filteredPlaces[n_item].placeuuid);

    });


    // show markers on map
    filteredPlaces.forEach(element => {
        // finds the building of the current place
        let placeBuilding = buildings.find(be => {
            return be.id == element.building;
        });

        // Add the place coordinates to the array of bounds
        setBoundCoord.add(element.geometry);

        let marker = L.marker(element.geometry);
        currentMapMarkers.add(marker);
        marker.addTo(map).bindPopup(`<strong>${element.name}</strong> of: ${placeBuilding.name}`);
        //markerLayer.addLayer(marker).addTo(map);

    });

    showSurroundingsResulsInfo(filteredPlaces.length);


    //markerLayer.addTo(map);
    /* console.log(`markerLayers: ${markerLayer.getLayers()}`);
    markerLayer.addTo(map);
    console.log(`markerLayers: ${markerLayer.getLayers()}`); */

}

function matchPlace(searchedPlace, placeName){
    let rgx = RegExp(`^.*${searchedPlace}.*$`);
    return rgx.test(placeName);
}


async function searchByInput(resultsjson, searchstring) {
    // read JSON of results
    let response = await fetch(resultsjson);
    let objs = await response.json();
    let places = objs.places;
    let buildings = objs.buildings;

    console.log(`searched: ${searchstring}`);
    let scandidate = searchstring.trim();
    const regex = /^([A-Za-z]+)([ ]*[A-Za-z]*)*$/gm;

    if (scandidate.match(regex) === null) {
        console.log(`not validated`);
        return;
    }
    console.log(`validated`);

    let filteredPlaces = [];

    for (const key in places) {
        //console.log(`filtering places n:${key}`);
        let pl = places[key];
        if (matchPlace(scandidate, pl.name)) {
            console.log(`place n:${key} is accepted`);
            filteredPlaces.push(pl);
        }
    }

    for (const id in filteredPlaces) {
        let pl = filteredPlaces[id];
        console.log(`filtering places n:${id}`);
        let pb = findPlaceBuilding(buildings, pl.building);
        addToList(pl, id, pb);
    }

    // setOnclick for result items
    $(".result-item").on("click", function (event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        // get item id
        let rid = this.id;
        //console.log(this);
        // get index result from result set
        let n_item = parseInt(rid.substr(9));
        console.log(`index n:${n_item}`);
        // remove active class from everyone
        // add class active to that item
        $(".active").removeClass("active");
        $(this).addClass("active");
        // fly to location in the map
        zoomOnPlace(jsondataURI, filteredPlaces[n_item].placeuuid);

    });


    // show markers on map
    filteredPlaces.forEach(element => {
        // finds the building of the current place
        let placeBuilding = buildings.find(be => {
            return be.id == element.building;
        });

        // Add the place coordinates to the array of bounds
        setBoundCoord.add(element.geometry);

        let marker = L.marker(element.geometry);
        currentMapMarkers.add(marker);
        marker.addTo(map).bindPopup(`<strong>${element.name}</strong> of: ${placeBuilding.name}`);
        //markerLayer.addLayer(marker).addTo(map);

    });

    showSearchResulsInfo(scandidate,filteredPlaces.length);


}

/* async function tryFly() {

    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    // Zoom on Aula Be
    zoomOnPlace(jsondataURI, "6ecf2f89-4036-403d-bf84-cf8410a67836");

    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    // Zoom on Aula Ve
    zoomOnPlace(jsondataURI, "6ecf8f89-4036-403d-bf84-cf8410a67836");


    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    // Zoom on DEI
    zoomOnBuilding(jsondataURI, 1);
} */




function findPlaceBuilding(buildingsArray, placeObjBuilding) {
    // finds the building of the current place
    let placeBuilding = buildingsArray.find(be => {
        return be.id == placeObjBuilding;
    });

    if (placeBuilding !== undefined) {
        return placeBuilding;
    } else {
        return "";
    }
}

function computePlaceSituation(placeObj) {

    let occPercentage = (placeObj.counter / placeObj.capacity) * 100;
    if (occPercentage <= occupancyThreshold.medium) {
        return 0;
    }
    if (occPercentage <= occupancyThreshold.high) {
        return 1;
    }
    if (occPercentage > occupancyThreshold.high) {
        return 2;
    }
}


function addToList(placeObj, listitemid, placeBuildingObj) {


    /*
    <a href="#" class="list-group-item list-group-item-action flex-column align-items-start active">
        <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Place name</h5>
            <small>Place Building</small>
        </div>
        <div class="capacityinfo">
            <span class="badge badge-pill badge-success">Low Traffic</span>
            <span class="badge badge-pill badge-warning">Medium Traffic</span>
            <span class="badge badge-pill badge-danger">High Traffic</span>
        </div>
        <p class="mb-1">Donec id elit non mi porta gravida at eget metus. Maecenas sed diam eget risus varius blandit.</p>
        <small>Donec id elit non mi porta.</small>
    </a>
    */
    //console.log(`placeObj che arriva: ${placeObj}`);
    // list i-th item element

    let li = $("<a></a>", {
        "class": "list-group-item list-group-item-action flex-column align-items-start result-item",
        href: "#",
        id: `listitem-${listitemid}`
    });


    let lip = $("<div></div>", {
        "class": "d-flex w-100 justify-content-between",
        id: `listitem-${listitemid}-place`
    });

    $("<h3></h3>", {
        "class": "mb-1",
        text: `${placeObj.name}`
    }
    ).appendTo(lip);

    //let pb = await findPlaceBuilding(jsondataURI, placeObj.building);

    let bname_cont = $("<span></span>", {
        "class": "building-name"
    });

    let bname = $("<div></div>", {
        "class": "badge badge-light badge-custom",
        text: `${placeBuildingObj.name}`
    });

    bname.appendTo(bname_cont);
    bname_cont.appendTo(lip);


    let lic = $("<div></div>", {
        "class": "capacityinfo",
        id: `listitem-${listitemid}-capacityinfo`
    });



    let badge = {
        "text": "",
        //"class": "badge badge-pill "
        "class": "badge "
    }

    let sit = computePlaceSituation(placeObj);
    //console.log(`sit vale ${sit}`);

    if (sit === 0) {
        badge.class = badge.class + "badge-success";
        badge.text = "Bassa Occupazione";
    }
    if (sit === 1) {
        badge.class = badge.class + "badge-warning";
        badge.text = "Media Occupazione";
    }
    if (sit === 2) {
        badge.class = badge.class + "badge-danger";
        badge.text = "Alta Occupazione";
    }

    $("<span></span>", {
        "class": badge.class,
        id: `listitem-${listitemid}-capacitypill`,
        text: badge.text
    }).appendTo(lic);

    lip.appendTo(li);
    lic.appendTo(li);



    $("<p></p>", {
        "class": "mb-1",
        text: `${placeObj.description}`
    }
    ).appendTo(li);

    $("<small></small>", {
        text: `prova prova prova prova`
    }
    ).appendTo(li);


    /* li.append("p").addClass("mb-1").html(`${placeObj.description}`);
    li.append("small").html(`prova prova prova prova`); */



    li.appendTo("#groupSearchResults");


}

function showSearchResulsInfo(stringSearched,numResults){
    let t = `You searched <strong>${stringSearched}</strong>: `;
    $("#search-alert").hide();
    $("#search-alert").removeClass();
    $("#search-alert").addClass("alert");
    if(numResults!==0){
        t = `<strong>${numResults}</strong> results found`;
        $("#search-alert").addClass("alert-success");

    }else{
        t = t + `and nothing was found`;
        $("#search-alert").addClass("alert-danger");
    }
    $("#search-alert").html(t);
    $("#search-alert").show();
    return t;
}

function showSurroundingsResulsInfo(numResults){
    let t = ``;
    $("#search-alert").hide();
    $("#search-alert").removeClass();
    $("#search-alert").addClass("alert");
    if(numResults!==0){
        t = `<strong>${numResults}</strong> results found`;
        $("#search-alert").addClass("alert-success");

    }else{
        t = t + `Nothing found here`;
        $("#search-alert").addClass("alert-danger");
    }
    $("#search-alert").html(t);
    $("#search-alert").show();
    return t;
}




$(document).ready(function() {
    $("#search-alert").hide();

    $("#search-btn").on("click", function (e) {
        e.preventDefault();
        clearResults();
        let userinput = $("#searchbar-input").val();
        searchByInput(jsondataURI, userinput);
    
    });
    
    $("#searchsurr-btn").on("click", function (e) {
        e.preventDefault();
        clearResults();
        inSurroundings(jsondataURI);
    
    });
  });

// DEMO

// Add element to the list
//searchByInput(jsondataURI, "Ke");


// Shows the results of the search on the map
//showMarkersOnMap(jsondataURI);

// Try the flying animation
//tryFly();