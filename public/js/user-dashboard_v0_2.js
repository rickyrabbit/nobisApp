
let occupancyThreshold = {
    "medium": 0.40,
    "high": 0.80
}

let lastPlaces = [];

async function clearResults() {
    // empty current list
    $("#groupSearchResults").empty();
    // remove markers from map
    removeCurrentMapMarkers();

}

async function inSurroundings() {

    let mcb = mapCurrentBounds();
    
    const par = {
        coorXmin: mcb._southWest.lng,
        coorYmin: mcb._southWest.lat,
        coorXmax: mcb._northEast.lng,
        coorYmax: mcb._northEast.lat,
    };

    //console.log(par);
    const url = `mapInfo/findPlacesinMap?coorXmin=${par.coorXmin}&coorYmin=${par.coorYmin}&coorXmax=${par.coorXmax}&coorYmax=${par.coorYmax}`;
    
    let response = await fetch(url);
    let places = await response.json();

    if(!checkNewPlaces(places)){
        return;
    }

    clearResults();

    // populate list
    for (const key in places) {
        let place = places[key];
        place.geocoord = toGeoCoordArray(place.geocoord);
        // Add the place coordinates to the array of bounds
        setBoundCoord.add(place.geocoord);

        let marker = L.marker(place.geocoord);
        currentMapMarkers.add(marker);
        marker.addTo(map).bindPopup(`<strong>${place.pname}</strong> of: ${place.buildingname}`);
        addToList(place, key);
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
        //console.log(`index n:${n_item}`);
        // remove active class from everyone
        // add class active to that item
        $(".active").removeClass("active");
        $(this).addClass("active");
        // fly to location in the map
        zoomOnPlace(places, places[n_item].puuid);

    });
    showSurroundingsResulsInfo(places.length);

}

function checkNewPlaces(places) {
    let newPlace = false;
    places.forEach(function(place) {
        if(!lastPlaces.includes(place.puuid)){
            newPlace = true;
        }
    })

    if(places.length != lastPlaces.length){
        newPlace = true;
    }

    if(!newPlace)
        return false;
    else {
        lastPlaces = [];
        places.forEach(function(place) {
            lastPlaces.push(place.puuid);
        })
        return true;
    }
}


async function searchByInput(searchstring) {
    
    let response = await fetch(`mapInfo/searchPlaces?searchInput=${searchstring}`);
    //let response = await fetch(url);
    let places = await response.json();


    // populate list
    for (const key in places) {
        let place = places[key];
        place.geocoord = toGeoCoordArray(place.geocoord);
        // Add the place coordinates to the array of bounds
        setBoundCoord.add(place.geocoord);

        let marker = L.marker(place.geocoord);
        currentMapMarkers.add(marker);
        marker.addTo(map).bindPopup(`<strong>${place.pname}</strong> of: ${place.buildingname}`);
        addToList(place, key);
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
        //console.log(`index n:${n_item}`);
        // remove active class from everyone
        // add class active to that item
        $(".active").removeClass("active");
        $(this).addClass("active");
        // fly to location in the map
        zoomOnPlace(places, places[n_item].puuid);

    });
    showSearchResulsInfo(searchstring, places.length);
}


function computePlaceSituation(placeOccupation) {
    if (placeOccupation <= occupancyThreshold.medium) {
        return 0;
    }
    if (placeOccupation <= occupancyThreshold.high) {
        return 1;
    }
    if (placeOccupation > occupancyThreshold.high) {
        return 2;
    }
}


function addToList(placeObj, listitemid) {


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
        text: `${placeObj.pname}`
    }
    ).appendTo(lip);

    let bname_cont = $("<span></span>", {
        "class": "building-name"
    });

    let bname = $("<div></div>", {
        "class": "badge badge-light badge-custom",
        text: `${placeObj.buildingname}`
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

    let sit = computePlaceSituation(placeObj.occ);
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
        text: `${placeObj.category}`
    }
    ).appendTo(li);

    $("<small></small>", {
        html: computeMaxFeedback(placeObj)
    }
    ).appendTo(li);


    /* li.append("p").addClass("mb-1").html(`${placeObj.description}`);
    li.append("small").html(`prova prova prova prova`); */



    li.appendTo("#groupSearchResults");


}

function computeMaxFeedback(placeObj){
    let low = placeObj.lowfeedback;
    let medium = placeObj.mediumfeedback;
    let high = placeObj.highfeedback;
    if(high > low && high > medium) {
        return `<strong>${high}</strong> persone hanno segnalato questo luogo come <strong>alta occupazione</strong>`;
    } else if (medium > low) {
        return `<strong>${medium}</strong> persone hanno segnalato questo luogo come <strong>media occupazione</strong>`;
    } else if (medium < low) {
        return `<strong>${low}</strong> persone hanno segnalato questo luogo come <strong>bassa occupazione</strong>`;
    } else {
        return "";
    }
}

function showSearchResulsInfo(stringSearched, numResults) {
    let t = `You searched <strong>${stringSearched}</strong>: `;
    $("#search-alert").hide();
    $("#search-alert").removeClass();
    $("#search-alert").addClass("alert");
    if (numResults !== 0) {
        t = `<strong>${numResults}</strong> Risultati`;
        $("#search-alert").addClass("alert-success");

    } else {
        t = t + `and nothing was found`;
        $("#search-alert").addClass("alert-danger");
    }
    $("#search-alert").html(t);
    $("#search-alert").show();
    return t;
}

function showSurroundingsResulsInfo(numResults) {
    let t = ``;
    $("#search-alert").hide();
    $("#search-alert").removeClass();
    $("#search-alert").addClass("alert");
    if (numResults !== 0) {
        t = `<strong>${numResults}</strong> Risultati`;
        $("#search-alert").addClass("alert-success");

    } else {
        t = t + `Nessun Risultato`;
        $("#search-alert").addClass("alert-danger");
    }
    $("#search-alert").html(t);
    $("#search-alert").show();
    return t;
}




$(document).ready(function () {
    $("#search-alert").hide();

    $("#search-btn").on("click", function (e) {
        e.preventDefault();
        clearResults();
        let userinput = $("#searchbar-input").val();
        searchByInput(userinput);
    });

    $("#searchsurr-btn").on("click", function (e) {
        e.preventDefault();
        clearResults();
        inSurroundings();
    });
    inSurroundings();
});

// DEMO

// Add element to the list
//searchByInput(jsondataURI, "Ke");


// Shows the results of the search on the map
//showMarkersOnMap(jsondataURI);

// Try the flying animation
//tryFly();