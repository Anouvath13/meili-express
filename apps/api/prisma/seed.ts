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
