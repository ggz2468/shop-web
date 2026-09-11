import http from '@/plugins/axios'

export const shipmentStoreMapRequestServices = {
    create: (data) => http.post('/shipment-store-map-requests', data),
    getSelectionResult: (selectionToken) => http.get(`/shipment-store-map-requests/${selectionToken}`),
}