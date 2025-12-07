def parse_time_input(input_str: str) -> int:
    """
    Parses time string into seconds.
    Formats:
    - "X.Y" -> X minutes, Y seconds
    - "X.Y.Z" -> X hours, Y minutes, Z seconds
    - "X" -> X minutes (legacy/default behavior)
    """
    parts = input_str.split('.')
    
    try:
        if len(parts) == 1:
            # Treat as minutes by default, or maybe seconds if the user explicitly wants seconds?
            # User said "dobav ne tolko v minutah no i sekundah". 
            # But previously it was minutes. 
            # Let's assume if it's a raw number, it's minutes to be safe, 
            # unless we change the UI to say "Enter seconds".
            # The prompt says "Enter time...".
            # Let's treat single number as minutes.
            return int(parts[0]) * 60
            
        elif len(parts) == 2:
            # M.S
            minutes = int(parts[0])
            seconds = int(parts[1])
            return minutes * 60 + seconds
            
        elif len(parts) == 3:
            # H.M.S
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = int(parts[2])
            return hours * 3600 + minutes * 60 + seconds
            
    except ValueError:
        return 0
    
    return 0

def format_seconds(seconds: int) -> str:
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}ч {m}м {s}с"
    elif m > 0:
        return f"{m}м {s}с"
    else:
        return f"{s}с"

def parse_time_string(time_str: str) -> int:
    """
    Parses a string like '10s', '5m', '1h', '1d' into seconds.
    """
    if not time_str:
        return 0
    
    time_str = time_str.lower().strip()
    unit = time_str[-1]
    
    try:
        if unit.isdigit():
            # Default to seconds if no unit provided? Or minutes? 
            # For admin commands usually seconds or minutes. Let's say seconds for mute.
            return int(time_str)
        
        value = int(time_str[:-1])
        
        if unit == 's':
            return value
        elif unit == 'm':
            return value * 60
        elif unit == 'h':
            return value * 3600
        elif unit == 'd':
            return value * 86400
        elif unit == 'w':
            return value * 604800
        else:
            return 0
    except ValueError:
        return 0
