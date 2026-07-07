import axios from 'axios'

// Voucher validation utility functions
export class VoucherValidator {
  
  // Check if user can use a specific voucher
  static async canUserUseVoucher(userId, voucherCode) {
    try {
      // Get voucher details
      const voucherRes = await axios.get(`http://localhost:3001/vouchers?code=${voucherCode}`)
      const voucher = voucherRes.data[0]
      
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
      const userRes = await axios.get(`http://localhost:3001/users/${userId}`)
      const user = userRes.data
      
      if (!user) {
        return { valid: false, reason: 'Người dùng không tồn tại' }
      }

      // Check user-specific restrictions
      const userRestrictions = voucher.userRestrictions || {}
      
      // Check if user has already used this voucher (Global rule for all vouchers)
      const usageRes = await axios.get(`http://localhost:3001/voucherUsage?userId=${userId}&voucherCode=${voucherCode}`)
      if (usageRes.data.length > 0) {
        return { valid: false, reason: 'Bạn đã sử dụng voucher này rồi' }
      }

      // Check new user restrictions (WELCOME20)
      if (userRestrictions.newUsersOnly) {
        const registrationDate = new Date(user.createdAt || user.registrationDate || '2026-01-01')
        const daysSinceRegistration = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24))
        
        const maxDays = userRestrictions.daysAfterRegistration || 7;
        if (daysSinceRegistration > maxDays) {
          return { 
            valid: false, 
            reason: `Voucher chỉ dành cho tài khoản mới (trong vòng ${maxDays} ngày đăng ký)` 
          }
        }
      }

      // Check time restrictions (WEEKEND50)
      const timeRestrictions = voucher.timeRestrictions || {}
      if (timeRestrictions.weekendOnly) {
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

  // Record voucher usage
  static async recordVoucherUsage(userId, voucherCode, bookingId) {
    try {
      const usageRecord = {
        id: Date.now().toString(),
        userId,
        voucherCode,
        bookingId,
        usedAt: new Date().toISOString()
      }

      await axios.post('http://localhost:3001/voucherUsage', usageRecord)
      
      // Update voucher used count
      const voucherRes = await axios.get(`http://localhost:3001/vouchers?code=${voucherCode}`)
      const voucher = voucherRes.data[0]
      
      if (voucher) {
        await axios.patch(`http://localhost:3001/vouchers/${voucher.id}`, {
          usedCount: (voucher.usedCount || 0) + 1
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error recording voucher usage:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's voucher usage history
  static async getUserVoucherHistory(userId) {
    try {
      const res = await axios.get(`http://localhost:3001/voucherUsage?userId=${userId}`)
      return res.data
    } catch (error) {
      console.error('Error getting voucher history:', error)
      return []
    }
  }

  // Get available vouchers for a user
  static async getAvailableVouchersForUser(userId) {
    try {
      const vouchersRes = await axios.get('http://localhost:3001/vouchers')
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
    
    // Global restriction for all vouchers
    restrictions.push('Mỗi tài khoản 1 lần')

    if (voucher.userRestrictions?.newUsersOnly) {
      restrictions.push(`Chỉ dành cho thành viên mới (trong vòng ${voucher.userRestrictions.daysAfterRegistration || 7} ngày)`)
    }
    
    if (voucher.timeRestrictions?.weekendOnly) {
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