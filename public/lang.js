const translations = {
  ar: {
    subtitle: "يرجى تعبئة البيانات ليتم التواصل",
    name_ar: "الاسم*:",
    name_en: "Name*:",
    contact_ar: "رقم التواصل*:",
    contact_en: "Contact No.*:",
    city_ar: "المدينة:",
    city_en: "City:",
    opt1: "المشاركة في نمو العلامة التجارية",
    opt2: "الحصول على حق العلامة التجارية (فرنشايز)",
    submit: "إرسال"
  },
  en: {
    subtitle: "Please fill in your details so we can contact you",
    name_ar: "Name*:",
    name_en: "",
    contact_ar: "Contact No.*:",
    contact_en: "",
    city_ar: "City:",
    city_en: "",
    opt1: "Participate in brand growth",
    opt2: "Obtain franchise rights",
    submit: "Submit"
  },
  de: {
    subtitle: "Bitte füllen Sie Ihre Daten aus, damit wir Sie kontaktieren können",
    name_ar: "Name*:",
    name_en: "",
    contact_ar: "Telefonnummer*:",
    contact_en: "",
    city_ar: "Stadt:",
    city_en: "",
    opt1: "An der Markenentwicklung teilnehmen",
    opt2: "Franchise-Rechte erwerben",
    submit: "Senden"
  }
};

const langSelector = document.getElementById("languageSelector");

function setLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  const elements = document.querySelectorAll("[data-lang]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-lang");
    const text = translations[lang][key] || "";

    // ✅ تعديل خاص لزر الإرسال
    if (el.tagName === "INPUT" && el.type === "submit") {
      el.value = text;
    } else {
      el.textContent = text;
    }
  });
  localStorage.setItem("lang", lang);
  const languageInput = document.getElementById("languageInput");
  if (languageInput) languageInput.value = lang;
}

langSelector.addEventListener("change", (e) => {
  setLanguage(e.target.value);
});

const savedLang = localStorage.getItem("lang") || "ar";
langSelector.value = savedLang;
setLanguage(savedLang);
