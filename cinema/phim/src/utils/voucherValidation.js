import axios from 'axios'

// Voucher validation utility functions
export class VoucherValidator {
  
  // Check if user can use a specific voucher
  static async canUserUseVoucher(userId, voucherCode) {
    try {
      // Get voucher details by code
      const voucherRes = await axios.get(`http://localhost:8080/api/vouchers/code/${voucherCode}`)
      const voucher = voucherRes.data
      
      if (!voucher || !voucher.isActive) {
        return { valid: false, reason: 'Voucher không tồn tại hoặc đã hết hạn' }
      }

      // Check if voucher is still valid by date
      if (new Date(voucher.validTo) < new Date()) {
        return { valid: false, reason: 'Voucher đã hết hạn' }
      }

      // Check usage limit
      if (voucher.usedCount >= voucher.usageLimit) {
        return { valid: false, reason: 'Voucher đã hết lượt sử dụng' }
      }

      // Get user info
      const userRes = await axios.get(`http://localhost:8080/api/users/${userId}`)
      const user = userRes.data
      
      if (!user) {
        return { valid: false, reason: 'Người dùng không tồn tại' }
      }

      // Check if user has already used this voucher (oneTimePerUser)
      if (voucher.oneTimePerUser) {
        const bookingsRes = await axios.get(`http://localhost:8080/api/bookings/user/${userId}`)
        const hasUsedVoucher = bookingsRes.data.some(b => b.voucherCode === voucherCode)
        if (hasUsedVoucher) {
          return { valid: false, reason: 'Bạn đã sử dụng voucher này rồi' }
        }
      }

      // Check new user restrictions
      if (voucher.newUsersOnly) {
        const registrationDate = new Date(user.createdAt || '2026-01-01')
        const daysSinceRegistration = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24))
        
        const maxDays = voucher.daysAfterRegistration || 7;
        if (daysSinceRegistration > maxDays) {
          return { 
            valid: false, 
            reason: `Voucher chỉ dành cho tài khoản mới (trong vòng ${maxDays} ngày đăng ký)` 
          }
        }
      }

      // Check weekend only restriction
      if (voucher.weekendOnly) {
        const today = new Date()
        const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          return { valid: false, reason: 'Voucher chỉ áp dụng vào cuối tuần (Thứ 7 - Chủ nhật)' }
        }
      }

      return { valid: true, voucher }
      
    } catch (error) {
      console.error('Error validating voucher:', error)
      return { valid: false, reason: 'Lỗi kiểm tra voucher' }
    }
  }

  // Record voucher usage (handled automatically when booking is created)
  static async recordVoucherUsage(userId, voucherCode, bookingId) {
    // Voucher usage is now tracked through bookings table
    // No need for separate voucherUsage table
    return { success: true }
  }

  // Get user's voucher usage history
  static async getUserVoucherHistory(userId) {
    try {
      const bookingsRes = await axios.get(`http://localhost:8080/api/bookings/user/${userId}`)
      return bookingsRes.data
        .filter(b => b.voucherCode)
        .map(b => ({
          id: b.id,
          userId: b.userId,
          voucherCode: b.voucherCode,
          bookingId: b.id,
          usedAt: b.createdAt
        }))
    } catch (error) {
      console.error('Error getting voucher history:', error)
      return []
    }
  }

  // Get available vouchers for a user
  static async getAvailableVouchersForUser(userId) {
    try {
      const vouchersRes = await axios.get('http://localhost:8080/api/vouchers')
      const allVouchers = vouchersRes.data.filter(v => v.isActive && new Date(v.validTo) >= new Date())
      
      const availableVouchers = []
      
      for (const voucher of allVouchers) {
        const validation = await this.canUserUseVoucher(userId, voucher.code)
        if (validation.valid) {
          availableVouchers.push({
            ...voucher,
            remainingUses: voucher.usageLimit - (voucher.usedCount || 0)
          })
        } else {
          // Include voucher with restriction reason for UI display
          availableVouchers.push({
            ...voucher,
            remainingUses: voucher.usageLimit - (voucher.usedCount || 0),
            restricted: true,
            restrictionReason: validation.reason
          })
        }
      }
      
      return availableVouchers
    } catch (error) {
      console.error('Error getting available vouchers:', error)
      return []
    }
  }

  // Format voucher display text
  static getVoucherDisplayInfo(voucher) {
    const restrictions = []
    
    // Check oneTimePerUser
    if (voucher.oneTimePerUser) {
      restrictions.push('Mỗi tài khoản 1 lần')
    }

    if (voucher.newUsersOnly) {
      restrictions.push(`Chỉ dành cho thành viên mới (trong vòng ${voucher.daysAfterRegistration || 7} ngày)`)
    }
    
    if (voucher.weekendOnly) {
      restrictions.push('Chỉ áp dụng cuối tuần (T7-CN)')
    }
    
    if (voucher.minSeats > 0) {
      restrictions.push(`Tối thiểu ${voucher.minSeats} ghế`)
    }
    
    if (voucher.minOrderValue > 0) {
      restrictions.push(`Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ`)
    }

    return {
      ...voucher,
      restrictionText: restrictions.join(' • ')
    }
  }
}

export default VoucherValidator