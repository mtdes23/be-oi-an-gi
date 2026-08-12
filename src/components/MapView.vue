<template>
  <div class="w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 card-shadow">
    <div ref="mapContainer" class="w-full h-full"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  places: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null }
})

const mapContainer = ref(null)
let map = null
let markers = []

const defaultCenter = [10.762622, 106.660172]
const defaultZoom = 12

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

  const locationMap = {
    'Quận 1': [10.7721, 106.7019],
    'Quận 2': [10.7870, 106.7450],
    'Quận 3': [10.7830, 106.6940],
    'Quận 4': [10.7600, 106.7060],
    'Quận 5': [10.7570, 106.6660],
    'Quận 7': [10.7300, 106.7250],
    'Quận 10': [10.7730, 106.6700],
    'Bình Thạnh': [10.8010, 106.7100],
    'Phú Nhuận': [10.7950, 106.6850],
    'Tân Bình': [10.8020, 106.6520],
    'Thủ Đức': [10.8500, 106.7500],
    'Gò Vấp': [10.8380, 106.6650],
    'Tân Phú': [10.7910, 106.6290],
    'Bình Tân': [10.7720, 106.6080],
    'Nhà Bè': [10.6960, 106.7200],
    'Cần Giờ': [10.4110, 106.9530],
  }

  props.places.forEach(place => {
    const coords = locationMap[place.dist]
    if (!coords) return

    const offsetLat = coords[0] + (Math.random() - 0.5) * 0.005
    const offsetLng = coords[1] + (Math.random() - 0.5) * 0.005

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
          <strong style="font-size:14px;color:#1c1917;">${place.name}</strong>
          <div style="font-size:12px;color:#78716c;margin:4px 0;">${place.dish} • ${place.price}</div>
          <div style="font-size:11px;color:#a8a29e;">${place.addr}, ${place.dist}</div>
          <div style="font-size:11px;color:#a8a29e;margin-top:2px;">⏰ ${place.time || 'N/A'}</div>
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
