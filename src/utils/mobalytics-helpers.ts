// Helper: Chuyển tên hiển thị thành ID (Dr. Mundo -> dr-mundo)
export function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helper: Giả lập mapping tên sang Key hệ thống (Bạn nên có database riêng để map chuẩn hơn)
export function generateChampionKey(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
  return `TFT16_${cleanName}`; // Ví dụ: TFT16_DrMundo
}

export function generateItemKey(itemName: string): string {
  const cleanName = itemName.replace(/[^a-zA-Z0-9]/g, '');
  return `TFT_Item_${cleanName}`; // Ví dụ: TFT_Item_StatikkShiv
}

// Helper: Mapping tọa độ từ CSS Class của Mobalytics (Quan trọng nhất)
// Giả sử Mobalytics dùng class "hex-x-y" hoặc style "left/top"
export function parsePositionFromClass(className: string): { row: number; col: number } {
  // Logic này cần điều chỉnh tùy theo thực tế class của Mobalytics lúc inspect
  // Ví dụ class: "hex-4-2" (col 4, row 2)
  const match = className.match(/hex-(\d+)-(\d+)/);
  if (match) {
    return { col: parseInt(match[1], 10), row: parseInt(match[2], 10) };
  }
  // Default fallback nếu không tìm thấy
  return { row: 3, col: 0 };
}
