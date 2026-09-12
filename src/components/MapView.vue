<template>
  <div class="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 card-shadow">
    <div ref="mapContainer" class="w-full h-full"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DISTRICT_LOCATIONS } from '../data/locations.js'

const props = defineProps({
  places: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null }
})

const mapContainer = ref(null)
let map = null
let markers = []

const defaultCenter = [10.762622, 106.660172]
const defaultZoom = 12

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: props.userLocation || defaultCenter,
    zoom: props.userLocation ? 13 : defaultZoom,
    zoomControl: false
  })

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(map)

  if (props.userLocation) {
    L.circleMarker(props.userLocation, {
      radius: 8,
      color: '#3b82f6',
      fillColor: '#60a5fa',
      fillOpacity: 0.9,
      weight: 3
    }).addTo(map).bindPopup('📍 Vị trí của bạn')
  }

  updateMarkers()
}

watch(() => props.places, updateMarkers, { deep: true })
watch(() => props.userLocation, (newLoc) => {
  if (map && newLoc) {
    map.setView(newLoc, 13)
  }
})

function updateMarkers() {
  if (!map) return
  markers.forEach(m => map.removeLayer(m))
  markers = []

  props.places.forEach(place => {
    const loc = DISTRICT_LOCATIONS[place.dist]
    if (!loc) return

    const offsetLat = loc.lat + (Math.random() - 0.5) * 0.005
    const offsetLng = loc.lng + (Math.random() - 0.5) * 0.005

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background:linear-gradient(135deg,#f97316,#f59e0b);width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;">🍜</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    const marker = L.marker([offsetLat, offsetLng], { icon })
      .addTo(map)
      .bindPopup(`
        <div style="min-width:180px;">
          <strong style="font-size:14px;color:#1c1917;">${escapeHtml(place.name)}</strong>
          <div style="font-size:12px;color:#78716c;margin:4px 0;">${escapeHtml(place.dish)} • ${escapeHtml(place.price)}</div>
          <div style="font-size:11px;color:#a8a29e;">${escapeHtml(place.addr)}, ${escapeHtml(place.dist)}</div>
          <div style="font-size:11px;color:#a8a29e;margin-top:2px;">⏰ ${escapeHtml(place.time) || 'N/A'}</div>
        </div>
      `)

    marker.on('click', () => {
      emit('select', place)
    })

    markers.push(marker)
  })
}

const emit = defineEmits(['select'])

defineExpose({ map })
</script>

<style>
.custom-marker {
  background: transparent !important;
  border: none !important;
}
.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
}
.leaflet-popup-content {
  margin: 12px !important;
  font-family: 'Be Vietnam Pro', sans-serif !important;
}
</style>
