const AI_CHAT_ENDPOINT = "";
const CHAT_MAX_LENGTH = 1200;

const chatLauncher = document.querySelector("#chat-launcher");
const chatWindow = document.querySelector("#chat-window");
const chatMessages = document.querySelector("#chat-messages");
const chatSuggestions = document.querySelector("#chat-suggestions");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatSend = document.querySelector("#chat-send");
const chatStatus = document.querySelector("#chat-status");
const chatClear = document.querySelector("#chat-clear");
const chatMinimize = document.querySelector("#chat-minimize");
const chatClose = document.querySelector("#chat-close");
const chatMode = document.querySelector("#chat-mode");

const welcomeMessage = "Hey! 👋 Welcome to Samkesh's portfolio.\n\nI'm Samkesh's AI assistant. I can help you explore his skills, projects, experience and contact information.\n\nWhat would you like to know?";
const conversation = [];
let isWaitingForResponse = false;
let closeTimer;

const portfolioKnowledge = {
  about: "Samkesh Giri is an aspiring AI Automation Developer who is learning by building practical workflows. He is interested in making repetitive work simpler with AI and automation.",
  skills: "Samkesh's portfolio lists workflow automation with Make, n8n and Zapier; prompt engineering with OpenAI and AI agents; API integration with REST APIs, JSON and webhooks; and web fundamentals with HTML, CSS and JavaScript.",
  projects: "The portfolio features three concept projects: an AI-assisted email sorter using Make, OpenAI and the Gmail API; a meeting-notes summarizer that sends action items to a task board using n8n, OpenAI and Notion; and a weekly reporting workflow using Zapier, Google Sheets and OpenAI. They are learning concepts, not claimed client deployments.",
  tools: "Tools listed in Samkesh's portfolio include Make, n8n, Zapier, OpenAI, Gmail API, Notion, Google Sheets, REST APIs, JSON and webhooks.",
  automation: "AI automation combines workflow tools and AI to help handle repetitive tasks. Samkesh is learning to connect triggers, AI processing and follow-up actions with tools such as Make, n8n, Zapier and APIs.",
  web: "The web technologies listed in Samkesh's portfolio are HTML, CSS and JavaScript.",
  contact: "The portfolio has a contact form, but no verified public email, GitHub or LinkedIn profile is listed yet. Add a real recipient address to CONTACT_EMAIL in script.js to enable the form.",
  experience: "Specific employment history, client work, education and certifications are not currently listed in the portfolio."
};

const questionIntents = [
  { answer: "contact", keywords: ["contact", "email", "reach", "get in touch", "message him", "hire", "github", "linkedin", "social profile"] },
  { answer: "experience", keywords: ["experience", "education", "certification", "certificate", "client", "employment", "work history", "job history"] },
  { answer: "projects", keywords: ["project", "show me his work", "portfolio", "built", "build", "demo"] },
  { answer: "tools", keywords: ["tool", "platform", "make", "n8n", "openai", "zapier", "notion", "gmail", "google sheets", "webhook", "api"] },
  { answer: "web", keywords: ["html", "css", "javascript", "web development", "programming language", "coding"] },
  { answer: "skills", keywords: ["skill", "technology", "technologies", "what can he do", "what does he know"] },
  { answer: "automation", keywords: ["automation", "automate", "ai developer", "ai development"] },
  { answer: "about", keywords: ["who is samkesh", "about samkesh", "tell me about", "who are you", "samkesh"] }
];

