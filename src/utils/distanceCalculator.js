/**
 * Thalir Boutique Dynamic Shipping & Distance Calculator
 * Shop Location: 5/797, NC Colony, Kumarapalayam Main Road, Veppadai, Namakkal – 638008, Tamil Nadu
 * GPS Coordinates: 11.4589° N, 77.7876° E
 * 
 * Shipping Rules:
 *  - Distance <= 100 km:   ₹30 (Local Boutique Delivery)
 *  - Distance > 100-500 km: ₹50 (Regional / South India Courier)
 *  - Distance > 500 km:     ₹70 (National Express Courier)
 */

export const SHOP_LOCATION = {
  name: "Thalir Boutique Showroom",
  address: "5/797, NC Colony, Kumarapalayam Main Road, Veppadai, Namakkal – 638008, Tamil Nadu",
  lat: 11.4589,
  lng: 77.7876,
  pincode: "638008",
  city: "Veppadai, Namakkal"
};

/**
 * Calculates Driving Road Path distance between two coordinates using OSRM (Open Source Routing Machine)
 * Real highway / road network driving distance in Kilometers
 */
export const calculateRoadPathDistanceKm = async (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  try {
    // OSRM coordinates format: lon1,lat1;lon2,lat2
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
        const roadMeters = data.routes[0].distance;
        const roadDistanceKm = Math.round(roadMeters / 1000);
        return roadDistanceKm;
      }
    }
  } catch (err) {
    console.warn("OSRM road calculation fallback:", err.message);
  }

  // High-accuracy fallback: Haversine distance with 1.2x road curve factor
  const straightDist = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
  return straightDist ? Math.round(straightDist * 1.2) : null;
};

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula (in Kilometers)
 */
export const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Maps distance in km to the requested shipping fee tiers:
 * <= 100 km   -> ₹30
 * 100-500 km  -> ₹50
 * > 500 km    -> ₹70
 */
export const getShippingRateForDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return {
      rate: 50, // Default fallback before address/location is entered
      distanceKm: null,
      tier: "Standard Delivery",
      description: "Auto-calculated on address/GPS",
      badgeColor: "emerald"
    };
  }

  const dist = Number(distanceKm);

  if (dist <= 100) {
    return {
      rate: 30,
      distanceKm: dist,
      tier: "Local Delivery (≤ 100 km)",
      description: `📍 ${dist} km from Veppadai Boutique • Local Shipping ₹30`,
      badgeColor: "emerald",
      tag: "Local Express"
    };
  } else if (dist <= 500) {
    return {
      rate: 50,
      distanceKm: dist,
      tier: "Regional Delivery (100 - 500 km)",
      description: `📍 ${dist} km from Veppadai Boutique • Regional Shipping ₹50`,
      badgeColor: "amber",
      tag: "Regional Courier"
    };
  } else {
    return {
      rate: 70,
      distanceKm: dist,
      tier: "National Delivery (> 500 km)",
      description: `📍 ${dist} km from Veppadai Boutique • All-India Express ₹70`,
      badgeColor: "blue",
      tag: "National Express"
    };
  }
};

/**
 * Browser Geolocation API Wrapper
 */
export const getBrowserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy)
        });
      },
      (error) => {
        let msg = "Could not detect location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access was denied. Please allow location or enter your pincode.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is currently unavailable.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please enter your address.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Reverse Geocode coordinates to Address, City, Pincode using OpenStreetMap Nominatim
 */
export const reverseGeocodeCoordinates = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en'
      }
    });
    
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    
    const addr = data.address || {};
    const street = [
      addr.house_number,
      addr.building,
      addr.road || addr.suburb || addr.neighbourhood
    ].filter(Boolean).join(', ');

    const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
    const pincode = addr.postcode || '';
    const state = addr.state || '';

    return {
      displayName: data.display_name || '',
      street: street || addr.neighbourhood || addr.suburb || '',
      city: city || state,
      pincode: pincode.replace(/\s+/g, ''),
      state,
      raw: data
    };
  } catch (err) {
    console.warn("Nominatim reverse geocode error:", err);
    return null;
  }
};

/**
 * Fast Offline Pincode & City Distance Estimator (Zero-Latency Fallback)
 */
