// Mirrored from FlowCore frontend/shared/report-charts.ts (2026-11-05).
// The landing uses the same chart presets and aggregation with illustrative data.
const round = (value) => Math.round(value * 1e6) / 1e6;
const count = [{ key: "__count", label: "Yozuvlar", aggregate: "count" }];
function buildChart(report, spec) {
  const rows = spec.rows ?? report.sections.find((s) => s.id === spec.section)?.rows ?? [];
  const groups = /* @__PURE__ */ new Map();
  const empty = () => ({ sums: spec.series.map(() => 0), counts: spec.series.map(() => 0) });
  let records = 0;
  for (const row of rows) {
    const label = spec.group.map((key) => String(row[key] ?? "").trim() || "Ko\u2018rsatilmagan").join(" \xB7 ");
    if (spec.timeline && (!/^\d{4}-\d{2}-\d{2}$/.test(label) || label < report.from || label > report.to)) continue;
    const group = groups.get(label) || empty();
    spec.series.forEach((series, index) => {
      const value = series.aggregate === "count" ? 1 : row[series.key];
      if (typeof value !== "number" || !Number.isFinite(value)) return;
      group.sums[index] = (group.sums[index] || 0) + (series.negative ? Math.max(0, -value) : value);
      group.counts[index] = (group.counts[index] || 0) + 1;
    });
    groups.set(label, group);
    records++;
  }
  if (spec.timeline && records && /^\d{4}-\d{2}-\d{2}$/.test(report.from) && /^\d{4}-\d{2}-\d{2}$/.test(report.to)) {
    const first = Date.parse(report.from), last = Date.parse(report.to);
    if (Number.isFinite(first) && Number.isFinite(last) && last >= first && last - first <= 366 * 864e5) {
      for (let stamp = first; stamp <= last; stamp += 864e5) {
        const label = new Date(stamp).toISOString().slice(0, 10);
        if (!groups.has(label)) groups.set(label, empty());
      }
    }
  }
  const points = [...groups].map(([label, group]) => ({ label, values: spec.series.map((series, index) => series.aggregate === "mean" ? group.counts[index] ? round(group.sums[index] / group.counts[index]) : null : round(group.sums[index])) }));
  if (spec.timeline || spec.kind === "line") points.sort((a, b) => a.label.localeCompare(b.label));
  else points.sort((a, b) => Math.max(...b.values.map((v) => v ?? -Infinity)) - Math.max(...a.values.map((v) => v ?? -Infinity)));
  const hasNegative = points.some((point) => point.values.some((value) => value !== null && value < 0));
  const groupCount = points.length;
  const limit = spec.limit ?? (spec.kind === "donut" ? 6 : 10);
  if (!hasNegative && !spec.timeline && spec.kind === "donut" && points.length > limit && spec.series.length === 1) {
    const other = round(points.slice(limit - 1).reduce((sum, point) => sum + (point.values[0] || 0), 0));
    points.splice(limit - 1, points.length, { label: "Boshqalar", values: [other] });
  } else if (!spec.timeline && spec.kind !== "line") points.splice(limit);
  return { ...spec, points, groupCount, records, hasNegative };
}
function dashboardCharts(report) {
  const currency = report.metrics.find((m) => m.unit && !["%", "soat"].includes(m.unit))?.unit || "UZS";
  const money = (key, label) => ({ key, label });
  const spec = (id, title, section, group, series, kind = "bar", description = "", unit = "") => ({ id, title, section, group: [group], series, kind, description, unit });
  let specs = [];
  if (report.module === "crm") specs = [
    { ...spec("activity", "Savdo faolligi kunlar bo\u2018yicha", "leads", "updated", count, "line", "Leadlarning oxirgi yangilanish sanasi bo\u2018yicha; yangi leadlar soni emas.", "ta"), timeline: true },
    spec("pipeline-count", "Savdo bosqichlari", "pipeline", "stage", [{ key: "count", label: "Bitimlar" }], "donut", "Tanlangan davrdagi leadlarning joriy bosqichlari.", "ta"),
    spec("pipeline-value", "Bosqichlar bo\u2018yicha summa", "pipeline", "stage", [money("value", "Bitimlar qiymati")], "bar", "Eng katta qiymatga ega bosqichlar.", "UZS"),
    spec("sources", "Manbalar samaradorligi", "source", "name", [money("pipeline", "Ochiq bitimlar"), money("revenue", "Yutilgan bitimlar")], "bar", "Savdo imkoniyatlari va yutilgan summani solishtiring.", "UZS"),
    spec("owners", "Mas\u2019ullar natijalari", "owner", "name", [{ key: "count", label: "Leadlar" }, { key: "won", label: "Yutilgan" }], "bar", "Bir mas\u2019ulga tegishli leadlar va yutilgan bitimlar.", "ta"),
    spec("source-share", "Tushum manbalari ulushi", "source", "name", [money("revenue", "Yutilgan summa")], "donut", "Yutilgan bitimlar qiymati bo\u2018yicha.", "UZS")
  ];
  if (report.module === "wms") specs = [
    { ...spec("movement-trend", "Ombor harakatlari dinamikasi", "movements", "date", count, "line", "Kunlik harakatlar soni; turli birlikdagi miqdorlar qo\u2018shilmaydi.", "ta"), timeline: true },
    spec("warehouse-value", "Omborlardagi zaxira qiymati", "warehouses", "name", [money("value", "Zaxira qiymati")], "bar", "Davr oxiridagi qoldiq joriy narxlarda baholanadi.", "UZS"),
    spec("category-value", "Kategoriyalar ulushi", "categories", "category", [money("value", "Zaxira qiymati")], "donut", "Zaxira qiymatining kategoriyalar bo\u2018yicha taqsimoti.", "UZS"),
    spec("movement-types", "Harakat turlari", "movements", "type", count, "donut", "Kirim, chiqim va boshqa harakatlar soni.", "ta"),
    spec("warehouse-activity", "Omborlar faolligi", "warehouses", "name", [{ key: "movements", label: "Harakatlar" }], "bar", "Ko\u2018chirish jo\u2018natuvchi va qabul omborida ham hisoblanadi.", "ta"),
    spec("category-risk", "Kategoriyalarda zaxira holati", "categories", "category", [{ key: "products", label: "Mahsulot turlari" }, { key: "low", label: "Kam qolgan" }], "bar", "Qoldig\u2018i minimumgacha tushgan mahsulot turlari.", "ta")
  ];
  if (report.module === "erp") specs = [
    spec("order-status", "Buyurtmalar holati", "orders", "status", count, "donut", "Davrda oxirgi faolligi bo\u2018lgan buyurtmalarning joriy holati.", "ta"),
    spec("stage-load", "Bosqichlar yuklamasi", "tasks", "stageName", count, "bar", "Har bir bosqichdagi joriy va navbatdagi vazifalar soni.", "ta"),
    { ...spec("expenses-trend", "Qo\u2018shimcha xarajatlar dinamikasi", "expenses", "date", [money("actual", "Haqiqiy"), money("planned", "Reja")], "line", "Faqat tanlangan davr sanalaridagi qo\u2018shimcha xarajatlar; xomashyo kiritilmagan.", "UZS"), timeline: true },
    spec("product-cost", "Mahsulotlar bo\u2018yicha xarajatlar", "costs", "product", [money("planned", "Reja"), money("incurred", "Haqiqiy")], "bar", "Buyurtmalarning to\u2018liq qiymati; eski buyurtmalarda narxlar yetishmasligi mumkin.", "UZS"),
    spec("expense-share", "Xarajat toifalari ulushi", "expenses", "category", [money("actual", "Haqiqiy xarajat")], "donut", "Tanlangan buyurtmalardagi qo\u2018shimcha xarajatlar; xomashyosiz.", "UZS"),
    spec("stage-time", "Bosqichlarda vaqt sarfi", "tasks", "stageName", [{ key: "hours", label: "Reja" }, { key: "elapsed", label: "Sarflangan" }], "bar", "Ochiq bosqichlar uchun jami reja va joriy bosqichlarda sarflangan vaqt.", "soat"),
    { ...spec("defect-rates", "Mahsulotlar bo\u2018yicha brak ulushi", "defects", "product", [{ key: "rate", label: "Brak ulushi", aggregate: "mean" }], "bar", "Yakunlangan ishlab chiqarishdagi brak foizi.", "%"), group: ["product", "unit"] }
  ];
  if (report.module === "hr") specs = [
    spec("monthly-payroll", "Oylar bo\u2018yicha ish haqi", "months", "month", [money("total", "Ish haqi")], "line", "Yopilgan oylar saqlangan, ochiq oylar joriy stavkalarda hisoblangan.", currency),
    { ...spec("hours-trend", "Kunlik ish soatlari", "attendance", "date", [{ key: "hours", label: "Ishlangan soatlar" }], "line", "Barcha xodimlarning davomatdagi soatlari yig\u2018indisi.", "soat"), timeline: true },
    spec("employee-payroll", "Xodimlar bo\u2018yicha ish haqi", "payroll", "name", [money("total", "Ish haqi")], "bar", "Tanlangan oylardagi jami ish haqi.", currency),
    spec("bonus-deduction", "Bonus va ushlanmalar", "payroll", "name", [money("bonus", "Bonus"), money("deduction", "Ushlanma")], "bar", "Xodimlar bo\u2018yicha qo\u2018shimcha to\u2018lov va ushlanmalar.", currency),
    spec("employee-hours", "Xodimlarning ish soatlari", "attendance", "name", [{ key: "hours", label: "Soat" }], "bar", "Davomat ma\u2019lumotlari bo\u2018yicha.", "soat"),
    spec("payroll-status", "Vedomost holatlari", "months", "status", count, "donut", "Yopilgan va hisob-kitobdagi oylar soni.", "oy")
  ];
  if (report.module === "lms") specs = [
    { ...spec("payments-trend", "Kunlik tushum", "payments", "date", [money("amount", "Tushum")], "line", "Tanlangan davrdagi real to\u2018lovlar.", currency), timeline: true },
    spec("payment-methods", "To\u2018lov usullari ulushi", "payment-methods", "method", [money("amount", "Tushum")], "donut", "To\u2018lov summalari bo\u2018yicha taqsimot.", currency),
    { ...spec("student-debt", "Eng katta qarzdorliklar", "balances", "name", [{ key: "balance", label: "Qarzdorlik", negative: true }], "bar", "Davr oxiridagi hisoblar; oldindan to\u2018lov qarz hisoblanmaydi.", currency), rows: report.sections.find((s) => s.id === "balances")?.rows.filter((r) => typeof r.balance === "number" && r.balance < 0) || [] },
    spec("student-attendance", "O\u2018quvchilar davomati", "attendance", "name", [{ key: "present", label: "Kelgan" }, { key: "absent", label: "Kelmagan" }, { key: "excused", label: "Sababli" }], "bar", "Darslarda qayd etilgan davomat soni.", "ta"),
    spec("group-grades", "Guruhlar bo\u2018yicha natijalar", "grades", "group", [{ key: "percent", label: "O\u2018rtacha natija", aggregate: "mean" }], "bar", "Natijasi mavjud o\u2018quvchilarning oddiy o\u2018rtacha foizi; bahosizlar kiritilmaydi.", "%"),
    spec("student-payments", "O\u2018quvchilar bo\u2018yicha to\u2018lovlar", "payments", "student", [money("amount", "To\u2018langan")], "bar", "Tanlangan davrdagi jami to\u2018lovlar.", currency)
  ];
  if (report.module === "erp") {
    specs.push({ ...spec("material-availability", "Xomashyo ta\u2019minoti holati", "materials", "availability", count, "donut", "Ombor va xomashyo kesimidagi ehtiyoj satrlari. Miqdorlar turli birliklarda qo\u2018shilmaydi.", "tur"), rows: (report.sections.find((s) => s.id === "materials")?.rows || []).map((row) => ({ availability: typeof row.shortage === "number" && row.shortage > 0 ? "Yetishmovchilik bor" : "Zaxira yetarli" })) });
    const incomplete = report.sections.find((s) => s.id === "costs")?.rows.filter((row) => row.quality === "To\u2018liq emas").length || 0;
    const cost = specs.find((s) => s.id === "product-cost");
    if (cost && incomplete) cost.warning = `${incomplete} buyurtmada xomashyo narxi to\u2018liq emas. Xarajat summasi to\u2018liq tannarxni bildirmaydi.`;
  }
  return specs.map((s) => buildChart(report, s));
}
export {
  buildChart,
  dashboardCharts
};
