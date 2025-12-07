from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

router = Router()

DEFAULT_CURRENCIES = ["USD", "EGP", "EUR", "RUB", "UZS", "KGS", "KZT"]


class CalculatorState(StatesGroup):
    waiting_for_amount = State()
    selecting_currency = State()


def get_calculator_keyboard(currencies: list):
    buttons = []
    for curr in currencies:
        buttons.append([InlineKeyboardButton(text=f"💱 {curr}", callback_data=f"calc_curr_{curr}")])
    buttons.append([InlineKeyboardButton(text="🔙 Назад", callback_data="menu_main")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_amount_numpad(current_value: str):
    rows = [
        [InlineKeyboardButton(text=str(i), callback_data=f"calcnum_digit_{i}") for i in range(1, 4)],
        [InlineKeyboardButton(text=str(i), callback_data=f"calcnum_digit_{i}") for i in range(4, 7)],
        [InlineKeyboardButton(text=str(i), callback_data=f"calcnum_digit_{i}") for i in range(7, 10)],
        [
            InlineKeyboardButton(text="0", callback_data="calcnum_digit_0"),
            InlineKeyboardButton(text=".", callback_data="calcnum_dot"),
            InlineKeyboardButton(text="⌫", callback_data="calcnum_back"),
        ],
        [InlineKeyboardButton(text="✅ Посчитать", callback_data="calcnum_done")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


@router.callback_query(F.data == "menu_calculator")
async def show_calculator(callback: types.CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text(
        "Калькулятор валют.\nВыберите исходную валюту:",
        reply_markup=get_calculator_keyboard(DEFAULT_CURRENCIES),
    )


@router.callback_query(F.data.startswith("calc_curr_"))
async def process_currency_selection(callback: types.CallbackQuery, state: FSMContext):
    currency = callback.data.split("_")[2]
    await state.update_data(source_currency=currency, amount_input="")
    await state.set_state(CalculatorState.waiting_for_amount)
    await callback.message.edit_text(
        f"Введите сумму в {currency} с помощью кнопок ниже.\nТекущее: —",
        reply_markup=get_amount_numpad(""),
    )


@router.callback_query(F.data.startswith("calcnum_"), CalculatorState.waiting_for_amount)
async def process_amount_numpad(callback: types.CallbackQuery, state: FSMContext):
    action_parts = callback.data.split("_")
    action = action_parts[1]
    value = action_parts[2] if len(action_parts) > 2 else ""

    data = await state.get_data()
    amount_input = data.get("amount_input", "")

    if action == "digit":
        if len(amount_input) < 12:
            amount_input += value
    elif action == "dot":
        if "." not in amount_input:
            amount_input = amount_input or "0"
            amount_input += "."
    elif action == "back":
        amount_input = amount_input[:-1]
    elif action == "done":
        if not amount_input or amount_input in [".", "0."]:
            await callback.answer("Введите число", show_alert=True)
            return
        try:
            amount = float(amount_input)
        except ValueError:
            await callback.answer("Неверное число", show_alert=True)
            return

        source_curr = data.get("source_currency", "USD")
        from bot.services.rates_api import get_official_rates

        rates = await get_official_rates()
        if not rates:
            await callback.message.edit_text(
                "Нет данных от FastForex (проверьте FAST_FOREX_API_KEY).",
                reply_markup=get_calculator_keyboard(DEFAULT_CURRENCIES),
            )
            await state.clear()
            return

        result_text = f"💱 {amount:,.2f} {source_curr} =\n\n"
        targets = [c for c in DEFAULT_CURRENCIES if c != source_curr]

        for target in targets:
            if source_curr == "USD":
                rate_to_usd = 1.0
            else:
                usd_to_source = rates.get(source_curr)
                if not usd_to_source:
                    continue
                rate_to_usd = 1 / usd_to_source

            if target == "USD":
                usd_to_target = 1.0
            else:
                usd_to_target = rates.get(target)
                if not usd_to_target:
                    continue

            final_rate = rate_to_usd * usd_to_target
            converted_amount = amount * final_rate
            result_text += f"• {target}: {converted_amount:,.2f}\n"

        result_text += "\nПо данным FastForex"

        await callback.message.edit_text(result_text, reply_markup=get_calculator_keyboard(DEFAULT_CURRENCIES), parse_mode="Markdown")
        await state.clear()
        return

    await state.update_data(amount_input=amount_input)
    display = amount_input or "—"
    try:
        await callback.message.edit_text(
            f"Введите сумму:\nТекущее: {display}",
            reply_markup=get_amount_numpad(amount_input),
        )
    except Exception:
        pass
