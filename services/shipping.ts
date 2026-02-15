import { ShippingMethod, ShippingInfo, ShippingStep } from '../types';

/**
 * LƯU Ý KỸ THUẬT:
 * Trong thực tế, các hàm này sẽ gọi đến API của Viettel Post, GHN hoặc GHTK.
 * Do yêu cầu về bảo mật (API Key) và CORS, thông thường sẽ gọi qua một Proxy Backend.
 * Dưới đây là logic giả lập kết quả trả về từ API.
 */

export const ShippingService = {
  track: async (carrier: ShippingMethod, trackingNumber: string): Promise<ShippingInfo | null> => {
    if (!trackingNumber) return null;

    // Giả lập độ trễ mạng
    await new Promise(resolve => setTimeout(resolve, 800));

    // Logic giả lập trạng thái dựa trên số vận đơn (demo)
    const isDelivered = trackingNumber.toLowerCase().includes('done');
    const isPickedUp = trackingNumber.length > 5;

    const mockSteps: ShippingStep[] = [
      {
        status: 'Đã tiếp nhận',
        location: 'Điểm gửi hàng',
        time: '2024-03-20 09:00',
        description: 'Bưu cục đã nhận hàng từ người gửi'
      }
    ];

    if (isPickedUp) {
      mockSteps.push({
        status: 'Đang vận chuyển',
        location: 'Kho trung chuyển nội tỉnh',
        time: '2024-03-20 14:30',
        description: 'Đang rời kho phân loại'
      });
    }

    if (isDelivered) {
      mockSteps.push({
        status: 'Đã giao hàng',
        location: 'Địa chỉ người nhận',
        time: '2024-03-21 10:15',
        description: 'Người nhận đã ký xác nhận'
      });
    }

    const lastStep = mockSteps[mockSteps.length - 1];

    return {
      carrier,
      trackingNumber,
      currentStatus: lastStep.status,
      lastUpdate: lastStep.time,
      steps: mockSteps.reverse()
    };
  }
};