function normalizeQuestion(value) {
  return value.toLowerCase().replace(/[^a-z0-9+#\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getContactResponse() {
  const emailLink = document.querySelector("#contact-email-link");
  if (emailLink) {
    return `Use the contact form or email Samkesh at ${emailLink.textContent}. No GitHub or LinkedIn profile is listed.`;
  }
  return portfolioKnowledge.contact;
}

function getFAQResponse(question) {
  const normalizedQuestion = normalizeQuestion(question);
  const greeting = /^(hi|hello|hey|hiya)( there)?[!. ]*$|^(good morning|good afternoon|good evening)[!. ]*$/.test(normalizedQuestion);

  if (greeting) {
    return "Hi there! Ask me about Samkesh's skills, projects, tools or how to get in touch.";
  }

  const matchingIntent = questionIntents.find((intent) =>
    intent.keywords.some((keyword) => normalizedQuestion.includes(keyword))
  );

  if (matchingIntent) {
    if (matchingIntent.answer === "contact") return getContactResponse();
    return portfolioKnowledge[matchingIntent.answer];
  }

  return "I can help with Samkesh's listed skills, projects, tools and contact details. I don't have that information in the portfolio—try asking about one of those topics.";
}

async function getAIResponse(messages) {
  if (!AI_CHAT_ENDPOINT) {
    const lastMessage = messages[messages.length - 1];
    return getFAQResponse(lastMessage ? lastMessage.content : "");
  }

  const response = await fetch(AI_CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error(`Chat service returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error("Chat service returned an invalid response.");
  }

  return data.reply.trim();
}

function appendMessage(role, content) {
  const message = document.createElement("article");
  message.className = `chat-message ${role === "user" ? "user-message" : "assistant-message"}`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = role === "user" ? "S" : "✳";

  const bubble = document.createElement("p");
  bubble.className = "message-bubble";
  bubble.textContent = content;

  message.append(avatar, bubble);
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function showWelcomeMessage() {
  conversation.push({ role: "assistant", content: welcomeMessage });
  appendMessage("assistant", welcomeMessage);
  chatSuggestions.hidden = false;
}

function setComposerState() {
  chatSend.disabled = isWaitingForResponse || !chatInput.value.trim();
}

function resizeComposer() {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 108)}px`;
}

function openChat() {
  window.clearTimeout(closeTimer);
  chatWindow.hidden = false;
  chatWindow.setAttribute("aria-hidden", "false");
  chatWindow.classList.remove("is-minimized");
  chatMinimize.setAttribute("aria-expanded", "true");
  chatMinimize.setAttribute("aria-label", "Minimize chat");
  chatLauncher.setAttribute("aria-expanded", "true");
  window.requestAnimationFrame(() => chatWindow.classList.add("is-open"));
  window.setTimeout(() => chatInput.focus(), 80);
}

function closeChat() {
  chatWindow.classList.remove("is-open");
  chatWindow.setAttribute("aria-hidden", "true");
  chatLauncher.setAttribute("aria-expanded", "false");
  chatLauncher.focus();
  closeTimer = window.setTimeout(() => {
    if (!chatWindow.classList.contains("is-open")) {
      chatWindow.hidden = true;
    }
  }, 220);
}

function toggleMinimized() {
  const isExpanded = chatMinimize.getAttribute("aria-expanded") === "true";
  chatWindow.classList.toggle("is-minimized", isExpanded);
  chatMinimize.setAttribute("aria-expanded", String(!isExpanded));
  chatMinimize.setAttribute("aria-label", isExpanded ? "Expand chat" : "Minimize chat");
  chatMinimize.setAttribute("title", isExpanded ? "Expand chat" : "Minimize chat");
  if (!isExpanded) chatInput.focus();
}

function clearConversation() {
  if (isWaitingForResponse) return;
  conversation.length = 0;
  chatMessages.replaceChildren();
  chatStatus.textContent = "";
  chatSuggestions.hidden = false;
  showWelcomeMessage();
  chatInput.value = "";
  resizeComposer();
  setComposerState();
  chatInput.focus();
}

async function sendMessage(rawMessage) {
  const message = rawMessage.trim();
  if (!message) {
    chatStatus.textContent = "Type a message before sending.";
    chatInput.focus();
    return;
  }

  if (message.length > CHAT_MAX_LENGTH) {
    chatStatus.textContent = `Please keep your message under ${CHAT_MAX_LENGTH} characters.`;
    return;
  }

  if (isWaitingForResponse) return;

  chatStatus.textContent = "";
  chatSuggestions.hidden = true;
  conversation.push({ role: "user", content: message });
  appendMessage("user", message);
  chatInput.value = "";
  resizeComposer();
  isWaitingForResponse = true;
  setComposerState();

  const typing = document.createElement("div");
  typing.className = "chat-message assistant-message typing-message";
  typing.setAttribute("role", "status");
  typing.setAttribute("aria-label", "Samkesh AI Assistant is typing");
  const typingAvatar = document.createElement("span");
  typingAvatar.className = "message-avatar";
  typingAvatar.setAttribute("aria-hidden", "true");
  typingAvatar.textContent = "✳";
  const typingBubble = document.createElement("span");
  typingBubble.className = "typing-indicator";
  for (let dot = 0; dot < 3; dot += 1) {
    typingBubble.append(document.createElement("i"));
  }
  typing.append(typingAvatar, typingBubble);
  chatMessages.append(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const answer = await getAIResponse(conversation.slice());
    conversation.push({ role: "assistant", content: answer });
    typing.remove();
    appendMessage("assistant", answer);
  } catch (error) {
    console.error("Chatbot request failed.", error);
    typing.remove();
    const errorMessage = "I couldn't reach the chat service just now. Please try again later, or use the contact section to get in touch.";
    conversation.push({ role: "assistant", content: errorMessage });
    appendMessage("assistant", errorMessage);
  } finally {
    isWaitingForResponse = false;
    setComposerState();
    chatInput.focus();
  }
}

chatLauncher.addEventListener("click", () => {
  if (chatWindow.hidden) {
    openChat();
  } else {
    closeChat();
  }
});

chatClose.addEventListener("click", closeChat);
chatMinimize.addEventListener("click", toggleMinimized);
chatClear.addEventListener("click", clearConversation);

chatSuggestions.addEventListener("click", (event) => {
  const suggestion = event.target.closest("button[data-question]");
  if (suggestion) sendMessage(suggestion.dataset.question);
});

chatInput.addEventListener("input", () => {
  chatStatus.textContent = "";
  resizeComposer();
  setComposerState();
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(chatInput.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !chatWindow.hidden && chatWindow.classList.contains("is-open")) {
    closeChat();
  }
});

chatMode.textContent = AI_CHAT_ENDPOINT
  ? "Connected assistant · Responses use portfolio context"
  : "Portfolio FAQ mode · No live AI model connected";

showWelcomeMessage();
setComposerState();
