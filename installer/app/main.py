import sys
import threading
import tkinter as tk
from tkinter.scrolledtext import ScrolledText
import io
import time

# Import your app start function here
from .flask import start_flask_app
class TextRedirector(io.TextIOBase):
    def __init__(self, text_widget, tag="stdout"):
        super().__init__()
        self.text_widget = text_widget
        self.tag = tag

    def write(self, str):
        def append():
            self.text_widget.configure(state="normal")
            self.text_widget.insert(tk.END, str, (self.tag,))
            self.text_widget.see(tk.END)
            self.text_widget.configure(state="disabled")

        self.text_widget.after(0, append)

    def flush(self):
        pass


def start():
    root = tk.Tk()
    root.title("EpicStaff Console")

    st = ScrolledText(
        root, state="disabled", width=100, height=30, bg="black", fg="white"
    )
    st.pack(fill=tk.BOTH, expand=True)

    # Redirect stdout and stderr to the ScrolledText widget
    sys.stdout = TextRedirector(st, "stdout")
    sys.stderr = TextRedirector(st, "stderr")

    # Start Flask app in background thread
    threading.Thread(target=start_flask_app, daemon=True).start()

    # Simple styling for stdout and stderr
    st.tag_config("stdout", foreground="white")
    st.tag_config("stderr", foreground="red")

    root.mainloop()
