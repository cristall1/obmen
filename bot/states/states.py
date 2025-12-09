from aiogram.fsm.state import State, StatesGroup

class OnboardingState(StatesGroup):
    waiting_for_language = State()
    waiting_for_tos = State()
    waiting_for_phone = State()
    waiting_for_code = State()
    waiting_for_password = State()  # For 2FA


class RegistrationState(StatesGroup):
    """FSM for Bot-First Registration Flow"""
    waiting_for_nickname = State()
    waiting_for_password = State()
