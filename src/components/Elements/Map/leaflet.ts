import { type Colors } from '@/components/colors'
import { type AvailableRoom, type RoomEntry } from '@/types/utils'
import { Buffer } from 'buffer'
import type WebView from 'react-native-webview'

/**
 * Adds a room to the map with a GeoJSON polygon and a popup containing room information.
 *
 * @param room - The room to add to the map.
 * @param availableRooms - An array of available rooms.
 * @param mapRef - A reference to the Leaflet map.
 * @param colors - An object containing color values.
 * @param language - The current language.
 * @returns void
 */
export const _addRoom = (
    room: RoomEntry,
    availableRooms: AvailableRoom[] | null,
    mapRef: React.RefObject<WebView>,
    colors: Colors
): void => {
    const coordinates = room.coordinates
    const name = room?.properties?.Raum
    const avail = availableRooms?.find((x) => x.room === name)
    const color = avail != null ? colors.primary : 'grey'

    const geojsonFeature = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
        },
        properties: {
            room: room?.properties.Raum,
            center: room?.options?.center,
        },
    }

    if (mapRef.current == null) return
    mapRef.current.injectJavaScript(`
        var geojsonFeature = ${JSON.stringify(geojsonFeature)};

        var layer = L.geoJSON(geojsonFeature, {
            color: ${JSON.stringify(color)},
            fillOpacity: 0.2,
        }).addTo(mymap).bringToBack();

        // Add click event listener to the layer
        layer.on('click', function(e) {
            var properties = e.layer.feature.properties;
           

            // Send data to React Native app
            sendMessageToRN(JSON.stringify({
                type: 'roomClick',
                payload: {
                    type: 'room',
                    properties: properties,
                },
            }));
        });
        true;
    `)
}

/**
 * Removes all GeoJSON layers from the Leaflet map.
 *
 * @param mapRef - A reference to the Leaflet map.
 * @returns void
 */
export const _removeAllGeoJson = (mapRef: React.RefObject<WebView>): void => {
    mapRef.current?.injectJavaScript(`
        mymap.eachLayer(function (layer) {
            if (layer instanceof L.GeoJSON) {
                mymap.removeLayer(layer);
            }
        });
        true
    `)
}

/**
 * Sets the center of the Leaflet map to the specified coordinates.
 *
 * @param center - The coordinates to center the map on.
 * @param mapRef - A reference to the Leaflet map.
 * @param animate - Whether to animate the transition.
 * @returns void
 */
export const _setView = (
    center: number[] | undefined,
    mapRef: React.RefObject<WebView>,
    animate: boolean = true
): void => {
    if (center == null) return
    mapRef.current?.injectJavaScript(`
mymap.setView(${JSON.stringify(center)}, 17.5, { animate: ${animate} });
true;
`)
}

// inject the current location into the map
export const _injectCurrentLocation = (
    mapRef: React.RefObject<WebView>,
    colors: Colors,
    accuracy: number,
    currentLocation: number[]
): void => {
    mapRef.current?.injectJavaScript(`
if (window.currentLocationMarker) {
    window.currentLocationMarker.remove();
}

window.currentLocationMarker = L.circle(${JSON.stringify(currentLocation)}, {
    color: ${JSON.stringify(colors.primary)},
    fillColor: ${JSON.stringify(colors.primary)},
    fillOpacity: 0.6,
    radius: ${accuracy},
}).addTo(mymap);
true;
`)
}

export const _injectMarker = (
    mapRef: React.RefObject<WebView>,
    coordinates: number[],
    colors: Colors
): void => {
    const color = colors.primary
    const svg = `
    <svg viewBox="0 0 824 944"
    version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path d="M512 85.3c-164.9 0-298.6 133.7-298.6 298.6 0 164.9 298.6 554.6 298.6 554.6s298.6-389.7 298.6-554.6c0-164.9-133.7-298.6-298.6-298.6z m0 448a149.3 149.3 0 1 1 0-298.6 149.3 149.3 0 0 1 0 298.6z" fill="${color}" stroke="black" stroke-width="35" />
</svg>

`
    const base64Svg = Buffer.from(svg).toString('base64')
    mapRef.current?.injectJavaScript(`
if (window.marker) {
    window.marker.remove();
}

window.marker = L.marker(${JSON.stringify(coordinates)}, {
    icon: L.icon({
        iconUrl: 'data:image/svg+xml;base64,${base64Svg}',
        iconSize: [45, 45],
        iconAnchor: [24, 42],
    })
}).addTo(mymap);

true;
`)
}

// update marker color wihtout removing it
export const _updateMarkerColor = (
    mapRef: React.RefObject<WebView>,
    color: string
): void => {
    mapRef.current?.injectJavaScript(`
if (window.marker) {
    window.marker.setIcon(L.icon({
        iconUrl: 'data:image/svg+xml;base64,${Buffer.from(
            `
            <svg viewBox="0 0 824 944" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <path d="M512 85.3c-164.9 0-298.6 133.7-298.6 298.6 0 164.9 298.6 554.6 298.6 554.6s298.6-389.7 298.6-554.6c0-164.9-133.7-298.6-298.6-298.6z m0 448a149.3 149.3 0 1 1 0-298.6 149.3 149.3 0 0 1 0 298.6z" fill="${color}" stroke="black" stroke-width="35" />
            </svg>
            `
        ).toString('base64')}',
        iconAnchor: [24, 42],
        iconSize: [45, 45],
    }));
}
true;
`)
}

// remove the marker from the map
export const _removeMarker = (mapRef: React.RefObject<WebView>): void => {
    mapRef.current?.injectJavaScript(`
if (window.marker) {
    window.marker.remove();
}
true;
`)
}

/**
 * A string containing an HTML script that initializes a Leaflet map with OpenStreetMap tiles and event listeners for error and internet connection checking.
 */
export const htmlScript = `

<!DOCTYPE html>
<html>
<head>
    <title>Quick Start - Leaflet</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1.0">
    <link rel="shortcut icon" type="image/x-icon" href="docs/images/favicon.ico" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w==" crossorigin="anonymous">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha512-BwHfrr4c9kmRkLw6iXFdzcdWV/PGkVgiIyIWLLlTSXzWQzxuSg4DiQUCpauz/EWjgk5TYQqX/kvn9pG1NpYfqg==" crossorigin=""></script>
    <style>
        body {
            -webkit-user-select: none;
            /* Other browsers */
            user-select: none;
        }
    </style>
</head>
<body style="padding: 0; margin: 0">
    <div id="mapid" style="width: 100%; height: 100vh;"></div>
    <script>
        function sendMessageToRN(message) {
            window.ReactNativeWebView.postMessage(message);
        }

        function handleLoadError(event) {
            var errorMessage = "mapLoadError";
            sendMessageToRN(errorMessage);
            window.removeEventListener('error', handleLoadError, true);
        }

        function checkInternetConnection() {
            if (!navigator.onLine) {
                var noInternetMessage = "noInternetConnection";
                sendMessageToRN(noInternetMessage);
            }
        }


        
        // Add event listeners
        window.addEventListener('error', handleLoadError, true);
        window.addEventListener('online', checkInternetConnection);
        window.addEventListener('offline', checkInternetConnection);

        var mymap = L.map('mapid', { zoomControl: false, minZoom: 16, maxZoom: 20 }).setView([48.76709, 11.4328], 17.5);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 21,
            attribution: 'Map data &copy; OpenStreetMap contributors'
        }).addTo(mymap);
        
        mymap.on('popupopen', function (e) {
            var popup = e.popup.getContent();
            sendMessageToRN(popup);
        });


    </script>
</body>
</html>



`
