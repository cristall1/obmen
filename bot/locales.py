MESSAGES = {
    'ru': {
        'new_order': "🆕 <b>Новая заявка #{order_id}</b>\n💵 <b>{amount} {currency}</b>\n📍 {location}\n🚚 {delivery_type}\n\nОткройте приложение, чтобы сделать предложение!",
        'make_offer': "💰 Сделать предложение",
        'open_order': "📱 Открыть заявку",
        'verification_code': "🔐 Ваш код подтверждения: <code>{code}</code>",
        'bid_accepted': "✅ Ваше предложение по заявке #{order_id} принято!\nКлиент: {name} ({phone})\n\nСвяжитесь с клиентом для завершения сделки.",
    },
    'uz': {
        'new_order': "🆕 <b>Yangi buyurtma #{order_id}</b>\n💵 <b>{amount} {currency}</b>\n📍 {location}\n🚚 {delivery_type}\n\nTaklif kiritish uchun ilovani oching!",
        'make_offer': "💰 Taklif kiritish",
        'open_order': "📱 Buyurtmani ochish",
        'verification_code': "🔐 Tasdiqlash kodingiz: <code>{code}</code>",
        'bid_accepted': "✅ Buyurtma #{order_id} bo'yicha taklifingiz qabul qilindi!\nMijoz: {name} ({phone})\n\nBitimni yakunlash uchun mijoz bilan bog'laning.",
    }
}

def get_message(lang, key, **kwargs):
    lang_dict = MESSAGES.get(lang, MESSAGES['ru'])
    msg = lang_dict.get(key, MESSAGES['ru'].get(key, key))
    return msg.format(**kwargs)
