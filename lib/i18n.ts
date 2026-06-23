export type Lang = "en" | "bg";

export const LANGS: Lang[] = ["en", "bg"];
export const DEFAULT_LANG: Lang = "en";

/** ชุดข้อความทั้งหมด (อังกฤษ / บัลแกเรีย) — อิงจากเว็บต้นแบบ Massage Corner Sofia */
export const dict = {
  en: {
    brand_tag: "Thai Massage & Spa",
    nav_about: "About",
    nav_services: "Services",
    nav_gallery: "Gallery",
    nav_prices: "Prices",
    nav_contact: "Contact",
    nav_book: "Book Now",

    hero_pre: "Traditional Thai Massage • Sofia, Bulgaria",
    hero_title_1: "Restore Your",
    hero_title_2: "Balance & Harmony",
    hero_sub:
      "Experience authentic Thai healing traditions combined with modern wellness techniques in the heart of Sofia.",
    hero_book: "Book a Session",
    hero_explore: "Explore Services",

    serv_label: "Our Services",
    serv_title: "Treatments Designed for You",
    serv_sub:
      "Each treatment is tailored to your needs — from traditional Thai techniques to modern spa therapies.",
    price_from: "from",
    per_session: "/ session",
    book_btn: "Book",
    price_label: "Price List",
    price_title: "Transparent Pricing",
    price_sub:
      "No hidden fees. Choose the duration that suits you — quality care at honest prices.",
    price_min: "min",

    gal_label: "Gallery",
    gal_title: "Inside Massage Corner",
    gal_sub:
      "Quiet corners designed for you to truly rest your body and mind.",

    video_label: "Watch",
    video_title: "A Moment of Calm",
    video_sub:
      "Take a glimpse of the experience that awaits you at Massage Corner Sofia.",

    about_label: "About Us",
    about_title: "Authentic Thai Wellness in Sofia",
    about_p1:
      "Welcome to Massage Corner — a serene haven of Thai healing arts located in the heart of Sofia. Our skilled therapists bring the ancient wisdom of traditional Thai medicine to every treatment.",
    about_p2:
      "We combine time-honored techniques with a warm, welcoming atmosphere to give you a truly restorative experience.",
    feat_certified: "Certified Thai Therapists",
    feat_oils: "Natural Oils & Herbs",
    feat_calm: "Calm & Serene Space",
    feat_flexible: "Flexible Appointment Times",

    cta_label: "Book Your Session",
    cta_title: "Ready to Relax?",
    cta_sub:
      "Reserve your appointment online in just a few steps. Our team will confirm your booking within 24 hours.",
    cta_btn: "Book Now",

    book_pre: "Book Your Session",
    book_title: "Reserve a Treatment",
    book_sub:
      "Choose a service, date and time that suits you, then fill in your contact details. Our team will confirm your booking.",

    f_service: "Service",
    f_date: "Date",
    f_time: "Time",
    f_name: "Full Name",
    f_phone: "Phone",
    f_notes: "Notes (optional)",
    f_submit: "Confirm Booking",
    f_submitting: "Saving…",
    f_required: "Please fill in all fields",
    name_ph: "e.g. Maria Ivanova",
    phone_ph: "+359 88 123 4567",
    notes_ph: "e.g. prefer a female therapist / lower back pain",

    slot_pick_date: "Select a date first…",
    slot_loading: "Checking availability…",
    slot_pick: "Select time…",
    slot_full: "Full",
    slot_all_full: "All time slots are full today. Please pick another date.",

    succ_title: "Booking Received!",
    succ_sub:
      "Thank you. We will confirm your appointment within 24 hours via email or phone.",
    succ_code: "Your booking code",
    succ_again: "Book Another",
    succ_home: "Back to Home",

    cont_label: "Contact Us",
    cont_title: "Find Us in Sofia",
    cont_address: "Address",
    cont_phone: "Phone",
    cont_hours: "Working Hours",
    cont_hours_val: "Monday – Sunday: 10:00 – 21:00",
    address_val: "15 Srebarna Str., Sofia 1407, Bulgaria",
    rights: "All rights reserved.",
    nav_home: "Home",
    admin_login: "Admin Sign In",
  },
  bg: {
    brand_tag: "Тайландски масаж и спа",
    nav_about: "За нас",
    nav_services: "Услуги",
    nav_gallery: "Галерия",
    nav_prices: "Цени",
    nav_contact: "Контакти",
    nav_book: "Резервирай",

    hero_pre: "Традиционен тайландски масаж • София, България",
    hero_title_1: "Възстанови своя",
    hero_title_2: "Баланс & Хармония",
    hero_sub:
      "Изживейте автентичните тайландски лечебни традиции в съчетание със съвременни уелнес техники в сърцето на София.",
    hero_book: "Резервирай час",
    hero_explore: "Виж услугите",

    serv_label: "Нашите услуги",
    serv_title: "Процедури, създадени за вас",
    serv_sub:
      "Всяка процедура е адаптирана към вашите нужди — от традиционни тайландски техники до модерни спа терапии.",
    price_from: "от",
    per_session: "/ сеанс",
    book_btn: "Резервирай",
    price_label: "Ценоразпис",
    price_title: "Прозрачно ценообразуване",
    price_sub:
      "Без скрити такси. Изберете продължителността, която ви устройва — качествена грижа на честни цени.",
    price_min: "мин",

    gal_label: "Галерия",
    gal_title: "Вътре в Massage Corner",
    gal_sub:
      "Тихи кътчета, създадени, за да отпочинете тялото и духа си истински.",

    video_label: "Видео",
    video_title: "Миг на спокойствие",
    video_sub:
      "Надникнете в изживяването, което ви очаква в Massage Corner София.",

    about_label: "За нас",
    about_title: "Автентичен тайландски уелнес в София",
    about_p1:
      "Добре дошли в Massage Corner — спокойно убежище на тайландското изкуство на лечение, намиращо се в сърцето на София. Нашите опитни терапевти внасят древната мъдрост на традиционната тайландска медицина във всяка процедура.",
    about_p2:
      "Съчетаваме изпитани техники с топла, приветлива атмосфера, за да ви осигурим наистина възстановяващо преживяване.",
    feat_certified: "Сертифицирани терапевти",
    feat_oils: "Натурални масла и билки",
    feat_calm: "Спокойна и уютна обстановка",
    feat_flexible: "Гъвкаво работно време",

    cta_label: "Запазете своя час",
    cta_title: "Готови ли сте да се отпуснете?",
    cta_sub:
      "Запазете своя час онлайн само в няколко стъпки. Нашият екип ще потвърди резервацията ви в рамките на 24 часа.",
    cta_btn: "Резервирай",

    book_pre: "Запазете своя час",
    book_title: "Резервирайте процедура",
    book_sub:
      "Изберете услуга, дата и час, които ви устройват, след което попълнете данните си за контакт. Нашият екип ще потвърди резервацията.",

    f_service: "Услуга",
    f_date: "Дата",
    f_time: "Час",
    f_name: "Име и фамилия",
    f_phone: "Телефон",
    f_notes: "Бележки (незадължително)",
    f_submit: "Потвърди резервацията",
    f_submitting: "Запазване…",
    f_required: "Моля, попълнете всички полета",
    name_ph: "напр. Мария Иванова",
    phone_ph: "+359 88 123 4567",
    notes_ph: "напр. предпочитам жена терапевт / болка в кръста",

    slot_pick_date: "Първо изберете дата…",
    slot_loading: "Проверка на свободни часове…",
    slot_pick: "Изберете час…",
    slot_full: "Зает",
    slot_all_full: "Всички часове за днес са заети. Моля, изберете друга дата.",

    succ_title: "Резервацията е получена!",
    succ_sub:
      "Благодаря ви. Ще потвърдим часа ви в рамките на 24 часа по имейл или телефон.",
    succ_code: "Вашият код за резервация",
    succ_again: "Нова резервация",
    succ_home: "Към началото",

    cont_label: "Контакти",
    cont_title: "Намерете ни в София",
    cont_address: "Адрес",
    cont_phone: "Телефон",
    cont_hours: "Работно време",
    cont_hours_val: "Понеделник – Неделя: 10:00 – 21:00",
    address_val: "ул. Сребърна 15, София 1407, България",
    rights: "Всички права запазени.",
    nav_home: "Начало",
    admin_login: "Админ вход",
  },
} satisfies Record<Lang, Record<string, string>>;

export type DictKey = keyof (typeof dict)["en"];
