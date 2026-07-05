// Danh mục tỉnh/thành theo quy hoạch mới (01/07/2025)
// 34 đơn vị hành chính cấp tỉnh

export const DISTRICT_CATEGORIES = {
  TP_TW: [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Hải Phòng",
    "Đà Nẵng",
    "Huế",
    "Cần Thơ"
  ],
  MIEN_BAC: [
    "Tuyên Quang",
    "Lào Cai",
    "Thái Nguyên",
    "Phú Thọ",
    "Bắc Ninh",
    "Hưng Yên",
    "Ninh Bình",
    "Quảng Trị",
    "Lai Châu",
    "Điện Biên",
    "Sơn La",
    "Lạng Sơn",
    "Cao Bằng",
    "Thanh Hóa",
    "Nghệ An",
    "Hà Tĩnh"
  ],
  MIEN_TRUNG: [
    "Quảng Ngãi",
    "Gia Lai",
    "Khánh Hòa",
    "Lâm Đồng",
    "Đắk Lắk"
  ],
  MIEN_NAM: [
    "Đồng Nai",
    "Tây Ninh",
    "Vĩnh Long",
    "Đồng Tháp",
    "An Giang",
    "Cà Mau"
  ]
};

export const CATEGORY_NAMES = {
  TP_TW: "Thành phố trực thuộc TW",
  MIEN_TRUNG: "Miền Trung & Tây Nguyên",
  MIEN_NAM: "Miền Nam",
  MIEN_BAC: "Miền Bắc"
};

// Ánh xạ tên tỉnh cũ → tỉnh mới (sáp nhập 01/07/2025)
export const PROVINCE_MIGRATION = {
  // Miền Bắc
  "Hà Giang": "Tuyên Quang",
  "Yên Bái": "Lào Cai",
  "Bắc Kạn": "Thái Nguyên",
  "Vĩnh Phúc": "Phú Thọ",
  "Bắc Giang": "Bắc Ninh",
  "Thái Bình": "Hưng Yên",
  "Hà Nam": "Ninh Bình",
  "Nam Định": "Ninh Bình",
  "Quảng Bình": "Quảng Trị",

  // Miền Trung & Tây Nguyên
  "Quảng Nam": "Đà Nẵng",
  "Kon Tum": "Quảng Ngãi",
  "Bình Định": "Gia Lai",
  "Ninh Thuận": "Khánh Hòa",
  "Đắk Nông": "Lâm Đồng",
  "Bình Thuận": "Lâm Đồng",
  "Phú Yên": "Đắk Lắk",

  // Miền Nam
  "Bình Dương": "TP. Hồ Chí Minh",
  "Bà Rịa - Vũng Tàu": "TP. Hồ Chí Minh",
  "Bà Rịa Vũng Tàu": "TP. Hồ Chí Minh",
  "Vũng Tàu": "TP. Hồ Chí Minh",
  "Bình Phước": "Đồng Nai",
  "Long An": "Tây Ninh",
  "Bến Tre": "Vĩnh Long",
  "Trà Vinh": "Vĩnh Long",
  "Tiền Giang": "Đồng Tháp",
  "Kiên Giang": "An Giang",
  "Bạc Liêu": "Cà Mau",

  // TP.HCM sáp nhập
  "Quận 2": "TP. Hồ Chí Minh",
  "Quận 9": "TP. Hồ Chí Minh",
  "Quận Thủ Đức": "TP. Hồ Chí Minh",
  "Thủ Đức": "TP. Hồ Chí Minh",
};

// Tên cũ hiển thị trên UI
export const PROVINCE_OLD_NAMES = {
  "Tuyên Quang": "cũ: Hà Giang",
  "Lào Cai": "cũ: Yên Bái",
  "Thái Nguyên": "cũ: Bắc Kạn",
  "Phú Thọ": "cũ: Vĩnh Phúc",
  "Bắc Ninh": "cũ: Bắc Giang",
  "Hưng Yên": "cũ: Thái Bình",
  "Ninh Bình": "cũ: Hà Nam, Nam Định",
  "Quảng Trị": "cũ: Quảng Bình",
  "Đà Nẵng": "cũ: Quảng Nam",
  "Quảng Ngãi": "cũ: Kon Tum",
  "Gia Lai": "cũ: Bình Định",
  "Khánh Hòa": "cũ: Ninh Thuận",
  "Lâm Đồng": "cũ: Đắk Nông, Bình Thuận",
  "Đắk Lắk": "cũ: Phú Yên",
  "TP. Hồ Chí Minh": "cũ: Bình Dương, Bà Rịa-Vũng Tàu",
  "Đồng Nai": "cũ: Bình Phước",
  "Tây Ninh": "cũ: Long An",
  "Vĩnh Long": "cũ: Bến Tre, Trà Vinh",
  "Đồng Tháp": "cũ: Tiền Giang",
  "An Giang": "cũ: Kiên Giang",
  "Cà Mau": "cũ: Bạc Liêu",
};

// Lấy tên hiển thị (có ghi chú tỉnh cũ)
export const getProvinceDisplay = (province) => {
  const old = PROVINCE_OLD_NAMES[province];
  return old ? `${province} (${old})` : province;
};

// Lấy tên tỉnh mới từ tên cũ
export const migrateProvince = (oldName) => {
  return PROVINCE_MIGRATION[oldName] || oldName;
};
