import "dotenv/config";
import { normalizePhone } from "@meili/shared";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { generateTempPassword, hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

// Content Brief §1 — the one real contact number on file today.
const FIRST_ADMIN_PHONE = normalizePhone("020 54699236");
const FIRST_ADMIN_NAME = "ນາງ ໄຂ່ມຸກ ຖາວົງ";

// Config keys from Backend Design Document §2. Every value here is meant to
// be edited from /admin/config later — this is only the starting point.
const CONFIG: Record<string, { value: string; description: string }> = {
  points_per_kg: { value: "1", description: "แต้มที่ได้รับต่อน้ำหนัก 1 กก." },
  min_weight_kg: { value: "3", description: "น้ำหนักขั้นต่ำที่เริ่มได้แต้ม (กก.)" },
  discount_cap_pct: { value: "0.15", description: "เพดานส่วนลดจากแต้มต่อบิล (15%)" },
  point_value: { value: "100", description: "มูลค่า 1 แต้ม = กีบ" },
  points_expiry_month: { value: "12", description: "เดือนที่แต้มหมดอายุทุกปี" },
  points_expiry_day: { value: "31", description: "วันที่แต้มหมดอายุทุกปี" },
  referral_bonus_referrer: { value: "50", description: "แต้มที่ผู้ชวนได้รับทันที" },
  referral_bonus_referee: { value: "20", description: "แต้มที่ผู้ถูกชวนได้รับ (ล็อกไว้ก่อน)" },
  referee_unlock_threshold_kg: { value: "5", description: "น้ำหนักสะสมที่ต้องส่งครบเพื่อปลดล็อกแต้ม referee" },
  max_accounts_per_device: { value: "2", description: "จำนวนบัญชีสูงสุดต่ออุปกรณ์ก่อน flag fraud" },
  whatsapp_provider: { value: "mock", description: "ผู้ให้บริการส่ง WhatsApp: mock | meta_cloud | webhook" },
};

// Content Brief §4 — starting-rate table (reference only, real price is set
// by staff after weigh-in).
const RATES = [
  { key: "general_small", nameLo: "ສິນຄ້າທົ່ວໄປ ຂະໜາດນ້ອຍ", nameZh: "普货 小件", nameEn: "General cargo · small", price: "19000", currency: "LAK", unit: "per_kg", sortOrder: 1 },
  { key: "general_large", nameLo: "ສິນຄ້າທົ່ວໄປ ຂະໜາດໃຫຍ່", nameZh: "普货 大件", nameEn: "General cargo · large", price: "980", currency: "CNY", unit: "per_cbm", sortOrder: 2 },
  { key: "electronics", nameLo: "ເຄື່ອງໃຊ້ໄຟຟ້າຂະໜາດໃຫຍ່", nameZh: "大型电器", nameEn: "Large electronics", price: "1000", currency: "CNY", unit: "per_cbm", sortOrder: 3 },
  { key: "chemical", nameLo: "ນ້ຳຢາເຄມີ (ຄິດເປັນກ່ອງ)", nameZh: "化学品（按箱计）", nameEn: "Chemicals (per box)", price: "1100", currency: "CNY", unit: "per_cbm", sortOrder: 4 },
  { key: "heavy", nameLo: "ສິນຄ້າຂອງໜັກ", nameZh: "重货", nameEn: "Heavy cargo", price: "14000", currency: "LAK", unit: "per_ton", sortOrder: 5 },
];

// Content Brief §6 — 5 news categories.
const NEWS_CATEGORIES = [
  { key: "company", nameLo: "ຂ່າວບໍລິສັດ", nameZh: "公司新闻", nameEn: "Company news" },
  { key: "logistics", nameLo: "ຂ່າວໂລຈິສຕິກ", nameZh: "物流新闻", nameEn: "Logistics news" },
  { key: "border", nameLo: "ຂ່າວດ່ານຊາຍແດນ", nameZh: "边境口岸新闻", nameEn: "Border crossing news" },
  { key: "china_holiday", nameLo: "ວັນຢຸດຈີນ", nameZh: "中国假期", nameEn: "China holidays" },
  { key: "import_tax", nameLo: "ພາສີນຳເຂົ້າ", nameZh: "进口关税", nameEn: "Import tax" },
];

// Content Brief §7 — 7 FAQ categories (A–G).
const FAQ_CATEGORIES = [
  { key: "shipping", nameLo: "ບໍລິການຂົນສົ່ງ", nameZh: "运输服务", nameEn: "Shipping service", sortOrder: 1 },
  { key: "pricing", nameLo: "ລາຄາ/ຄ່າຂົນສົ່ງ", nameZh: "价格/运费", nameEn: "Pricing / freight cost", sortOrder: 2 },
  { key: "tracking", nameLo: "ການຕິດຕາມພັດສະດຸ", nameZh: "包裹跟踪", nameEn: "Parcel tracking", sortOrder: 3 },
  { key: "payment", nameLo: "ການຊຳລະເງິນ", nameZh: "付款", nameEn: "Payment", sortOrder: 4 },
  { key: "account", nameLo: "ບັນຊີສະມາຊິກ", nameZh: "会员账户", nameEn: "Membership account", sortOrder: 5 },
  { key: "other", nameLo: "ອື່ນໆ/ຕິດຕໍ່", nameZh: "其他/联系方式", nameEn: "Other / contact", sortOrder: 6 },
  { key: "points", nameLo: "ລະບົບສະສົມແຕ້ມ", nameZh: "积分系统", nameEn: "Points programme", sortOrder: 7 },
];

// Backend Design Document §5 — 10 notification templates. Copy is a
// placeholder pending real 3-language translation per Content Brief §0.1.
const NOTIFICATION_TEMPLATES = [
  { key: "notif_pending_pickup", title: "มีบิลลาวใหม่ในบัญชีของคุณ" },
  { key: "notif_picked_up", title: "รับสินค้าจากจีนแล้ว" },
  { key: "notif_in_transit_origin", title: "พัสดุถูกส่งออกจากจีนแล้ว" },
  { key: "notif_arrived_branch", title: "พัสดุถึงสาขาแล้ว" },
  { key: "notif_arrived_lao_warehouse", title: "พัสดุถึงคลังลาวแล้ว กำลังคำนวณค่าขนส่ง" },
  { key: "notif_priced_awaiting_payment", title: "คิดค่าขนส่งเสร็จแล้ว รอชำระเงิน" },
  { key: "notif_paid_awaiting_pickup", title: "ได้รับการชำระเงินแล้ว กรุณารับสินค้า" },
  { key: "notif_delivered", title: "ส่งมอบสินค้าเรียบร้อยแล้ว" },
  { key: "notif_referral_unlocked", title: "แต้ม referral ปลดล็อกแล้ว" },
  { key: "notif_news_broadcast", title: "มีข่าวสารใหม่จาก MEILI EXPRESS" },
];

// Content Brief §6 — "ใส่ตัวอย่างหมวดละ 2 ข่าว (placeholder)". Admin can
// edit/replace all of this from the CMS once Step 7 ships.
const NEWS_ARTICLES = [
  {
    categoryKey: "company",
    titleLo: "ເປີດໃຫ້ບໍລິການສາງໃໝ່ ບ້ານຝາຍ",
    titleZh: "板法村新仓库启用",
    titleEn: "New Ban Fai warehouse now open",
    bodyLo: "MEILI EXPRESS ຂະຫຍາຍພື້ນທີ່ສາງສິນຄ້າ ບ້ານຝາຍ ເມືອງໄຊເສດຖາ ເພື່ອຮອງຮັບປະລິມານພັດສະດຸທີ່ເພີ່ມຂຶ້ນ.",
    bodyZh: "美丽快运扩建万象赛色塔县板法村仓库，以应对包裹量的增长。",
    bodyEn: "MEILI EXPRESS has expanded its Ban Fai warehouse in Saysettha District to keep up with growing parcel volume.",
  },
  {
    categoryKey: "company",
    titleLo: "ທີມງານ MEILI EXPRESS ພ້ອມໃຫ້ບໍລິການ",
    titleZh: "美丽快运团队随时为您服务",
    titleEn: "The MEILI EXPRESS team is ready to help",
    bodyLo: "ຕິດຕໍ່ທີມງານຜ່ານ WhatsApp ຫຼື WeChat ໄດ້ທຸກມື້ ສຳລັບຄຳປຶກສາການສັ່ງເຄື່ອງ.",
    bodyZh: "如需订购咨询，欢迎随时通过 WhatsApp 或微信联系我们的团队。",
    bodyEn: "Reach the team on WhatsApp or WeChat any day for advice on ordering goods.",
  },
  {
    categoryKey: "logistics",
    titleLo: "ຕາຕະລາງລົດອອກ ເດືອນນີ້",
    titleZh: "本月发车时刻表",
    titleEn: "This month's departure schedule",
    bodyLo: "ລົດບັນທຸກຄອນເທນເນີອອກຈາກຈີນເປັນປະຈຳທຸກອາທິດ ຕິດຕາມກຳນົດການຜ່ານໜ້າຕິດຕາມພັດສະດຸ.",
    bodyZh: "集装箱卡车每周定期从中国发车，具体时间请见包裹追踪页面。",
    bodyEn: "Container trucks depart China on a regular weekly schedule — check the tracking page for specifics.",
  },
  {
    categoryKey: "logistics",
    titleLo: "ຄຳແນະນຳການຫຸ້ມຫໍ່ສິນຄ້າ",
    titleZh: "包装建议",
    titleEn: "Packing tips for your shipment",
    bodyLo: "ຫຸ້ມຫໍ່ສິນຄ້າໃຫ້ແໜ້ນຫນາ ໂດຍສະເພາະສິນຄ້າແຕກງ່າຍ ເພື່ອຄວາມປອດໄພຕະຫຼອດເສັ້ນທາງ.",
    bodyZh: "请务必将货物（尤其是易碎品）包装牢固，确保运输全程安全。",
    bodyEn: "Pack goods securely, especially fragile items, to keep them safe for the whole journey.",
  },
  {
    categoryKey: "border",
    titleLo: "ສະຖານະການດ່ານຊາຍແດນປົກກະຕິ",
    titleZh: "边境口岸通关正常",
    titleEn: "Border crossing operating normally",
    bodyLo: "ດ່ານຊາຍແດນຈີນ-ລາວ ດຳເນີນງານປົກກະຕິ ບໍ່ມີການຊັກຊ້າພິເສດໃນອາທິດນີ້.",
    bodyZh: "本周中老边境口岸通关正常，无特殊延误。",
    bodyEn: "The China–Laos border crossing is operating normally this week with no special delays.",
  },
  {
    categoryKey: "border",
    titleLo: "ເອກະສານທີ່ຕ້ອງກຽມພ້ອມ",
    titleZh: "需准备的文件",
    titleEn: "Documents to have ready",
    bodyLo: "ລູກຄ້າທີ່ສັ່ງເຄື່ອງປະລິມານຫຼາຍ ຄວນກຽມໃບບິນສັ່ງຊື້ໄວ້ລ່ວງໜ້າ ເພື່ອຄວາມສະດວກໃນການຜ່ານດ່ານ.",
    bodyZh: "订购大宗货物的客户请提前准备好购物清单，以便顺利通关。",
    bodyEn: "Customers ordering in bulk should have their purchase invoices ready ahead of time for a smoother crossing.",
  },
  {
    categoryKey: "china_holiday",
    titleLo: "ວັນຢຸດຕຸດຫງວນ 2026",
    titleZh: "2026年中秋节假期",
    titleEn: "2026 Mid-Autumn Festival holiday",
    bodyLo: "ໂຮງງານ ແລະ ຄັງສິນຄ້າຈີນຫຼາຍແຫ່ງຢຸດພັກວັນຕຸດຫງວນ ອາດເຮັດໃຫ້ການຈັດສົ່ງຊັກຊ້າກວ່າປົກກະຕິ.",
    bodyZh: "中国多地工厂及仓库将在中秋节期间放假，发货时间可能较平时延迟。",
    bodyEn: "Many factories and warehouses in China close for Mid-Autumn Festival — dispatch may run slower than usual.",
  },
  {
    categoryKey: "china_holiday",
    titleLo: "ວັນຢຸດຊາດຈີນ 1 ຕຸລາ",
    titleZh: "十一国庆假期",
    titleEn: "China National Day holiday (Oct 1)",
    bodyLo: "ວັນຢຸດຊາດຈີນເລີ່ມຕົ້ນຕົ້ນເດືອນຕຸລາ ຮ້ານຄ້າ ແລະ ໂຮງງານສ່ວນຫຼາຍປິດຊົ່ວຄາວ.",
    bodyZh: "十一国庆假期从十月初开始，大部分商家和工厂将暂时停业。",
    bodyEn: "China's National Day holiday starts in early October — most shops and factories close temporarily.",
  },
  {
    categoryKey: "import_tax",
    titleLo: "ຂໍ້ມູນພາສີນຳເຂົ້າເບື້ອງຕົ້ນ",
    titleZh: "进口关税基本信息",
    titleEn: "Import tax — the basics",
    bodyLo: "ອັດຕາພາສີແຕກຕ່າງກັນຕາມປະເພດສິນຄ້າ ສອບຖາມທີມງານກ່ອນສັ່ງເຄື່ອງປະລິມານຫຼາຍ.",
    bodyZh: "关税税率因货物类型而异，大宗订购前建议先咨询我们的团队。",
    bodyEn: "Tax rates vary by cargo type — check with the team before ordering in bulk.",
  },
  {
    categoryKey: "import_tax",
    titleLo: "ສິນຄ້າທີ່ຕ້ອງລະວັງເລື່ອງພາສີ",
    titleZh: "需特别注意关税的货物",
    titleEn: "Cargo categories to watch for tax",
    bodyLo: "ເຄື່ອງໃຊ້ໄຟຟ້າ ແລະ ສິນຄ້າມູນຄ່າສູງ ອາດມີການກວດສອບເພີ່ມເຕີມທີ່ດ່ານ.",
    bodyZh: "电器及高价值货物在通关时可能需要额外查验。",
    bodyEn: "Electronics and high-value goods may face extra checks at the border.",
  },
];

// 4 example testimonials — Component Spec's ReviewGrid is CMS-managed from
// Step 7 onward; these are just seed placeholders.
const REVIEWS = [
  { authorName: "ລູກຄ້າ A", stars: 5, quoteLo: "ບໍລິການດີ ຕິດຕາມພັດສະດຸໄດ້ງ່າຍ", quoteZh: "服务很好，包裹追踪方便", quoteEn: "Great service, easy to track my parcel." },
  { authorName: "ລູກຄ້າ B", stars: 5, quoteLo: "ລາຄາຍຸຕິທຳ ສົ່ງໄວ", quoteZh: "价格公道，发货快", quoteEn: "Fair pricing and fast dispatch." },
  { authorName: "ລູກຄ້າ C", stars: 4, quoteLo: "ພະນັກງານໃຫ້ຄຳປຶກສາດີ", quoteZh: "客服建议很有帮助", quoteEn: "Staff gave helpful advice on my order." },
  { authorName: "ລູກຄ້າ D", stars: 5, quoteLo: "ໃຊ້ບໍລິການເປັນປະຈຳ ໄວ້ໃຈໄດ້", quoteZh: "长期使用，值得信赖", quoteEn: "A regular customer — reliable every time." },
];

// FAQ copy adapted from Content Brief §7's summary points (the full
// 19-question doc wasn't provided). Lao needs native-speaker QA per §0.3.
const FAQ_ITEMS = [
  { categoryKey: "shipping", sortOrder: 1, questionLo: "ມີບໍລິການຂົນສົ່ງທາງລົດໄຟ ຫຼື ທາງອາກາດບໍ?", questionZh: "有火车或空运服务吗？", questionEn: "Do you offer rail or air freight?", answerLo: "ບໍ່ມີ. ພວກເຮົາໃຫ້ບໍລິການສະເພາະຂົນສົ່ງດ້ວຍລົດບັນທຸກຄອນເທນເນີເສັ້ນທາງຈີນ-ລາວເທົ່ານັ້ນ.", answerZh: "没有。我们仅提供中老线路的集装箱卡车运输服务。", answerEn: "No — we only offer container-truck freight on the China–Laos route." },
  { categoryKey: "pricing", sortOrder: 1, questionLo: "ຄິດໄລ່ຄ່າຂົນສົ່ງແນວໃດ?", questionZh: "运费如何计算？", questionEn: "How is the freight fee calculated?", answerLo: "ລູກຄ້າຄິດໄລ່ລາຄາເອງບໍ່ໄດ້. ພະນັກງານຈະຊັ່ງນ້ຳໜັກ/ວັດຂະໜາດ ແລະ ແຈ້ງລາຄາຈິງຫຼັງສິນຄ້າຮອດສາງລາວ.", answerZh: "客户无法自行计算价格。工作人员会在货物到达老挝仓库后称重/测量并告知实际价格。", answerEn: "You can't calculate it yourself — staff weigh/measure the cargo once it reaches the Laos warehouse and confirm the real price then." },
  { categoryKey: "pricing", sortOrder: 2, questionLo: "ມີໜ້າຂໍໃບສະເໜີລາຄາລ່ວງໜ້າບໍ?", questionZh: "有提前报价单可以申请吗？", questionEn: "Is there a page to request a quote in advance?", answerLo: "ບໍ່ມີ. ລາຄາຈິງຄິດໄລ່ໄດ້ພຽງຫຼັງສິນຄ້າຮອດຄັງ ແລະ ຊັ່ງນ້ຳໜັກ/ວັດຂະໜາດແລ້ວເທົ່ານັ້ນ.", answerZh: "没有。实际价格只能在货物到达仓库并完成称重/测量后才能确定。", answerEn: "No — the real price can only be set after the goods arrive and are weighed/measured." },
  { categoryKey: "tracking", sortOrder: 1, questionLo: "ຕິດຕາມພັດສະດຸແນວໃດ?", questionZh: "如何追踪包裹？", questionEn: "How do I track my shipment?", answerLo: "ປ້ອນເລກບິນລາວທີ່ໜ້າຕິດຕາມພັດສະດຸ ຫຼື ໃຊ້ລິງກ໌ເຊື່ອມລະບົບຂົນສົ່ງຈີນ.", answerZh: "在包裹追踪页面输入老挝单号，或使用连接中国物流系统的链接。", answerEn: "Enter your Lao waybill number on the tracking page, or use the link to the Chinese carrier's own system." },
  { categoryKey: "payment", sortOrder: 1, questionLo: "ຊຳລະເງິນແນວໃດ?", questionZh: "如何付款？", questionEn: "How do I pay?", answerLo: "ໂອນຜ່ານທະນາຄານດ້ວຍ QR Code ທີ່ພະນັກງານສົ່ງທາງ WhatsApp ເທົ່ານັ້ນ ຍັງບໍ່ມີການຊຳລະອອນລາຍຜ່ານເວັບໄຊທ໌.", answerZh: "仅通过工作人员经 WhatsApp 发送的银行 QR 码转账付款，目前网站暂不支持在线支付。", answerEn: "Bank transfer via a QR code staff send you on WhatsApp only — there's no online payment on the site yet." },
  { categoryKey: "account", sortOrder: 1, questionLo: "ສະໝັກສະມາຊິກຕ້ອງໃຊ້ອີເມວບໍ?", questionZh: "注册会员需要邮箱吗？", questionEn: "Do I need an email to register?", answerLo: "ບໍ່ຈຳເປັນ. ສະໝັກດ້ວຍເບີໂທລະສັບເປັນຫຼັກ ບໍ່ບັງຄັບອີເມວ.", answerZh: "不需要。注册以手机号为主，邮箱为选填。", answerEn: "No — registration is phone-based; email is optional." },
  { categoryKey: "points", sortOrder: 1, questionLo: "ແຕ້ມສະສົມໄດ້ມາແນວໃດ?", questionZh: "积分如何获得？", questionEn: "How do I earn points?", answerLo: "ໄດ້ 1 ແຕ້ມຕໍ່ 1 ກກ. ເມື່ອສົ່ງສິນຄ້າຄົບ 3 ກກ.ຂຶ້ນໄປ.", answerZh: "每发货 1 公斤获得 1 积分，需满 3 公斤起算。", answerEn: "You earn 1 point per kg shipped, once a shipment reaches at least 3 kg." },
  { categoryKey: "points", sortOrder: 2, questionLo: "ຊວນໝູ່ໄດ້ແຕ້ມເທົ່າໃດ?", questionZh: "推荐好友能得多少积分？", questionEn: "How many points do I get for referrals?", answerLo: "ຜູ້ຊວນໄດ້ 50 ແຕ້ມທັນທີ ຜູ້ຖືກຊວນໄດ້ 20 ແຕ້ມ ປົດລັອກເມື່ອສົ່ງຄົບ 5 ກກ.", answerZh: "推荐人立即获得 50 积分，被推荐人获得 20 积分（累计发货满 5 公斤后解锁）。", answerEn: "The referrer gets 50 points immediately; the new customer gets 20 points, unlocked once they've shipped 5 kg total." },
];

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

// A few demo shipments spanning the confirmed 7-step flow, for exercising
// the public tracking page during Batch 1 development.
const TEST_SHIPMENTS = [
  {
    billNumber: "LA-TEST-0001",
    origin: "Guangzhou, China",
    destination: "Vientiane, Laos",
    weightKg: "12.4",
    productType: "general_small",
    status: "delivered" as const,
    receivedDate: daysAgo(20),
    estimatedDelivery: daysAgo(5),
    actualDelivery: daysAgo(4),
    price: "235600",
    history: [
      { status: "received_from_china" as const, location: "Guangzhou warehouse", daysAgoOffset: 20 },
      { status: "in_transit" as const, location: "En route", daysAgoOffset: 17 },
      { status: "arrived_lao_warehouse" as const, location: "Vientiane warehouse", daysAgoOffset: 10 },
      { status: "arrived_branch" as const, location: "Ban Fai branch", daysAgoOffset: 8 },
      { status: "priced_awaiting_payment" as const, location: "Ban Fai branch", daysAgoOffset: 7 },
      { status: "paid_awaiting_pickup" as const, location: "Ban Fai branch", daysAgoOffset: 6 },
      { status: "delivered" as const, location: "Ban Fai branch", daysAgoOffset: 4 },
    ],
  },
  {
    billNumber: "LA-TEST-0002",
    origin: "Guangzhou, China",
    destination: "Vientiane, Laos",
    weightKg: null,
    productType: "electronics",
    status: "in_transit" as const,
    receivedDate: daysAgo(3),
    estimatedDelivery: daysFromNow(7),
    actualDelivery: null,
    price: null,
    history: [
      { status: "received_from_china" as const, location: "Guangzhou warehouse", daysAgoOffset: 3 },
      { status: "in_transit" as const, location: "En route", daysAgoOffset: 1 },
    ],
  },
];

async function main() {
  for (const [configKey, { value, description }] of Object.entries(CONFIG)) {
    await prisma.systemConfig.upsert({
      where: { configKey },
      update: {},
      create: { configKey, configValue: value, description },
    });
  }

  for (const rate of RATES) {
    await prisma.shippingRate.upsert({
      where: { key: rate.key },
      update: {},
      create: rate,
    });
  }

  for (const cat of NEWS_CATEGORIES) {
    await prisma.newsCategory.upsert({
      where: { key: cat.key },
      update: {},
      create: cat,
    });
  }

  for (const cat of FAQ_CATEGORIES) {
    await prisma.faqCategory.upsert({
      where: { key: cat.key },
      update: {},
      create: cat,
    });
  }

  for (const tpl of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { templateKey: tpl.key },
      update: {},
      create: {
        templateKey: tpl.key,
        title: tpl.title,
        bodyWeb: tpl.title,
        bodyWhatsapp: tpl.title,
      },
    });
  }

  // Idempotent on purpose: re-running seed must never regenerate/reset a
  // temp password the admin has already changed.
  const existingAdmin = await prisma.staff.findUnique({ where: { phone: FIRST_ADMIN_PHONE } });
  if (!existingAdmin) {
    const tempPassword = generateTempPassword();
    await prisma.staff.create({
      data: {
        fullName: FIRST_ADMIN_NAME,
        phone: FIRST_ADMIN_PHONE,
        passwordHash: await hashPassword(tempPassword),
        role: "admin",
        isTempPassword: true,
      },
    });
    console.log("─".repeat(60));
    console.log("Created first admin account:");
    console.log(`  phone:         ${FIRST_ADMIN_PHONE}`);
    console.log(`  temp password: ${tempPassword}`);
    console.log("  (must be changed on first login — save this now, it will not be shown again)");
    console.log("─".repeat(60));
  } else {
    console.log(`Admin ${FIRST_ADMIN_PHONE} already exists — skipped.`);
  }

  await prisma.teamMember.upsert({
    where: { id: "seed-admin" },
    update: {},
    create: {
      id: "seed-admin",
      nameLo: "ນາງ ໄຂ່ມຸກ ຖາວົງ",
      nameZh: "Khaimouk Thavong",
      nameEn: "Ms. Khaimouk Thavong",
      roleLo: "ຜູ້ດູແລລະບົບ",
      roleZh: "系统管理员",
      roleEn: "Administrator",
      sortOrder: 1,
    },
  });

  const newsCategoriesByKey = Object.fromEntries((await prisma.newsCategory.findMany()).map((c) => [c.key, c.id]));
  for (const article of NEWS_ARTICLES) {
    const { categoryKey, ...rest } = article;
    const existing = await prisma.newsArticle.findFirst({ where: { titleEn: rest.titleEn } });
    if (!existing) {
      await prisma.newsArticle.create({
        data: { ...rest, categoryId: newsCategoriesByKey[categoryKey], publishedAt: new Date(), isPublished: true },
      });
    }
  }

  for (const review of REVIEWS) {
    const existing = await prisma.review.findFirst({ where: { quoteEn: review.quoteEn } });
    if (!existing) {
      await prisma.review.create({ data: { ...review, status: "approved" } });
    }
  }

  const faqCategoriesByKey = Object.fromEntries((await prisma.faqCategory.findMany()).map((c) => [c.key, c.id]));
  for (const item of FAQ_ITEMS) {
    const { categoryKey, ...rest } = item;
    const existing = await prisma.faqItem.findFirst({ where: { questionEn: rest.questionEn } });
    if (!existing) {
      await prisma.faqItem.create({
        data: { ...rest, categoryId: faqCategoriesByKey[categoryKey], isPublished: true, needsReview: true },
      });
    }
  }

  const demoUser = await prisma.user.upsert({
    where: { phone: "02000000000" },
    update: {},
    create: { accountId: "DEMOUSER", phone: "02000000000", fullName: "Demo Customer" },
  });
  for (const shipment of TEST_SHIPMENTS) {
    const { history, ...rest } = shipment;
    const existing = await prisma.shipment.findUnique({ where: { billNumber: shipment.billNumber } });
    if (!existing) {
      await prisma.shipment.create({
        data: {
          ...rest,
          userId: demoUser.id,
          trackingHistory: {
            create: history.map((h) => ({ status: h.status, location: h.location, changedAt: daysAgo(h.daysAgoOffset) })),
          },
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
