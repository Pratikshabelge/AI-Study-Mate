
const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");
const messages = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const panelTitle = document.getElementById("panelTitle");
const suggestions = document.getElementById("suggestions");

let currentMode = "chat";

const modes = {
  chat: {
    title: "Chat with StudyMate",
    placeholder: "Ask a question or paste your study notes..."
  },
  summarize: {
    title: "Summarize Your Notes",
    placeholder: "Paste your notes to summarize..."
  },
  quiz: {
    title: "Generate a Practice Quiz",
    placeholder: "Enter a topic or paste notes for a quiz..."
  },
  explain: {
    title: "Explain a Topic",
    placeholder: "Which topic would you like explained?"
  }
};

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  message.appendChild(bubble);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;

  return message;
}

document.querySelectorAll("[data-mode]").forEach(button => {
  button.addEventListener("click", () => {
    currentMode = button.dataset.mode;

    panelTitle.textContent = modes[currentMode].title;
    input.placeholder = modes[currentMode].placeholder;
    suggestions.style.display =
      currentMode === "chat" ? "flex" : "none";

    document.querySelectorAll(".feature").forEach(card => {
      card.style.borderColor =
        card === button ? "#a78bfa" : "#ffffff13";
    });

    input.focus();
  });
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    form.requestSubmit();
  });
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  const message = input.value.trim();

  if (!message) {
    input.focus();
    return;
  }

  addMessage("user", message);
  input.value = "";
  sendBtn.disabled = true;
  input.disabled = true;

  const loading = addMessage("assistant", "✦ StudyMate is thinking...");

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        mode: currentMode
      })
    });

    const data = await response.json();
    loading.remove();

    if (!response.ok) {
      addMessage("assistant", data.error || "Something went wrong.");
      return;
    }

    addMessage("assistant", data.answer);
  } catch (error) {
    loading.remove();

    addMessage(
      "assistant",
      "Could not connect to the server. Check that npm start is running."
    );

    console.error(error);
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
