import apiClient from '../services/api'

// Voucher validation utility functions
export class VoucherValidator {

  /**
   * Validate voucher phía backend — toàn bộ business rules đều được kiểm tra server-side.
   * Trả về { valid, message, discountAmount, finalTotal, ... }
   */
  static async validateVoucherOnServer(voucherCode, userId, subtotal, seatCount) {
    try {
      const res = await apiClient.post('/payment/validate-voucher', {
        voucherCode,
        userId,
        subtotal,
        seatCount
      })
      return res.data
    } catch (error) {
      console.error('Error validating voucher on server:', error)
      return { valid: false, message: 'Lỗi kiểm tra voucher. Vui lòng thử lại.' }
    }
  }

  /**
   * Tính discount amount client-side (dùng để preview UI realtime).
   * Fix bug: VoucherType từ backend là UPPERCASE (PERCENTAGE/FIXED).
   */
  static calculateDiscount(voucher, subtotal) {
    if (!voucher || !subtotal) return 0

    const type = (voucher.type || '').toUpperCase()
    let discount = 0

    if (type === 'PERCENTAGE') {
      discount = (subtotal * voucher.value) / 100
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount
      }
    } else if (type === 'FIXED') {
      discount = voucher.value
    }

    return Math.min(Math.floor(discount), subtotal)
  }

  /**
   * Format giá trị voucher để hiển thị trên UI.
   * Fix bug: VoucherType từ backend là UPPERCASE.
   */
  static formatVoucherValue(voucher) {
    const type = (voucher.type || '').toUpperCase()
    if (type === 'PERCENTAGE') {
      return `${voucher.value}%`
    } else {
      return `${Math.floor(voucher.value / 1000)}K`
    }
  }

  /**
   * Lấy danh sách tất cả voucher đang active để hiển thị trên UI.
   * Validation thực sự sẽ được làm phía server khi user apply.
   */
  static async getActiveVouchers() {
    try {
      const res = await apiClient.get('/vouchers/active')
      return res.data
    } catch (error) {
      console.error('Error getting active vouchers:', error)
      return []
    }
  }

  /**
   * Lấy vouchers với trạng thái "có thể dùng hay không" cho UI.
   * Client-side check chỉ là để disable UI, validation thật là server-side.
   */
  static async getVouchersWithStatus(userId, subtotal, seatCount) {
    try {
      const vouchers = await this.getActiveVouchers()
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD

      return vouchers.map(voucher => {
        // Fix bug date: validTo là LocalDate (YYYY-MM-DD string), không phải datetime
        const validToOk = !voucher.validTo || voucher.validTo >= todayStr
        const validFromOk = !voucher.validFrom || voucher.validFrom <= todayStr
        const hasUsages = voucher.usedCount < voucher.usageLimit

        // Weekend check (client-side preview only)
        const isWeekend = today.getDay() === 0 || today.getDay() === 6
        const weekendOk = !voucher.weekendOnly || isWeekend

        // Order conditions
        const minOrderOk = !voucher.minOrderValue || voucher.minOrderValue === 0 || subtotal >= voucher.minOrderValue
        const minSeatsOk = !voucher.minSeats || voucher.minSeats === 0 || seatCount >= voucher.minSeats

        const canUse = validToOk && validFromOk && hasUsages && weekendOk && minOrderOk && minSeatsOk

        let reason = ''
        if (!validToOk) reason = 'Đã hết hạn'
        else if (!validFromOk) reason = 'Chưa đến ngày dùng'
        else if (!hasUsages) reason = 'Đã hết lượt'
        else if (!weekendOk) reason = 'Chỉ dùng cuối tuần'
        else if (!minOrderOk) reason = `Tối thiểu ${(voucher.minOrderValue / 1000).toFixed(0)}K`
        else if (!minSeatsOk) reason = `Cần ${voucher.minSeats}+ ghế`

        return {
          ...voucher,
          canUse,
          reason,
          displayValue: this.formatVoucherValue(voucher)
        }
      })
    } catch (error) {
      console.error('Error getting vouchers with status:', error)
      return []
    }
  }

  // Format restriction text để hiển thị tooltip/mô tả
  static getRestrictionText(voucher) {
    const restrictions = []
    if (voucher.oneTimePerUser) restrictions.push('Mỗi tài khoản 1 lần')
    if (voucher.newUsersOnly) restrictions.push(`Thành viên mới (${voucher.daysAfterRegistration || 7} ngày)`)
    if (voucher.weekendOnly) restrictions.push('Chỉ cuối tuần (T7-CN)')
    if (voucher.minSeats > 0) restrictions.push(`Tối thiểu ${voucher.minSeats} ghế`)
    if (voucher.minOrderValue > 0) restrictions.push(`Đơn tối thiểu ${(voucher.minOrderValue / 1000).toFixed(0)}K`)
    return restrictions.join(' · ')
  }
}

export default VoucherValidator