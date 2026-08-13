import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default marker icon paths break under bundlers unless re-pointed at the bundled assets.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export function createRouteMap(container) {
  const map = L.map(container)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)
  return map
}

// Draws (or replaces) the route polyline + start/end markers on an existing map instance.
export function drawRoute(map, latLngs) {
  if (map._routeLayerGroup) {
    map.removeLayer(map._routeLayerGroup)
  }
  const line = L.polyline(latLngs, { color: '#d4a76a', weight: 4 })
  const startMarker = L.marker(latLngs[0]).bindTooltip('Loading')
  const endMarker = L.marker(latLngs[latLngs.length - 1]).bindTooltip('Unloading')
  map._routeLayerGroup = L.layerGroup([line, startMarker, endMarker]).addTo(map)

  map.invalidateSize()
  map.fitBounds(line.getBounds(), { padding: [24, 24] })
}
