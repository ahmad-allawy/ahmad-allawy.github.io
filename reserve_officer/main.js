function formatArabicDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds % 86400 / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    const pluralRules = new Intl.PluralRules("ar");
    const units = [
        [days, { zero: "أيام", one: "يوم", two: "يومان", few: "أيام", many: "يومًا", other: "يومًا" }],
        [hours, { zero: "ساعات", one: "ساعة", two: "ساعتان", few: "ساعات", many: "ساعة", other: "ساعة" }],
        [minutes, { zero: "دقائق", one: "دقيقة", two: "دقيقتان", few: "دقائق", many: "دقيقة", other: "دقيقة" }],
        [seconds, { zero: "ثوانٍ", one: "ثانية", two: "ثانيتان", few: "ثوانٍ", many: "ثانية", other: "ثانية" }]
    ];

    return units
        .map(([value, labels]) => `${value.toLocaleString("ar-EG")} ${labels[pluralRules.select(value)]}`)
        .join("، ");
}

const military_date = new Date(2026, 3, 1);

var display_military_date = document.getElementById("military_date");

var display_aphorism = document.getElementById("aphorism");

const aphorisms = [

    "الطبلة يا رااعي",
    "بالعدااد إثنين",
    "حد إثنين ... إثنين",
    "انا زعلااان",
    "كلية الضباط الإحتياط .. جنبااان سلاااااا",
    "ياا معفن",
    "الدفعة 166 عندها سرعة استجابة عالية",
    "استرح وشرب ماية استرح"
];

function displayDate() {

    const elapsed = Math.max(0, Date.now() - military_date.getTime());
    const result = formatArabicDuration(elapsed);

    display_military_date.innerHTML = result;

}

function displayAphorism() {

    const randomIndex = Math.floor(Math.random() * aphorisms.length);

    display_aphorism.innerHTML = aphorisms[randomIndex];

}