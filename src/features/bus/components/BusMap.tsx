import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export interface BusMapStop {
  name: string;
  lat: number;
  lng: number;
}

interface BusMapProps {
  stops: BusMapStop[];
  busLocation?: { lat: number; lng: number } | null;
  height?: number;
}

/**
 * Leaflet-in-WebView live map — ported from campusflow-mobile's BusMap
 * pattern (no native maps lib), restyled to the School Edition violet palette.
 * `busLocation` updates are injected into the page via `injectJavaScript`
 * rather than re-rendering the WebView, so the marker glides between GPS fixes.
 */
export const BusMap: React.FC<BusMapProps> = ({ stops, busLocation, height = 300 }) => {
  const webRef = useRef<WebView>(null);

  useEffect(() => {
    if (webRef.current && busLocation) {
      const script = `
        (function() {
          if (window.updateBusMarker) {
            window.updateBusMarker(${busLocation.lat}, ${busLocation.lng});
          }
        })();
        true;
      `;
      webRef.current.injectJavaScript(script);
    }
  }, [busLocation]);

  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"><\/script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #F7F6FB; }
    .custom-stop-marker {
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 50%;
      background: #6D28D9; border: 2px solid #ffffff; color: #ffffff;
      font-weight: bold; font-size: 11px; box-shadow: 0 2px 6px rgba(59,7,100,.3);
    }
    .custom-bus-marker {
      width: 20px; height: 20px; border-radius: 50%;
      background: #7C3AED; border: 3px solid #ffffff;
      box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.35), 0 2px 8px rgba(0,0,0,.3);
    }
    .custom-bus-marker-wrap { transition: transform 0.9s linear; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([18.5204, 73.8567], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);

    var stopsData = ${JSON.stringify(stops)};
    var stopMarkers = [];
    var routePoints = [];

    stopsData.forEach(function(stop, index) {
      var lat = parseFloat(stop.lat);
      var lng = parseFloat(stop.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        routePoints.push([lat, lng]);
        var icon = L.divIcon({
          html: '<div class="custom-stop-marker">' + (index + 1) + '<\/div>',
          className: '', iconSize: [24, 24], iconAnchor: [12, 12]
        });
        var marker = L.marker([lat, lng], { icon: icon }).bindPopup('<b>' + stop.name + '<\/b>').addTo(map);
        stopMarkers.push(marker);
      }
    });

    if (routePoints.length > 1) {
      var routeLine = L.polyline(routePoints, { color: '#6D28D9', weight: 4 }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    var busMarker = null;
    window.updateBusMarker = function(lat, lng) {
      if (!lat || !lng) return;
      var pos = [parseFloat(lat), parseFloat(lng)];
      if (!busMarker) {
        var busIcon = L.divIcon({
          html: '<div class="custom-bus-marker"><\/div>',
          className: 'custom-bus-marker-wrap', iconSize: [20, 20], iconAnchor: [10, 10]
        });
        busMarker = L.marker(pos, { icon: busIcon }).addTo(map);
      } else {
        busMarker.setLatLng(pos);
      }
      map.panTo(pos, { animate: true, duration: 0.9 });
    };

    if (stopsData.length === 0) {
      map.setView([18.5204, 73.8567], 13);
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: leafletHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E1F0",
  },
  webview: { flex: 1 },
});

export default BusMap;
