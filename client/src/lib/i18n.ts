import type { Language } from '@/types';

type TranslationKey = string;

const translations: Record<Language, Record<TranslationKey, string>> = {
  ru: {
    // Header
    appName: 'NellX',

    // Registration
    registration: 'Регистрация',
    name: 'Имя',
    yourName: 'Ваше имя',
    phone: 'Телефон',
    role: 'Роль',
    selectRole: 'Выберите роль',
    client: 'Пользователь',
    exchanger: 'Обменник',
    agreeTerms: 'Я согласен с условиями использования',
    next: 'Далее',
    continue: 'Продолжить',

    // Role Selection
    selectYourRole: 'Выберите роль',
    clientDesc: 'Создавайте заявки и ищите предложения',
    exchangerDesc: 'Предоставляйте услуги обмена',

    // Feed
    feed: 'Лента',
    filter: 'Фильтр',
    writeMessage: 'Написать',
    createRequest: 'Создать заявку',
    best: 'Лучший',

    // Create Request
    createRequestTitle: 'Создать заявку',
    amount: 'Сумма',
    enterAmount: 'Введите сумму',
    send: 'Отправить',
    receive: 'Получить',
    place: 'Место',
    enterPlace: 'Укажите место',
    type: 'Тип',
    delivery: 'Доставка',
    pickup: 'Самовывоз',
    comment: 'Комментарий',
    addComment: 'Добавьте комментарий для обменника',

    // Offers
    offers: 'Предложения',
    byRate: 'По курсу',
    exchangerLabel: 'Обменник',

    // Status
    requestStatus: 'Статус заявки',
    requestCreated: 'Заявка создана',
    awaitingPayment: 'Ожидание платежа',
    dealDetails: 'Детали сделки',

    // Exchanger Inbox
    incoming: 'Входящие',
    from: 'От',
    new: 'Новое',

    // Telegram Handoff
    continueInTelegram: 'Продолжить в Telegram',
    transferredData: 'Передаваемые данные',
    openTelegramChat: 'Открыть чат в Telegram',
    redirectNotice: 'Вы будете перенаправлены в Telegram для завершения сделки',

    // Profile
    profile: 'Профиль',
    verification: 'Верификация',
    changeRoleInProfile: 'Роль фиксирована',
    phoneNumber: 'Номер телефона',
    statuses: 'Статусы',
    activeRequests: 'Активных заявок',
    completedDeals: 'Завершённых сделок',
    contacts: 'Контакты',
    edit: 'Редактировать',

    // Tab Navigation
    tabFeed: 'Лента',
    tabCreate: 'Заявка',
    tabOffers: 'Офферы',
    tabProfile: 'Профиль',

    // Validation
    nameRequired: 'Введите имя',
    phoneRequired: 'Введите телефон',
    usernameRequired: 'Укажите ваш Telegram @username',
    verificationCode: 'Код подтверждения',
    sendCode: 'Отправить код',
    resend: 'Отправить снова',
    sending: 'Отправляем...',
    codeRequired: 'Подтвердите номер кодом',
    invalidCode: 'Неверный код',
    verify: 'Подтвердить',
    verifying: 'Проверяем...',
    codeSendFailed: 'Не удалось отправить код',
    messageSent: 'Сообщение отправлено в Telegram',
    messageFailed: 'Не удалось отправить сообщение',
    noRecipient: 'Не найден получатель',
    agreeRequired: 'Согласитесь с условиями',

    // Additional Keys
    choose: 'Выбрать',
    bestOffer: 'Лучший',
    sendOffer: 'Отправить оффер',
    rate: 'Курс',
    eta: 'Время',
    submitOffer: 'Отправить',
    orderIdLabel: 'ID заказа',
    orderDetails: 'Детали заказа',
    amountLabel: 'Сумма',
    openTelegram: 'Открыть в Telegram',
    verified: 'Проверен',
    created: 'Создана',
    offerAcceptedShort: 'Принято',
    inProgress: 'В процессе',
    done: 'Завершено',
    chatInTelegram: 'Открыть чат в Telegram',
    minutes: 'мин',
    role_client: 'Клиент',
    role_exchanger: 'Обменник',

    // Feed Search & Post Details
    searchPlaceholder: 'Поиск заявок...',
    postDetails: 'Детали заявки',
    description: 'Описание',
    acceptedCurrencies: 'Принимаемые валюты',
    reviews: 'Отзывы',
    averageRating: 'Средний рейтинг',
    write: 'Написать',
    createWithThis: 'Создать заявку (с этим)',
    language: 'Язык',
    addReview: 'Добавить отзыв',
    yourRating: 'Ваша оценка',
    yourComment: 'Ваш комментарий',
    publish: 'Опубликовать',

    // Onboarding
    welcomeTitle: 'Добро пожаловать в NellX',
    welcomeFeature1: 'Быстрый и безопасный обмен валют',
    welcomeFeature2: 'Работаем с криптовалютой и фиатом',
    welcomeFeature3: 'Прозрачные условия и поддержка 24/7',
    getStarted: 'Начать',
    alreadyHaveAccount: 'У меня уже есть аккаунт',

    // Categories
    subscriptions: 'Подписки',
    other: 'Прочее',

    // Terms & Auth
    terms: 'Условия',
    agree: 'Согласен',
    close: 'Закрыть',
    login: 'Вход',
    loginButton: 'Войти',
    createAccount: 'Создать аккаунт',
    switchTo: 'Сменить на',

    // Add Post
    addPost: 'Добавить пост',
    title: 'Заголовок',
    enterTitle: 'Введите заголовок',
    price: 'Цена',
    imageUrl: 'URL изображения',
    enterDescription: 'Введите описание',
    category: 'Категория',
    myPost: 'Мой пост',
    sell: 'Продать',
    buy: 'Купить',
    saveChanges: 'Сохранить изменения',
    editPost: 'Редактировать пост',
    acceptOffer: 'Принять предложение',
    confirmAcceptBid: 'Принять это предложение? Заявка будет закрыта.',
    offerAccepted: 'Предложение принято',
    orderClosed: 'Заявка закрыта',
  },
  uz: {
    // Header
    appName: 'NellX',

    // Registration
    registration: 'Рўйхатдан ўтиш',
    name: 'Исм',
    yourName: 'Исмингиз',
    phone: 'Телефон',
    role: 'Роль',
    selectRole: 'Рольни танланг',
    client: 'Фойдаланувчи',
    exchanger: 'Алмаштиргич',
    agreeTerms: 'Мен фойдаланиш шартларига розиман',
    next: 'Кейинги',
    continue: 'Давом этиш',

    // Role Selection
    selectYourRole: 'Рольни танланг',
    clientDesc: 'Ариза яратинг ва таклифларни қидиринг',
    exchangerDesc: 'Алмаштириш хизматларини тақдим этинг',

    // Feed
    feed: 'Лента',
    filter: 'Филтр',
    writeMessage: 'Хабар юбор',
    createRequest: 'Арз яратиш',
    best: 'Энг яхши',

    // Create Request
    createRequestTitle: 'Арз яратиш',
    amount: 'Сумма',
    enterAmount: 'Суммани киритинг',
    send: 'Юбориш',
    receive: 'Қабул қилиш',
    place: 'Жой',
    enterPlace: 'Жойни кўрсатинг',
    type: 'Тип',
    delivery: 'Етказиб бериш',
    pickup: 'Ўзи олиш',
    comment: 'Изох',
    addComment: 'Алмаштиргич учун изох қўшинг',

    // Offers
    offers: 'Таклифлар',
    byRate: 'Курс бўйича',
    exchangerLabel: 'Алмаштиргич',

    // Status
    requestStatus: 'Ариза ҳолати',
    requestCreated: 'Ариза яратилди',
    awaitingPayment: 'Тўловни кутиш',
    dealDetails: 'Битим тафсилотлари',

    // Exchanger Inbox
    incoming: 'Кирувчи',
    from: 'Дан',
    new: 'Янги',

    // Telegram Handoff
    continueInTelegram: 'Telegramда давом этиш',
    transferredData: 'Узатиладиган маълумотлар',
    openTelegramChat: 'Telegram чатини очиш',
    redirectNotice: 'Битимни якунлаш учун Telegramга йўналтирилади',

    // Profile
    profile: 'Профил',
    verification: 'Тасдиқлаш',
    changeRoleInProfile: 'Роль ўзгартириш ёпилган',
    phoneNumber: 'Телефон рақами',
    statuses: 'Статуслар',
    activeRequests: 'Фаол аризалар',
    completedDeals: 'Якунланган битимлар',
    contacts: 'Контактлар',
    edit: 'Таҳрирлаш',

    // Tab Navigation
    tabFeed: 'Лента',
    tabCreate: 'Ариза',
    tabOffers: 'Таклифлар',
    tabProfile: 'Профил',

    // Validation
    nameRequired: 'Исмни киритинг',
    phoneRequired: 'Телефонни киритинг',
    usernameRequired: 'Telegram @username киритинг',
    verificationCode: 'Тасдиқ коди',
    sendCode: 'Код юбориш',
    resend: 'Қайта юбориш',
    sending: 'Юборилмоқда...',
    codeRequired: 'Кодни тасдиқланг',
    invalidCode: 'Нотўғри код',
    verify: 'Тасдиқлаш',
    verifying: 'Текширилмоқда...',
    codeSendFailed: 'Код юбориб бўлмади',
    messageSent: 'Хабар Telegramга юборилди',
    messageFailed: 'Хабар юборилмади',
    noRecipient: 'Қабул қилувчи топилмади',
    agreeRequired: 'Шартларга розилик беринг',

    // Additional Keys
    choose: 'Танлаш',
    bestOffer: 'Энг яхши',
    sendOffer: 'Таклиф юбориш',
    rate: 'Курс',
    eta: 'Вақт',
    submitOffer: 'Юбориш',
    orderIdLabel: 'Буюртма ID',
    orderDetails: 'Буюртма тафсилотлари',
    amountLabel: 'Сумма',
    openTelegram: 'Telegramда очиш',
    verified: 'Тасдиқланган',
    created: 'Яратилди',
    offerAcceptedShort: 'Қабул қилинди',
    inProgress: 'Жараёнда',
    done: 'Якунланди',
    chatInTelegram: 'Telegram чатини очиш',
    minutes: 'дақиқа',
    role_client: 'Мижоз',
    role_exchanger: 'Алмаштиргич',

    // Feed Search & Post Details
    searchPlaceholder: 'Аризаларни қидириш...',
    postDetails: 'Ариза тафсилотлари',
    description: 'Тавсиф',
    acceptedCurrencies: 'Қабул қилинадиган валюталар',
    reviews: 'Шарҳлар',
    averageRating: 'Ўртача баҳо',
    write: 'Ёзиш',
    createWithThis: 'Ариза яратиш (бу билан)',
    language: 'Тил',
    addReview: 'Шарҳ қўшиш',
    yourRating: 'Баҳоингиз',
    yourComment: 'Фикрингиз',
    publish: 'Нашр этиш',

    // Onboarding
    welcomeTitle: 'NellX га хуш келибсиз',
    welcomeFeature1: 'Тез ва хавфсиз валюта алмашиш',
    welcomeFeature2: 'Криптовалюта ва фиат билан ишлаймиз',
    welcomeFeature3: 'Шаффоф шартлар ва 24/7 қўллаб-қувватлаш',
    getStarted: 'Бошлаш',
    alreadyHaveAccount: 'Менда аллақачон аккаунт бор',

    // Categories
    subscriptions: 'Обуналар',
    other: 'Бошқа',

    // Terms & Auth
    terms: 'Шартлар',
    agree: 'Розиман',
    close: 'Ёпиш',
    login: 'Кириш',
    loginButton: 'Кириш',
    createAccount: 'Аккаунт яратиш',
    switchTo: 'Алмаштириш',

    // Add Post
    addPost: 'Пост қўшиш',
    title: 'Сарлавҳа',
    enterTitle: 'Сарлавҳани киритинг',
    price: 'Нарх',
    imageUrl: 'Расм URL',
    enterDescription: 'Тавсифни киритинг',
    category: 'Тоифа',
    myPost: 'Менинг постим',
    sell: 'Сотиш',
    buy: 'Сотиб олиш',
    saveChanges: 'Ўзгаришларни сақлаш',
    editPost: 'Постни таҳрирлаш',
    acceptOffer: 'Taklifni qabul qilish',
    confirmAcceptBid: 'Ushbu taklifni qabul qilasizmi? Buyurtma yopiladi.',
    offerAccepted: 'Taklif qabul qilindi',
    orderClosed: 'Buyurtma yopildi',
  }
};

export function t(key: TranslationKey, language: Language): string {
  return translations[language][key] || key;
}
