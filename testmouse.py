from pynput import mouse, keyboard
from pynput.mouse import Button, Controller
import time
import threading

# Initialize mouse controller
mouse_controller = Controller()

# Variables to track state
is_holding = False
scroll_level = 0

def scroll_down(level):
    """Scroll down by the specified level."""
    mouse_controller.scroll(0, -level)

def on_click(x, y, button, pressed):
    """Handle mouse click events."""
    global is_holding
    if button == Button.left:
        if pressed:
            # On left click, set holding state and perform click
            is_holding = True
            mouse_controller.click(Button.left)
            # Start scrolling in a separate loop to avoid blocking
            while is_holding:
                scroll_down(scroll_level)
                time.sleep(0.05)  # Adjust for smooth scrolling without lag
        else:
            # On release, stop scrolling
            is_holding = False

def main():
    global scroll_level
    # Get scroll level from user input
    try:
        scroll_level = float(input("Enter scroll level (e.g., 1 for slow, 5 for fast): "))
    except ValueError:
        print("Invalid input. Using default scroll level of 1.")
        scroll_level = 1

    # Set up mouse listener
    mouse_listener = mouse.Listener(on_click=on_click)
    mouse_listener.start()

    print("Script running. Hold left mouse button to click and scroll down. Press 'esc' to exit.")

    # Set up keyboard listener to exit on 'esc'
    def on_press(key):
        if key == keyboard.Key.esc:
            mouse_listener.stop()
            return False

    with keyboard.Listener(on_press=on_press) as keyboard_listener:
        keyboard_listener.join()

try:
    main()
except KeyboardInterrupt:
    print("\nProgram stopped by user")

if __name__ == "__main__":
    main() 