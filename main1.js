const API_KEY = "AAPKe2307350883d48358ba032c040dde5b9AtdqLfzTq6gnPQ6BBh3ltgw9rVyv6RwqM_c4KyiSCf0Blh-nI3yMvhGi0_GzZHwI";
const div = document.getElementById("MAP-AREA");
const routerCard = document.getElementById("router-card");
const routerInfo = document.getElementById("router-info");
const startLocationInputLatitude = document.getElementById("latitude");
const startLocationInputLongitude = document.getElementById("longitude");
var routerLocations = [];
let myFunction;
let routeGraphicsLayer;
let routeGraphicsLayer1;
let routeGraphicsLayer2;
let mobilegraphic;
let directionsWidget;

require([
    'esri/config',
    'esri/Map',
    'esri/views/MapView',
    'esri/widgets/Directions',
    "esri/tasks/RouteTask",
    "esri/tasks/support/RouteParameters",
    "esri/tasks/support/FeatureSet",
    'esri/Graphic',
    'esri/layers/GraphicsLayer',
    'dojo/domReady!'
], function (esriConfig, Map, MapView, Directions, RouteTask, RouteParameters, FeatureSet, Graphic, GraphicsLayer) {
    // Set the API key
    esriConfig.apiKey = API_KEY;

    // Create the map
    const map = new Map({
        basemap: 'arcgis-navigation'
    });

    // Create the map view
    const view = new MapView({
        container: div,
        map: map,
        center: [4.396, 51.22], // Set the initial center coordinates - ANTWARP
        zoom: 13 // Set the initial zoom level
    });

    // Create a graphics layer to add the router locations
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // Read the router data from the JSON file
    fetch('mapData-51points.json')
        .then(response => response.json())
        .then(data => {
            // Iterate over each router in the JSON data
            data.forEach(router => {
                const location = router.location;
                const latitude = location[0];
                const longitude = location[1];

                // Create a point for the router location
                const point = {
                    type: 'point',
                    longitude: longitude,
                    latitude: latitude
                };

                // Create a symbol for the router location
                const routerSymbol = {
                    type: "picture-marker",
                    url: "router_symbol.png", // URL or path to the router symbol image
                    width: "32px", // Adjust the size as needed
                    height: "32px"
                };

                // attributes to be displayed
                const attributes = {
                    id: router.id,
                    location: [latitude, longitude],
                    generations_supported: router.generations_supported,
                    preferred_capabilities: router.preferred_capabilities,
                    current_position_capability: router.current_position_capability,
                    positions_towards_5g_support: router.positions_towards_5g_support,
                    positions_towards_4g_support: router.positions_towards_4g_support,
                    positions_towards_3g_support: router.positions_towards_3g_support
                };
                routerLocations.push(attributes);

                // Create a graphic for the router location
                const graphic = new Graphic({
                    geometry: point,
                    symbol: routerSymbol,
                    attributes: attributes // Set the attributes of the graphic to the router data
                });

                // Add the graphic to the
                graphicsLayer.add(graphic);
            });
            myFunction = function () {
                // routerLocation => array of objects 
                console.log(routerLocations);
                const startLatitude = startLocationInputLatitude.value;
                const startLongitude = startLocationInputLongitude.value;

                // Create a graphics layer to add the route graphics
                const mobilepoint = {
                    type: 'point',
                    longitude: startLongitude,
                    latitude: startLatitude
                };

                // Create a symbol for the router location
                const mobileSymbol = {
                    type: "picture-marker",
                    url: "phoneimg.png", // URL or path to the router symbol image
                    width: "32px", // Adjust the size as needed
                    height: "32px"
                };
                if (mobilegraphic) {
                    graphicsLayer.remove(mobilegraphic);
                }
                mobilegraphic = new Graphic({
                    geometry: mobilepoint,
                    symbol: mobileSymbol,
                    // attributes: attributes // Set the attributes of the graphic to the router data
                });

                // Add the graphic to the graphics layer
                graphicsLayer.add(mobilegraphic);

                if (routeGraphicsLayer) {
                    routeGraphicsLayer.removeAll();
                }
                if (routeGraphicsLayer1) {
                    routeGraphicsLayer1.removeAll();
                }
                if (routeGraphicsLayer2) {
                    routeGraphicsLayer2.removeAll();
                }

                routeGraphicsLayer = new GraphicsLayer();
                map.add(routeGraphicsLayer);

                // Set up the route task
                const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

                const routeTask = new RouteTask({
                    url: routeUrl
                    // url: "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
                });

                // Create the route parameters
                const routeParams = new RouteParameters({
                    stops: new FeatureSet(),
                    returnDirections: true,
                    returnRoutes: true,
                });
                // routeParams.travelMode = {
                //     type: "walking"
                // };

                // Add the start location to the route parameters
                routeParams.stops.features.push(
                    new Graphic({
                        geometry: {
                            type: "point",
                            longitude: startLongitude,
                            latitude: startLatitude
                        }
                    })
                );

                // find the nearest router and add it to the routeParams


                let nearestRouters = [];
                // Iterate over all the router locations to find the nearest routers
                for (const router of routerLocations) {
                    const routerLocation = router.location;
                    const distance = calculateDistance(
                        startLatitude,
                        startLongitude,
                        routerLocation[0],
                        routerLocation[1]
                    );

                    // Check if the current router is closer than the routers in the nearestRouters array
                    if (nearestRouters.length < 3) {
                        nearestRouters.push({
                            router: router,
                            distance: distance
                        });
                    } else {
                        // Find the farthest router in the nearestRouters array
                        const farthestRouter = nearestRouters.reduce((prev, curr) => (prev.distance > curr.distance) ? prev : curr);

                        // Replace the farthest router with the current router if it is closer
                        if (distance < farthestRouter.distance) {
                            farthestRouter.router = router;
                            farthestRouter.distance = distance;
                        }
                    }
                }
                // Sort the nearestRouters array based on the distance in ascending order
                nearestRouters.sort((a, b) => a.distance - b.distance);
                // Display the information for the nearest routers
                let directionsHtml = '';
                let nearnearrouter = [];

                let arrofObjects = [];
                for (let i = 0; i < 3; i++) {
                    const nearestRouter = nearestRouters[i];
                    const routerData = nearestRouter.router;
                    let object = {
                        id: routerData.id,
                        location: routerData.location
                    };
                    arrofObjects.push(object);
                    // if(i==0)    
                    // {
                    //     nearnearrouter.push(routerData.location[0]);
                    //     nearnearrouter.push(routerData.location[1]);
                    // }

                    nearnearrouter.push(routerData.location[0]);
                    nearnearrouter.push(routerData.location[1]);

                    // Append the router information to the directionsHtml string
                    directionsHtml += `
                        <p>ID: ${routerData.id}</p>
                        <p>Latitude: ${routerData.location[0]}</p>
                        <p>Longitude: ${routerData.location[1]}</p>
                        <p>Distance: ${nearestRouter.distance.toFixed(2)} km</p>
                        <hr>
                    `;
                }

                console.log("nearnearrouter", nearnearrouter);

                // reading the array of Objects
                /*  arrofObjects.forEach(router => {
                       routeParams.stops.features.push(
                           new Graphic({
                               geometry: {
                                   type: "point",
                                   longitude: router.location[1],
                                   latitude: router.location[0]
                               }
                           })
                       );
                   });*/

                routeParams.stops.features.push(
                    new Graphic({
                        geometry: {
                            type: "point",
                            longitude: nearnearrouter[1],
                            latitude: nearnearrouter[0]
                        }
                    })
                );

                // Solve the route
                routeTask.solve(routeParams)
                    .then(function (result) {
                        // Clear the previous route graphics
                        routeGraphicsLayer.removeAll();

                        // Display the route on the map
                        result.routeResults.forEach(routeResult => {
                            const route = routeResult.route;
                            const routeGraphic = new Graphic({
                                geometry: route.geometry,
                                symbol: {
                                    type: "simple-line",
                                    color: [5, 150, 255], // Blue color for the route
                                    width: 3 // Adjust the width as needed
                                }
                            });
                            routeGraphicsLayer.add(routeGraphic);
                        });

                        // directions
                        // Display the directions
                        const directions = result.routeResults[0].directions;
                        const features = directions.features;



                        const directionsPanel = document.getElementById("directions-panel1");

                        // remove the hidden class in the directions panel
                        directionsPanel.classList.remove("hidden");

                        // Clear previous directions
                        directionsPanel.innerHTML = "";

                        const heading = document.createElement("div");
                        heading.innerHTML = `<h2>Directions</h2><br>`;
                        directionsPanel.appendChild(heading);


                        let count = 0;
                        features.forEach(feature => {
                            const attributes = feature.attributes;
                            const text = attributes.text;
                            // const time = attributes.time;
                            // const length = attributes.length;

                            const directionElement = document.createElement("div");
                            directionElement.innerHTML = `
                                <strong>${++count}</strong>
                                <p>${text}</p>
                                <hr>
                            `;
                            // directionElement.innerHTML = `
                            //     <p>${text}</p>
                            //     <p>Time: ${time}</p>
                            //     <p>Length: ${length}</p>
                            //     <hr>
                            // `;
                            directionsPanel.appendChild(directionElement);
                        });

                        // Zoom to the route extent
                        //view.extent = result.routeResults[0].route.geometry.extent;


                    })
                    .catch(function (error) {
                        console.error("Error calculating route:", error);
                    });

                // add 2nd route
                routeGraphicsLayer1 = new GraphicsLayer();
                map.add(routeGraphicsLayer1);
                // Create the route parameters
                const routeParams1 = new RouteParameters({
                    stops: new FeatureSet(),
                    returnDirections: true,
                    returnRoutes: true,
                });
                // Add the start location to the route parameters
                routeParams1.stops.features.push(
                    new Graphic({
                        geometry: {
                            type: "point",
                            longitude: startLongitude,
                            latitude: startLatitude
                        }
                    })
                );
                routeParams1.stops.features.push(
                    new Graphic({
                        geometry: {
                            type: "point",
                            longitude: nearnearrouter[3],
                            latitude: nearnearrouter[2]
                        }
                    })
                );
                // Solve the route
                routeTask.solve(routeParams1)
                    .then(function (result1) {
                        // Clear the previous route graphics
                        routeGraphicsLayer1.removeAll();

                        // Display the route on the map
                        result1.routeResults.forEach(routeResult1 => {
                            const route1 = routeResult1.route;
                            const routeGraphic1 = new Graphic({
                                geometry: route1.geometry,
                                symbol: {
                                    type: "simple-line",
                                    // add red color for the route
                                    color: [255, 0, 0], //Red color for the route
                                    width: 3 // Adjust the width as needed
                                }
                            });
                            routeGraphicsLayer1.add(routeGraphic1);
                            // Display the directions
                            const directions1 = result1.routeResults[0].directions;
                            const features = directions1.features;



                            const directionsPanel1 = document.getElementById("directions-panel2");

                            // remove the hidden class in the directions panel
                            // directionsPanel1.classList.remove("hidden");

                            // Clear previous directions
                            directionsPanel1.innerHTML = "";

                            const heading = document.createElement("div");
                            heading.innerHTML = `<h2>Directions</h2><br>`;
                            directionsPanel1.appendChild(heading);


                            let count = 0;
                            features.forEach(feature => {
                                const attributes = feature.attributes;
                                const text = attributes.text;
                                // const time = attributes.time;
                                // const length = attributes.length;

                                const directionElement = document.createElement("div");
                                directionElement.innerHTML = `
                                <strong>${++count}</strong>
                                <p>${text}</p>
                                <hr>
                            `;

                                directionsPanel1.appendChild(directionElement);
                            });
                        });
                    })
                    .catch(function (error) {
                        console.error("Error calculating route:", error);
                    });



                // add 3rd route
                routeGraphicsLayer2 = new GraphicsLayer();
                map.add(routeGraphicsLayer2);
                // Create the route parameters
                const routeParams2 = new RouteParameters({
                    stops: new FeatureSet(),
                    returnDirections: true,
                    returnRoutes: true,
                });
                // Add the start location to the route parameters
                routeParams2.stops.features.push(
                    new Graphic({
                        geometry: {
                            type: "point",
                            longitude: startLongitude,
                            latitude: startLatitude
                        }
                    })
                );
                routeParams2.stops.features.push(
                    new Graphic({
                        geometry: {
                            type: "point",
                            longitude: nearnearrouter[5],
                            latitude: nearnearrouter[4]
                        }
                    })
                );
                // Solve the route
                routeTask.solve(routeParams2)
                    .then(function (result2) {
                        // Clear the previous route graphics
                        routeGraphicsLayer2.removeAll();

                        // Display the route on the map
                        result2.routeResults.forEach(routeResult2 => {
                            const route2 = routeResult2.route;
                            const routeGraphic2 = new Graphic({
                                geometry: route2.geometry,
                                symbol: {
                                    type: "simple-line",
                                    color: [0, 255, 0], // Green color for the route
                                    width: 3 // Adjust the width as needed
                                }
                            });
                            routeGraphicsLayer2.add(routeGraphic2);

                            
                            const directions2 = result2.routeResults[0].directions;
                            const features = directions2.features;



                            const directionsPanel2 = document.getElementById("directions-panel3");

                            // remove the hidden class in the directions panel
                            // directionsPanel1.classList.remove("hidden");

                            // Clear previous directions
                            directionsPanel2.innerHTML = "";

                            const heading = document.createElement("div");
                            heading.innerHTML = `<h2>Directions</h2><br>`;
                            directionsPanel2.appendChild(heading);


                            let count = 0;
                            features.forEach(feature => {
                                const attributes = feature.attributes;
                                const text = attributes.text;
                                // const time = attributes.time;
                                // const length = attributes.length;

                                const directionElement = document.createElement("div");
                                directionElement.innerHTML = `
                                <strong>${++count}</strong>
                                <p>${text}</p>
                                <hr>
                            `;

                                directionsPanel2.appendChild(directionElement);
                            });
                        });
                    })
                    .catch(function (error) {
                        console.error("Error calculating route:", error);
                    });

            };

            // Listen for mouse hover events on the graphics layer
            view.on("pointer-move", event => {
                view.hitTest(event).then(response => {
                    // Get the first graphic from the hit test response
                    const graphic = response.results[0].graphic;

                    if (graphic) {
                        // Get the router data from the graphic attributes
                        const routerData = graphic.attributes;

                        if (routerData.id != undefined) {// Display the router information
                            // Show the router card
                            routerCard.classList.remove("hidden");
                            // Set the router information in the card
                            routerInfo.innerHTML = `
                              <p><strong>ID:</strong> ${routerData.id}</p>
                              <p><strong>Latitude:</strong> ${routerData.location[0]}</p>
                              <p><strong>Longitude:</strong> ${routerData.location[1]}</p>
                              <p><strong>Generations Supported:</strong> ${routerData.generations_supported.join(", ")}</p>
                              <p><strong>Preferred Capabilities: </strong>${routerData.preferred_capabilities.join(", ")}</p>
                              <p><strong>Current Position Capability: </strong>${routerData.current_position_capability}</p>
                              <p><strong>Positions towards 5G Support: </strong>${routerData.positions_towards_5g_support}</p>
                              <p><strong>Positions towards 4G Support: </strong>${routerData.positions_towards_4g_support}</p>
                              <p><strong>Positions towards 3G Support: </strong>${routerData.positions_towards_3g_support}</p>
                            `;
                        }
                        else {
                            // Hide the router card
                            // routerCard.classList.add("hidden");
                        }
                    } else {
                        // No graphic found, clear the console
                        console.clear();
                    }
                });
            });

        })
        .catch(error => {
            console.error('Error reading router data:', error);
        });

    // Function to calculate the distance between two locations using the Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const earthRadius = 6371; // Radius of the Earth in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;
        return distance;
    }

    // Function to convert degrees to radians
    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

});



function updateLocation(position) {
    const latitudeField = document.getElementById("latitude");
    const longitudeField = document.getElementById("longitude");

    // const latitude = position.coords.latitude;
    const latitude = 51.217;
    // const longitude = position.coords.longitude;
    const longitude = 4.41;

    latitudeField.value = latitude;
    longitudeField.value = longitude;
}

// Function to handle errors when getting location
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("Location access denied by user.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("Request to get location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

// Add click event listener to the "Use Current Location" button
const getLocationBtn = document.getElementById("getLocationBtn");
getLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation, showError);
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});


// directionId
function toggleDirections(directionId) {
    // var content = document.getElementById('directions-panel1');
    var content = document.getElementById(directionId);
    if (content.style.display === 'block') {
        content.style.display = 'none';
    } else {
        content.style.display = 'block';
    }
}

