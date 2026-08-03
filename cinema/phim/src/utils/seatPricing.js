/**
 * Tạo layout ghế động theo tổng số ghế.
 * - Hàng cuối = ghế đôi: 5 cặp (mỗi nút bấm đại diện 2 chỗ, ids = [X1,X2])
 * - Hàng VIP ở giữa, VIP chỉ cột 3-8 (cột 1,2,9,10 vẫn là standard)
 * - Còn lại là ghế thường
 */
export const buildSeatLayout = (totalSeats) => {
  const SEATS_PER_ROW = 10;
  const COUPLE_PAIRS = 5; // 5 nút đôi = 10 chỗ ngồi thực tế
  const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const regularSeats = totalSeats - 10; // trừ 10 ghế cho hàng đôi
  const regularRows = Math.ceil(regularSeats / SEATS_PER_ROW);

  // Xác định hàng VIP: vùng giữa (35%-65%)
  const vipStart = Math.round(regularRows * 0.35);
  const vipEnd   = Math.round(regularRows * 0.65);
  const vipRowIndices = [];
  for (let i = vipStart; i <= vipEnd && i < regularRows; i++) {
    vipRowIndices.push(i);
  }

  const rows = [];

  for (let r = 0; r < regularRows; r++) {
    const label    = ROW_LABELS[r];
    const isVipRow = vipRowIndices.includes(r);
    const seats    = [];

    for (let s = 1; s <= SEATS_PER_ROW; s++) {
      const seatNum = r * SEATS_PER_ROW + s;
      if (seatNum <= regularSeats) {
        // VIP chỉ cột 3-8 trong hàng VIP
        const isVip = isVipRow && s >= 3 && s <= 8;
        seats.push({ id: label + s, type: isVip ? 'vip' : 'standard' });
      }
    }

    if (seats.length > 0) {
      rows.push({ label, seats, type: isVipRow ? 'mixed' : 'standard' });
    }
  }

  // Hàng ghế đôi cuối cùng — mỗi phần tử là một CẶP ghế
  const coupleLabel = ROW_LABELS[regularRows];
  const coupleSeats = [];
  for (let p = 0; p < COUPLE_PAIRS; p++) {
    coupleSeats.push({
      ids: [coupleLabel + (p * 2 + 1), coupleLabel + (p * 2 + 2)],
      type: 'couple'
    });
  }
  rows.push({ label: coupleLabel, seats: coupleSeats, type: 'couple' });

  const vipRowLabels = vipRowIndices.map(i => ROW_LABELS[i]);
  return { rows, coupleRowLabel: coupleLabel, vipRowLabels };
};

/**
 * Trả về thông tin giá + loại ghế dựa vào seatId và layout động.
 * Couple seat: mỗi ID trong cặp có price = basePrice + 10000 (cộng lại = 2*base + 20000 / cặp)
 */
export const getSeatInfo = (seatId, basePrice, layoutRows) => {
  if (!seatId) return { type: 'standard', price: basePrice || 0, label: 'Thường' };

  if (layoutRows) {
    for (const row of layoutRows) {
      for (const seat of row.seats) {
        if (seat.ids) {
          // Ghế đôi: mỗi ID trong cặp
          if (seat.ids.includes(seatId)) {
            return { type: 'couple', price: (basePrice || 0) + 10000, label: 'Ghế Đôi' };
          }
        } else if (seat.id === seatId) {
          if (seat.type === 'vip') {
            return { type: 'vip', price: (basePrice || 0) + 20000, label: 'VIP' };
          }
          return { type: 'standard', price: basePrice || 0, label: 'Thường' };
        }
      }
    }
  }

  // Fallback (tương thích ngược)
  const row = seatId.charAt(0).toUpperCase();
  if (['E', 'F', 'G', 'H'].includes(row)) {
    return { type: 'vip', price: (basePrice || 0) + 20000, label: 'VIP' };
  }
  if (row === 'J') {
    return { type: 'couple', price: (basePrice || 0) + 10000, label: 'Ghế Đôi' };
  }
  return { type: 'standard', price: basePrice || 0, label: 'Thường' };
};

export const calculateTotalSeatsPrice = (seatIds, basePrice, layoutRows) => {
  return seatIds.reduce((total, seatId) => {
    return total + getSeatInfo(seatId, basePrice, layoutRows).price;
  }, 0);
};
