export const getSeatInfo = (seatId, basePrice) => {
  if (!seatId) return { type: 'standard', price: basePrice, label: 'Thường' };
  
  const row = seatId.charAt(0).toUpperCase();
  const num = parseInt(seatId.slice(1), 10);
  
  // VIP: Rows E, F, G, H and seats 3 to 8
  if (['E', 'F', 'G', 'H'].includes(row) && num >= 3 && num <= 8) {
    return {
      type: 'vip',
      price: basePrice + 20000,
      label: 'VIP'
    };
  }
  
  // Couple: Row J
  if (row === 'J') {
    return {
      type: 'couple',
      price: (basePrice * 2) + 20000,
      label: 'Couple'
    };
  }
  
  // Standard: Everything else
  return {
    type: 'standard',
    price: basePrice,
    label: 'Thường'
  };
};

export const calculateTotalSeatsPrice = (seatIds, basePrice) => {
  return seatIds.reduce((total, seatId) => {
    return total + getSeatInfo(seatId, basePrice).price;
  }, 0);
};