export const estimateDistanceByPincode = (pincodeStr) => {
  if (!pincodeStr || typeof pincodeStr !== 'string') return null;
  const pin = pincodeStr.trim().replace(/\D/g, '');
  if (pin.length < 3) return null;

  const prefix3 = pin.slice(0, 3);
  const prefix2 = pin.slice(0, 2);
  const firstDigit = pin[0];

  // 1. Local Tamil Nadu Zones within ~100 km of Veppadai / Namakkal / Erode (₹30)
  if (prefix3 === '638') return 25;  // Erode, Veppadai, Bhavani, Tiruchengode, Kumarapalayam (Local < 30km)
  if (prefix3 === '637') return 45;  // Namakkal, Rasipuram (~45km)
  if (prefix3 === '636') return 48;  // Salem, Omalur, Sankari (~48km)
  if (prefix3 === '641') return 78;  // Coimbatore, Tiruppur, Avinashi (~78km)
  if (prefix3 === '639') return 65;  // Karur (~65km)
  if (prefix3 === '642') return 95;  // Pollachi, Udumalpet (~95km)

  // 2. Regional Zones (100 - 500 km) -> ₹50
  // Rest of Tamil Nadu
  if (prefix3 === '624') return 125; // Dindigul (~125km)
  if (prefix3 === '620' || prefix3 === '621') return 135; // Trichy (~135km)
  if (prefix3 === '635') return 145; // Dharmapuri, Krishnagiri, Hosur (~145km)
  if (prefix3 === '625') return 185; // Madurai (~185km)
  if (prefix3 === '605') return 230; // Puducherry, Cuddalore (~230km)
  if (prefix3 === '606' || prefix3 === '607') return 210; // Villupuram, Tiruvannamalai (~210km)
  if (prefix3 === '600' || prefix3 === '601' || prefix3 === '602' || prefix3 === '603') return 360; // Chennai, Chengalpattu (~360km)
  if (prefix3 === '628' || prefix3 === '627' || prefix3 === '629') return 380; // Tirunelveli, Tuticorin, Kanyakumari (~380km)
  if (prefix3 === '630' || prefix3 === '631' || prefix3 === '632') return 260; // Vellore, Ranipet, Sivaganga (~260km)

  // Karnataka / Bangalore / Mysore (~200 - 350km)
  if (prefix3 === '560' || prefix3 === '561' || prefix3 === '562') return 210; // Bangalore (~210km)
  if (prefix3 === '570' || prefix3 === '571') return 195; // Mysore (~195km)
  if (prefix3 === '515' || prefix3 === '516' || prefix3 === '517') return 280; // Chittoor, Tirupati, Anantapur (~280km)

  // Kerala (~120 - 400km)
  if (prefix2 === '67' || prefix2 === '68' || prefix2 === '69') return 230; // Kerala (Palakkad, Kochi, Kozhikode, Trivandrum)

  // 3. National Delivery (> 500 km) -> ₹70
  if (firstDigit === '1' || firstDigit === '2' || firstDigit === '3' || firstDigit === '4' || firstDigit === '7' || firstDigit === '8') {
    return 850; // North, West, East, Central India
  }

  // Rest of AP & Telangana
  if (prefix2 === '50' || prefix2 === '51' || prefix2 === '52' || prefix2 === '53') {
    return 750; // Hyderabad, Vizag, Vijayawada (> 500km)
  }

  return 350; // Default regional estimate
};

/**
 * Geocode Pincode or City with Live Nominatim API & Fallback
 */
export const geocodePincodeOrCity = async (pincode, city) => {
  const query = (pincode && pincode.length >= 6) ? pincode.trim() : (city ? city.trim() : '');
  if (!query) return null;

  try {
    const url = pincode && pincode.length >= 6
      ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode.trim())}&country=India&format=json`
      : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', India')}&format=json`;

    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const destLat = parseFloat(data[0].lat);
        const destLng = parseFloat(data[0].lon);
        const distanceKm = await calculateRoadPathDistanceKm(
          SHOP_LOCATION.lat,
          SHOP_LOCATION.lng,
          destLat,
          destLng
        );
        const shippingInfo = getShippingRateForDistance(distanceKm);
        return {
          ...shippingInfo,
          coords: { lat: destLat, lng: destLng },
          resolvedPlace: data[0].display_name
        };
      }
    }
  } catch (e) {
    console.warn("Live geocode lookup failed, using offline fallback:", e);
  }

  // Offline Fallback
  const fallbackDist = estimateDistanceByPincode(pincode);
  if (fallbackDist !== null) {
    return getShippingRateForDistance(fallbackDist);
  }

  return getShippingRateForDistance(null);
};
