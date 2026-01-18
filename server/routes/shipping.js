const express = require('express');
const router = express.Router();

// ShipLogic API Base URL (The Courier Guy)
const TCG_API_BASE = 'https://api.shiplogic.com/v2';

// GOAT Grids collection address (where orders ship FROM)
const COLLECTION_ADDRESS = {
  type: "business",
  company: "GOAT Grids",
  street_address: "Cape Town",
  local_area: "Cape Town",
  city: "Cape Town",
  code: "8001",
  zone: "WC",
  country: "ZA"
};

// Default parcel dimensions for braai grids
const DEFAULT_PARCEL = {
  submitted_length_cm: 60,
  submitted_width_cm: 45,
  submitted_height_cm: 10,
  submitted_weight_kg: 3
};

// Province code mapping
const PROVINCE_CODES = {
  'gauteng': 'GP',
  'western cape': 'WC',
  'eastern cape': 'EC',
  'kwazulu-natal': 'KZN',
  'kzn': 'KZN',
  'free state': 'FS',
  'north west': 'NW',
  'mpumalanga': 'MP',
  'limpopo': 'LP',
  'northern cape': 'NC'
};

// Get province code from province name
function getProvinceCode(province) {
  if (!province) return 'GP';
  const normalized = province.toLowerCase().trim();
  return PROVINCE_CODES[normalized] || province.toUpperCase().substring(0, 2);
}

// Get shipping quote
router.post('/quote', async (req, res) => {
  try {
    const apiKey = process.env.TCG_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Courier service not configured' });
    }

    const { 
      streetAddress, 
      suburb, 
      city, 
      postalCode, 
      province,
      lat,
      lng,
      itemCount = 1
    } = req.body;

    if (!streetAddress || !city || !postalCode) {
      return res.status(400).json({ error: 'Address details required (streetAddress, city, postalCode)' });
    }

    // Build delivery address
    const deliveryAddress = {
      type: "residential",
      street_address: streetAddress,
      local_area: suburb || city,
      city: city,
      code: postalCode,
      zone: getProvinceCode(province),
      country: "ZA"
    };

    // Calculate parcel weight based on item count (each grid ~3kg)
    const totalWeight = Math.max(3, itemCount * 3);
    const parcel = {
      ...DEFAULT_PARCEL,
      submitted_weight_kg: totalWeight
    };

    // Request body for ShipLogic API
    const requestBody = {
      collection_address: COLLECTION_ADDRESS,
      delivery_address: deliveryAddress,
      parcels: [parcel]
    };

    console.log('TCG Quote Request:', JSON.stringify(requestBody, null, 2));

    // Call The Courier Guy ShipLogic API
    const response = await fetch(`${TCG_API_BASE}/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TCG API Error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to get shipping quote', details: errorText });
    }

    const data = await response.json();
    console.log('TCG Quote Response:', JSON.stringify(data, null, 2));

    // Parse and simplify the rates for the frontend
    const rates = (data.rates || []).map(rate => ({
      serviceCode: rate.service_level?.code || 'STD',
      serviceName: rate.service_level?.name || 'Standard',
      description: rate.service_level?.description || '',
      price: parseFloat(rate.rate) || 0,
      priceExVat: parseFloat(rate.rate_excluding_vat) || 0,
      estimatedDelivery: rate.service_level?.delivery_date_from 
        ? new Date(rate.service_level.delivery_date_from).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
        : 'TBC',
      deliveryDateFrom: rate.service_level?.delivery_date_from,
      deliveryDateTo: rate.service_level?.delivery_date_to
    }));

    // Sort by price (cheapest first)
    rates.sort((a, b) => a.price - b.price);

    res.json({
      success: true,
      rates: rates,
      itemCount: itemCount,
      deliveryAddress: {
        streetAddress,
        suburb,
        city,
        postalCode,
        province: getProvinceCode(province)
      }
    });

  } catch (error) {
    console.error('Shipping quote error:', error);
    res.status(500).json({ error: 'Failed to get shipping quote', message: error.message });
  }
});

// Create shipment (call after successful payment)
router.post('/create-shipment', async (req, res) => {
  try {
    const apiKey = process.env.TCG_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Courier service not configured' });
    }

    const {
      orderId,
      orderNumber,
      serviceCode,
      deliveryAddress,
      deliveryContact,
      items
    } = req.body;

    if (!deliveryAddress || !deliveryContact || !serviceCode) {
      return res.status(400).json({ error: 'Missing required shipment details' });
    }

    // Build the shipment request
    const shipmentRequest = {
      collection_min_date: new Date().toISOString(),
      collection_address: COLLECTION_ADDRESS,
      special_instructions_collection: `Order: ${orderNumber || orderId}`,
      collection_contact: {
        name: "GOAT Grids",
        email: "goatgrids@gmail.com",
        mobile_number: "+27674077001"
      },
      delivery_min_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      delivery_address: {
        lat: deliveryAddress.lat || -26.2041,
        lng: deliveryAddress.lng || 28.0473,
        street_address: deliveryAddress.streetAddress,
        local_area: deliveryAddress.suburb || deliveryAddress.city,
        suburb: deliveryAddress.suburb || deliveryAddress.city,
        city: deliveryAddress.city,
        code: deliveryAddress.postalCode,
        zone: getProvinceCode(deliveryAddress.province),
        country: "South Africa",
        entered_address: `${deliveryAddress.streetAddress}, ${deliveryAddress.suburb || ''}, ${deliveryAddress.city}, ${deliveryAddress.postalCode}, South Africa`.replace(', ,', ','),
        type: "residential"
      },
      delivery_contact: {
        name: deliveryContact.name,
        email: deliveryContact.email,
        mobile_number: deliveryContact.phone
      },
      parcels: [{
        submitted_length_cm: "60",
        submitted_width_cm: "45",
        submitted_height_cm: "10",
        submitted_weight_kg: String(Math.max(3, (items?.length || 1) * 3)),
        parcel_description: items?.map(i => i.name).join(', ') || "Braai Grid"
      }],
      opt_in_rates: [],
      opt_in_time_based_rates: [],
      service_level_code: serviceCode
    };

    console.log('TCG Shipment Request:', JSON.stringify(shipmentRequest, null, 2));

    const response = await fetch(`${TCG_API_BASE}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(shipmentRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TCG Shipment Error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to create shipment', details: errorText });
    }

    const shipment = await response.json();
    console.log('TCG Shipment Created:', JSON.stringify(shipment, null, 2));

    res.json({
      success: true,
      shipmentId: shipment.id,
      trackingReference: shipment.custom_tracking_reference,
      waybillNumber: shipment.custom_tracking_reference,
      status: shipment.status,
      estimatedCollection: shipment.estimated_collection,
      estimatedDelivery: shipment.estimated_delivery_from
    });

  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Failed to create shipment', message: error.message });
  }
});

// Track shipment
router.get('/track/:waybill', async (req, res) => {
  try {
    const apiKey = process.env.TCG_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Courier service not configured' });
    }

    const { waybill } = req.params;

    const response = await fetch(
      `${TCG_API_BASE}/tracking/shipments/public?waybill=${waybill}&api_key=${apiKey}`
    );

    if (!response.ok) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const tracking = await response.json();

    res.json({
      success: true,
      trackingReference: tracking.custom_tracking_reference,
      status: tracking.status,
      events: tracking.tracking_events || []
    });

  } catch (error) {
    console.error('Track shipment error:', error);
    res.status(500).json({ error: 'Failed to track shipment', message: error.message });
  }
});

module.exports = router;
